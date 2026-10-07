"""動画の AI 補正（コマごと）。保育園トップの自動スライドの動画に使う（オーナーの指示 2026-10-07：
「Instagram に上げている動画を流したい」「画質が粗いのは必ず AI 補正できれいにして」）。

写真用の RealESRGAN_x4plus（tools/ai_upscale.py）はコマ数の多い動画には重すぎるので、
Real-ESRGAN の軽い汎用モデル realesr-general-x4v3（SRVGGNetCompact）を使う。
ノイズ除去版（wdn）と重みを混ぜて、ノイズ除去の強さ（denoise）を決める（公式の dni と同じ考え方）。
顔を描き直すモデル（GFPGAN など）は使わない。重みは公式リリースから取り、SHA-256 を照合する。

使い方：
    from ai_video import CompactUpscaler
    up = CompactUpscaler("/tmp/realesr-general-x4v3.pth", "/tmp/realesr-general-wdn-x4v3.pth", denoise=0.5)
    big = up(pil_image)   # 4 倍
"""
import hashlib

import torch
from torch import nn
from torch.nn import functional as F

from ai_upscale import Upscaler

GENERAL_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth"
GENERAL_SHA256 = "8dc7edb9ac80ccdc30c3a5dca6616509367f05fbc184ad95b731f05bece96292"
GENERAL_WDN_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-wdn-x4v3.pth"
GENERAL_WDN_SHA256 = "1641f8c4464b9f097c9fdda5589273713f67cf59f3d909e0bd688f0cee269dca"


def _sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def _state(path):
    s = torch.load(path, map_location="cpu", weights_only=True)
    return s.get("params", s.get("params_ema", s))


# basicsr の SRVGGNetCompact と同じ構造・同じ重みの名前（body.0 が最初の畳み込み、PReLU と畳み込みが交互、最後が 3×16ch）。
class SRVGGNetCompact(nn.Module):
    def __init__(self, feat=64, conv=32, scale=4):
        super().__init__()
        self.scale = scale
        body = [nn.Conv2d(3, feat, 3, 1, 1), nn.PReLU(num_parameters=feat)]
        for _ in range(conv):
            body += [nn.Conv2d(feat, feat, 3, 1, 1), nn.PReLU(num_parameters=feat)]
        body.append(nn.Conv2d(feat, 3 * scale * scale, 3, 1, 1))
        self.body = nn.ModuleList(body)
        self.upsampler = nn.PixelShuffle(scale)

    def forward(self, x):
        out = x
        for m in self.body:
            out = m(out)
        return self.upsampler(out) + F.interpolate(x, scale_factor=self.scale, mode="nearest")


class CompactUpscaler(Upscaler):
    def __init__(self, weights, wdn_weights=None, denoise=0.5, tile=400, pad=16):
        if _sha(weights) != GENERAL_SHA256:
            raise SystemExit("realesr-general-x4v3 の重みの SHA-256 が合いません")
        a = _state(weights)
        if wdn_weights and denoise < 1:
            if _sha(wdn_weights) != GENERAL_WDN_SHA256:
                raise SystemExit("realesr-general-wdn-x4v3 の重みの SHA-256 が合いません")
            b = _state(wdn_weights)
            a = {k: a[k] * denoise + b[k] * (1 - denoise) for k in a}
        self.model = SRVGGNetCompact()
        self.model.load_state_dict(a, strict=True)
        self.model.eval()
        self.scale = 4
        self.tile, self.pad = tile, pad
