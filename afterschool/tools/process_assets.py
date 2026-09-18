#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""元素材（fetch_assets.py が取得したもの）から site/assets/photos/ と site/assets/docs/ を作る。

画質の方針:
  - 引き伸ばしは一切しない。元より大きくは書き出さない。
  - 写真は WebP（品質は manifest の quality）。ロゴは透過を保ったまま WebP（ほぼ無劣化）。
  - 書き出し後に全ファイルを完全デコードして確認する（壊れた画像を本番に出さない）。
  - 元画像の寸法が manifest の expect と違えば「別のファイルが来ている」とみなして失敗する。

使い方:
  python3 afterschool/tools/process_assets.py              # afterschool/.assets-src/ から
  python3 afterschool/tools/process_assets.py --src DIR
"""
import argparse
import hashlib
import json
import os
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
MANIFEST = HERE / "assets_manifest.json"
PHOTOS = ROOT / "site" / "assets" / "photos"
DOCS = ROOT / "site" / "assets" / "docs"
MIN_PHOTO_BYTES = 8000


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def process_image(item: dict, src: Path, out: Path) -> str:
    im = Image.open(src)
    im.load()
    im = ImageOps.exif_transpose(im)
    if list(im.size) != item["expect"]:
        raise SystemExit(f"{item['name']}: expected {item['expect']}, got {list(im.size)} - 別のファイル？")
    if item["kind"] == "logo":
        # 透過ロゴはアルファを保ったまま。品質は高めに。
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        im.save(out, "WEBP", quality=92, method=6)
    else:
        im = im.convert("RGB")
        width = item["width"]
        if im.width > width:
            im = im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)
        im.save(out, "WEBP", quality=item["quality"], method=6)
    chk = Image.open(out)
    chk.load()  # 完全デコード
    if item["kind"] == "photo" and out.stat().st_size < MIN_PHOTO_BYTES:
        raise SystemExit(f"{out.name}: {out.stat().st_size} bytes は小さすぎる")
    return f"{chk.size[0]}x{chk.size[1]} {out.stat().st_size // 1024}KB"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=ROOT / ".assets-src")
    args = ap.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    PHOTOS.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    lines = []
    for item in manifest["files"]:
        src = args.src / item["name"]
        if not src.exists():
            raise SystemExit(f"{src} がない（先に fetch_assets.py を実行）")
        if sha256(src) != item["sha256"]:
            raise SystemExit(f"{item['name']}: SHA-256 が manifest と一致しない")
        if item["kind"] == "pdf":
            out = DOCS / item["output"]
            shutil.copyfile(src, out)
            with out.open("rb") as f:
                if f.read(5) != b"%PDF-":
                    raise SystemExit(f"{out.name}: PDF ではない")
            info = f"{out.stat().st_size // 1024}KB"
        else:
            out = PHOTOS / item["output"]
            info = process_image(item, src, out)
        line = f"  {item['output']:44s} {info}"
        print(line)
        lines.append(line)

    # 使わない素材の出力が残っていないか（例: 絵文字スタンプ入りの活動写真）
    expected = {i["output"] for i in manifest["files"]}
    stray = [p.name for p in list(PHOTOS.iterdir()) + list(DOCS.iterdir()) if p.name not in expected]
    if stray:
        raise SystemExit(f"manifest にない出力が残っている: {stray}")

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("### afterschool assets\n```\n" + "\n".join(lines) + "\n```\n")
    print("done.")


if __name__ == "__main__":
    main()
