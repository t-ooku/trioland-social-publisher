"""写真の AI 補正（超解像・ノイズとブロックノイズの除去）。

オーナーの指示（2026-10-07）：「HP の子どもたちが写っている写真の画質が粗いから AI 補正で綺麗にしてほしい。
トップページは特に」。保育園の写真の原本は SNS 用に書き出された 1200px 前後の JPEG で、
圧縮のブロックノイズが強い。引き伸ばし（Lanczos）では粗さがそのまま大きくなるので、
Real-ESRGAN（RealESRGAN_x4plus。実写向けの汎用モデル）で 4 倍に復元してから、
表示に必要な大きさ（2x 画面で枠いっぱい）まで縮める。

- 顔を作り直すモデル（GFPGAN など）は使わない。写っている子どもの顔・姿を AI が描き変えないようにするため。
- 重みは公式のリリースから取り、SHA-256 を照合する（違えば止める）。
- CPU で動く。torch だけを使う（モデルの構造はこのファイルに書いてある）。タイルに分けて処理する（つなぎ目が出ないよう重ねしろ 32px）。

使い方：
    from ai_upscale import Upscaler
    up = Upscaler("/tmp/RealESRGAN_x4plus.pth")
    big = up(pil_image)   # 4 倍の PIL.Image（RGB）
"""
import hashlib

import numpy as np
import torch
from torch import nn
from torch.nn import functional as F
from PIL import Image

WEIGHTS_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
WEIGHTS_SHA256 = "4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1"


def check_weights(path):
    h = hashlib.sha256(open(path, "rb").read()).hexdigest()
    if h != WEIGHTS_SHA256:
        raise SystemExit(f"AI 補正の重みの SHA-256 が合いません: {h}")


# RRDBNet（ESRGAN / Real-ESRGAN の生成器）。basicsr の実装（Apache-2.0）と同じ構造・同じ重みの名前。
# 外部のモデル読み込みライブラリ（torchvision が要る）に頼らず、torch だけで動かすためにここに置く。
class _RDB(nn.Module):
    def __init__(self, f=64, g=32):
        super().__init__()
        self.conv1 = nn.Conv2d(f, g, 3, 1, 1)
        self.conv2 = nn.Conv2d(f + g, g, 3, 1, 1)
        self.conv3 = nn.Conv2d(f + 2 * g, g, 3, 1, 1)
        self.conv4 = nn.Conv2d(f + 3 * g, g, 3, 1, 1)
        self.conv5 = nn.Conv2d(f + 4 * g, f, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class _RRDB(nn.Module):
    def __init__(self, f=64, g=32):
        super().__init__()
        self.rdb1, self.rdb2, self.rdb3 = _RDB(f, g), _RDB(f, g), _RDB(f, g)

    def forward(self, x):
        return self.rdb3(self.rdb2(self.rdb1(x))) * 0.2 + x


class RRDBNet(nn.Module):
    def __init__(self, f=64, blocks=23, g=32):
        super().__init__()
        self.scale = 4
        self.conv_first = nn.Conv2d(3, f, 3, 1, 1)
        self.body = nn.Sequential(*[_RRDB(f, g) for _ in range(blocks)])
        self.conv_body = nn.Conv2d(f, f, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(f, f, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(f, f, 3, 1, 1)
        self.conv_hr = nn.Conv2d(f, f, 3, 1, 1)
        self.conv_last = nn.Conv2d(f, 3, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        feat = self.conv_first(x)
        feat = feat + self.conv_body(self.body(feat))
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode="nearest")))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode="nearest")))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))


class Upscaler:
    def __init__(self, weights, tile=256, pad=32):
        check_weights(weights)
        state = torch.load(weights, map_location="cpu", weights_only=True)
        state = state.get("params_ema", state.get("params", state))
        self.model = RRDBNet()
        self.model.load_state_dict(state, strict=True)
        self.model.eval()
        self.scale = self.model.scale
        self.tile, self.pad = tile, pad

    def __call__(self, img):
        img = img.convert("RGB")
        x = torch.from_numpy(np.asarray(img, dtype=np.float32) / 255.).permute(2, 0, 1)[None]
        _, _, h, w = x.shape
        s, t, p = self.scale, self.tile, self.pad
        out = torch.zeros(1, 3, h * s, w * s)
        with torch.inference_mode():
            for y0 in range(0, h, t):
                for x0 in range(0, w, t):
                    y1, x1 = min(y0 + t, h), min(x0 + t, w)
                    py0, px0, py1, px1 = max(y0 - p, 0), max(x0 - p, 0), min(y1 + p, h), min(x1 + p, w)
                    o = self.model(x[:, :, py0:py1, px0:px1])
                    oy, ox = (y0 - py0) * s, (x0 - px0) * s
                    out[:, :, y0 * s:y1 * s, x0 * s:x1 * s] = o[:, :, oy:oy + (y1 - y0) * s, ox:ox + (x1 - x0) * s]
        a = out[0].clamp(0, 1).permute(1, 2, 0).numpy()
        return Image.fromarray((a * 255 + .5).astype(np.uint8))
