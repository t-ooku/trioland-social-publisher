#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""site/assets/photos/*.jpg を生成する。

入力は site/assets/photos-b64-v5/*.txt（base64 テキスト、リポジトリ内で唯一無事に
残っていた実写素材）。連結して base64 デコードすると 1600x900 の WebP になり、
4列×3行 = 12コマ（各 400x300）のフレームが並んでいる。

このスクリプトが必要な理由:
  過去に site/assets/umegaoka.jpg などがちょうど 15,000 バイトで切り詰められた
  壊れた JPEG としてコミットされ、本番が broken-image になっていた。バイナリを
  テキスト API 経由でコミットすると壊れるため、画像は必ず「テキスト入力から
  CI で生成してコミットする」か「git push で入れる」こと。

画質の方針:
  1コマの実解像度は 400x300 しかない。無理に引き伸ばすと必ず荒くなるので、
  書き出しは実解像度の 2 倍（縦長カットのみ 3 倍）までに留め、表示側は
  site.css で 400px 前後に制限している。大きな写真が必要なら元データが要る。

字幕について:
  SNS 動画のフレームのため、下部に焼き込みのテロップが入っているコマがある。
  該当コマは下端を切り落として除去している。
"""
import base64
import io
import pathlib
import sys

from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "site" / "assets" / "photos-b64-v5"
DST = ROOT / "site" / "assets" / "photos"

CELL_W, CELL_H, COLS = 400, 300, 4

# name, cell index, bottom crop ratio (焼き込みテロップの除去), scale
PLAN = [
    ("exterior",    0,  0.00, 2),   # 園舎外観（看板の園名は解像度不足で判読不可）
    ("life-room",   6,  0.16, 2),   # 室内あそび
    ("life-play",   7,  0.14, 2),   # 室内あそび（ソフトブロック）
    ("life-toys",   8,  0.15, 2),   # おもちゃ
    ("life-nature", 10, 0.26, 2),   # 生き物とのふれあい
    ("life-table",  9,  0.26, 2),   # 机を囲んで
    ("life-summer", 4,  0.00, 2),   # 夏のあそび
]
# 縦長カット: 左右のぼかし帯を落として中央のみ使う
PORTRAIT = ("life-water", 5, (88, 0, 312, 300), 3)


def load_sprite() -> Image.Image:
    parts = []
    for n in range(5):
        p = SRC / f"{n:02d}.txt"
        if not p.exists():
            sys.exit(f"missing source chunk: {p}")
        parts.append(p.read_text().strip())
    raw = base64.b64decode("".join(parts).replace("\n", "").replace(" ", ""))
    im = Image.open(io.BytesIO(raw))
    im.load()
    if im.size != (CELL_W * COLS, CELL_H * 3):
        sys.exit(f"unexpected sprite size: {im.size}")
    return im.convert("RGB")


def cell(sprite: Image.Image, index: int) -> Image.Image:
    r, c = divmod(index, COLS)
    return sprite.crop((c * CELL_W, r * CELL_H, (c + 1) * CELL_W, (r + 1) * CELL_H))


def emit(img: Image.Image, name: str, scale: int) -> None:
    out = img.resize((img.width * scale, img.height * scale), Image.LANCZOS)
    out = out.filter(ImageFilter.UnsharpMask(radius=1.1, percent=70, threshold=3))
    path = DST / f"{name}.jpg"
    out.save(path, "JPEG", quality=90, optimize=True, progressive=True, subsampling=0)
    # 書き出したファイルが本当に最後までデコードできることを確認する
    check = Image.open(path)
    check.load()
    print(f"  {name:14s} {check.size}  {path.stat().st_size:>7,} bytes")


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    sprite = load_sprite()
    print(f"sprite {sprite.size} -> {DST.relative_to(ROOT)}")
    for name, idx, crop_bottom, scale in PLAN:
        img = cell(sprite, idx)
        if crop_bottom:
            img = img.crop((0, 0, img.width, int(img.height * (1 - crop_bottom))))
        emit(img, name, scale)
    name, idx, box, scale = PORTRAIT
    emit(cell(sprite, idx).crop(box), name, scale)
    print("done.")


if __name__ == "__main__":
    main()
