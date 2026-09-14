#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""site/assets/photo-src/ の base64 チャンクから site/assets/photos/*.webp を復元する。

なぜこの仕組みが要るのか
------------------------
このリポジトリには過去、バイナリ画像が壊れた状態でコミットされ続けた歴史がある。

  site/assets/umegaoka.jpg        15,007 バイトで切り詰め
  site/assets/child1.jpg          15,009 バイトで切り詰め
  site/assets/child2.jpg          15,054 バイトで切り詰め
  site/assets/photos/komazawa-exterior.jpg   7,470 バイトで切り詰め（2026-09-14）

いずれも「本文をテキストとして渡すコミット API」でバイナリを送ったことが原因。
テキストAPIしか使えない環境からでも画像を壊さず入れられるように、
base64 テキストに分割してコミットし、CI 側でバイトに戻す。

安全装置
--------
manifest.json にチャンク単位と復元後ファイルの SHA-256 を持たせている。
1文字でも欠けたり化けたりしていれば、このスクリプトが**どのチャンクが壊れたかを名指しして失敗する**。
壊れた画像が本番に出ることはない。
"""
import base64
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "site" / "assets" / "photo-src"
DST = ROOT / "site" / "assets" / "photos"


def main() -> None:
    manifest_path = SRC / "manifest.json"
    if not manifest_path.exists():
        print(f"no manifest at {manifest_path}; nothing to decode")
        return

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    DST.mkdir(parents=True, exist_ok=True)
    failures = []

    for name, meta in manifest.items():
        parts = []
        for i, expected in enumerate(meta["chunks"]):
            chunk_path = SRC / f"{name}.{i:02d}.b64"
            if not chunk_path.exists():
                failures.append(f"{name}: チャンク {i:02d} が存在しません")
                break
            # 改行は輸送の都合で入れているだけなので、すべての空白を取り除いてから照合する。
            text = "".join(chunk_path.read_text(encoding="utf-8").split())
            actual = hashlib.sha256(text.encode()).hexdigest()[:16]
            if actual != expected:
                failures.append(
                    f"{name}: チャンク {i:02d} が壊れています "
                    f"(expected {expected}, got {actual}, {len(text)} chars)"
                )
                break
            parts.append(text)
        else:
            joined = "".join(parts)
            if len(joined) != meta["b64len"]:
                failures.append(
                    f"{name}: base64 の長さが違います "
                    f"(expected {meta['b64len']}, got {len(joined)})"
                )
                continue
            raw = base64.b64decode(joined)
            digest = hashlib.sha256(raw).hexdigest()
            if digest != meta["sha256"]:
                failures.append(f"{name}: 復元後の SHA-256 が一致しません")
                continue
            if len(raw) != meta["bytes"]:
                failures.append(
                    f"{name}: バイト数が違います (expected {meta['bytes']}, got {len(raw)})"
                )
                continue
            out = DST / f"{name}.webp"
            out.write_bytes(raw)
            print(f"  {name:22s} {len(raw):>8,} bytes  SHA-256 OK -> {out.relative_to(ROOT)}")

    if failures:
        print("\n復元に失敗しました:", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        sys.exit(1)

    print("done.")


if __name__ == "__main__":
    main()
