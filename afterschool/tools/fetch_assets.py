#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Google Drive から放デイサイトの元素材を取得し、SHA-256 で照合して保存する。

前提: Drive の「放課後デイ／画像」フォルダが「リンクを知っている全員（閲覧者）」になっていること。
      非公開のままだと Drive は HTML のログインページを返す。ハッシュが合わないので
      ここで止まり、壊れたファイルがサイトに出ることはない。

なぜ Drive 経由か:
  このリポジトリへの書き込みはテキスト用のコミット API しか使えない環境がある。
  バイナリをそこから入れると壊れる（保育園サイトで 15,000 バイトに切り詰められた
  JPEG が本番に出た前歴がある）。画像と PDF は必ずこの経路で入れる。

使い方:
  python3 afterschool/tools/fetch_assets.py            # → afterschool/.assets-src/ に保存
  python3 afterschool/tools/fetch_assets.py --dest DIR
"""
import argparse
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
MANIFEST = HERE / "assets_manifest.json"
DEFAULT_DEST = HERE.parent / ".assets-src"

DRIVE_URL = "https://drive.usercontent.google.com/download?id={id}&export=download&confirm=t"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(item: dict, dest: Path) -> str:
    out = dest / item["name"]
    if out.exists() and sha256(out) == item["sha256"]:
        return "cached"
    if not item["id"]:
        return "Drive のファイルIDが未設定（まだアップロードされていない）"
    req = urllib.request.Request(DRIVE_URL.format(id=item["id"]), headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    out.write_bytes(data)
    if len(data) != item["bytes"]:
        head = data[:200].decode("utf-8", "replace")
        if b"<html" in data[:2000].lower():
            return f"Drive が HTML を返した（共有設定が非公開のまま）: {head!r}"
        return f"サイズが違う (expected {item['bytes']}, got {len(data)})"
    actual = sha256(out)
    if actual != item["sha256"]:
        return f"SHA-256 が一致しない (expected {item['sha256'][:16]}…, got {actual[:16]}…)"
    return "ok"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dest", type=Path, default=DEFAULT_DEST)
    args = ap.parse_args()
    args.dest.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    failures = []
    for item in manifest["files"]:
        try:
            status = fetch(item, args.dest)
        except Exception as e:  # noqa: BLE001
            status = f"取得エラー: {e}"
        print(f"  {item['name']:42s} {status}")
        if status not in ("ok", "cached"):
            failures.append(f"{item['name']}: {status}")
    if failures:
        print("\n取得に失敗しました:", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        sys.exit(1)
    print("all assets fetched and verified.")


if __name__ == "__main__":
    main()
