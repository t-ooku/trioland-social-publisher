# AI 補正の「絵っぽさ」を抑える：AI 拡大と通常の拡大（Lanczos）を混ぜ、うすい粒状感を足す
import sys, numpy as np
from PIL import Image, ImageFilter
def natural(orig, ai, mix=0.55, grain=2.2, seed=1):
    o = orig.convert("RGB").resize(ai.size, Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    a = np.asarray(ai.convert("RGB"), dtype=np.float32); l = np.asarray(o, dtype=np.float32)
    m = a * mix + l * (1 - mix)
    rng = np.random.default_rng(seed)
    n = rng.normal(0, grain, m.shape[:2])[..., None]          # 明るさだけの粒（色ノイズにしない）
    m = np.clip(m + n, 0, 255).astype(np.uint8)
    return Image.fromarray(m)
if __name__ == "__main__":
    o, a, out = sys.argv[1:4]
    natural(Image.open(o), Image.open(a)).save(out, "WEBP", quality=86, method=6)
