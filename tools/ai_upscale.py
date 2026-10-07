"""写真の AI 補正（超解像・ノイズとブロックノイズの除去）。

オーナーの指示（2026-10-07）：「HP の子どもたちが写っている写真の画質が粗いから AI 補正で綺麗にしてほしい。
トップページは特に」。保育園の写真の原本は SNS 用に書き出された 1200px 前後の JPEG で、
圧縮のブロックノイズが強い。引き伸ばし（Lanczos）では粗さがそのまま大きくなるので、
Real-ESRGAN（RealESRGAN_x4plus。実写向けの汎用モデル）で 4 倍に復元してから、
表示に必要な大きさ（2x 画面で枠いっぱい）まで縮める。

- 顔を作り直すモデル（GFPGAN など）は使わない。写っている子どもの顔・姿を AI が描き変えないようにするため。
- 重みは公式のリリースから取り、SHA-256 を照合する（違えば止める）。
- CPU で動く。タイルに分けて処理する（つなぎ目が出ないよう重ねしろ 32px）。

使い方：
    from ai_upscale import Upscaler
    up = Upscaler("/tmp/RealESRGAN_x4plus.pth")
    big = up(pil_image)   # 4 倍の PIL.Image（RGB）
"""
import hashlib

import numpy as np
import torch
from PIL import Image
from spandrel import ModelLoader

WEIGHTS_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
WEIGHTS_SHA256 = "4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1"


def check_weights(path):
    h = hashlib.sha256(open(path, "rb").read()).hexdigest()
    if h != WEIGHTS_SHA256:
        raise SystemExit(f"AI 補正の重みの SHA-256 が合いません: {h}")


class Upscaler:
    def __init__(self, weights, tile=256, pad=32):
        check_weights(weights)
        self.model = ModelLoader().load_from_file(weights).eval()
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
