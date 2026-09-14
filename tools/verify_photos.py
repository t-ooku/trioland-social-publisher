#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""site/assets/photos/ の画像が本当に最後まで開けることを確認する。

なぜシェルではなくPythonなのか
------------------------------
以前はワークフロー内で

    for f in site/assets/photos/*.jpg site/assets/photos/*.webp; do
      file -b "$f" | grep -qi jpeg
    done

としていたが、これには問題が三つあった。

  1. .webp が1つも無いとグロブが展開されず、リテラル文字列が stat に渡って落ちる。
  2. `file | grep -q` は grep が先に終了すると SIGPIPE になり、pipefail 下で落ちる。
  3. 落ちたときにどのファイルが原因か GitHub のログを開かないと分からない。

ここでは何が見えていて何が欠けているかを必ず出力し、
GITHUB_STEP_SUMMARY にも書くので、実行画面だけで原因が分かる。
"""
import os
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DST = ROOT / "site" / "assets" / "photos"

# 必ず存在しなければならない写真。トップページが参照しているため、
# 欠けたまま公開すると broken-image になる。
REQUIRED = ["komazawa-exterior.webp", "umegaoka-exterior.webp"]

MIN_BYTES = 20000


def main() -> None:
    lines = []
    failures = []

    if not DST.is_dir():
        failures.append(f"{DST.relative_to(ROOT)} が存在しません")
        files = []
    else:
        files = sorted(
            [p for p in DST.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".webp")]
        )

    names = {p.name for p in files}
    lines.append(f"検出した画像 {len(files)} 件: {sorted(names) if names else '(なし)'}")

    for want in REQUIRED:
        if want not in names:
            failures.append(f"必須の画像が見つかりません: {want}")

    for f in files:
        size = f.stat().st_size
        try:
            im = Image.open(f)
            im.load()
        except Exception as exc:  # 切り詰められた画像はここで必ず落ちる
            failures.append(f"{f.name}: 画像として開けません ({exc})")
            lines.append(f"  {f.name:26s} {size:>9,} bytes  NG")
            continue
        if size < MIN_BYTES:
            failures.append(f"{f.name}: {size:,} バイトしかありません（切り詰めの疑い）")
            lines.append(f"  {f.name:26s} {size:>9,} bytes  NG (too small)")
            continue
        lines.append(
            f"  {f.name:26s} {size:>9,} bytes  {im.format}  {im.size[0]}x{im.size[1]}  OK"
        )

    report = "\n".join(lines)
    print(report)

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write("### 画像の検証\n\n```\n" + report + "\n```\n")
            if failures:
                fh.write("\n**失敗**\n\n")
                for x in failures:
                    fh.write(f"- {x}\n")

    if failures:
        print("\n画像の検証に失敗しました:", file=sys.stderr)
        for x in failures:
            print(f"  - {x}", file=sys.stderr)
        sys.exit(1)

    print("\nすべての画像が最後まで開けました。")


if __name__ == "__main__":
    main()
