#!/usr/bin/env python3
"""Read-only public GET audit for the existing Trio Career daily site-smoke.

Checks whether the 2026-11-16 nursery search description and 2026-11-16
Digilumi facility consultation CTA/FAQ actually appear in live public HTML.
No form submissions, credentials, customer data, paid APIs or state changes.
"""
import argparse
import html
import os
import subprocess
from html.parser import HTMLParser
from pathlib import Path

HOIKU_URL = "https://hoiku.triocareer.jp/"
CORP_URL = "https://www.triocareer.jp"
DIGILUMI_PATHS = (
    "/service/digilumi/tokyooota/",
    "/service/digilumi/chibaabiko/",
    "/service/digilumi/chibaichikawa/",
    "/service/digilumi/tochigiutsunomiya/",
    "/service/digilumi/chibacyuo/",
    "/service/digilumi/tochigioyama/",
)
EXPECTED_HOIKU_DESCRIPTION = (
    "東京都世田谷区の企業主導型保育園トリオランド。駒沢大学駅から徒歩約6分の駒沢大学園と、"
    "梅ヶ丘駅から徒歩約1分の梅ヶ丘園。生後57日目〜2歳児クラス、平日7:30〜20:30、"
    "自園調理の給食。見学・入園のご相談を受け付けています。"
)
EXPECTED_DG_CTA = 'href="/contact/#form"'
EXPECTED_DG_FAQ = "このページの「見学・利用を相談する」ボタンか、お電話でお問い合わせください。"


class MetaDescription(HTMLParser):
    def __init__(self):
        super().__init__()
        self.value = None

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "meta":
            values = dict(attrs)
            if values.get("name", "").lower() == "description":
                self.value = html.unescape(values.get("content", ""))


def description(source):
    parser = MetaDescription()
    parser.feed(source)
    return parser.value


def fetch_public(url):
    # This uses the same curl transport as the existing site-smoke checks.
    # On 403, network failure or timeout, status is UNKNOWN, not zero/healthy.
    result = subprocess.run(
        ["curl", "--max-time", "15", "-fsSL", "-H", "Cache-Control: no-cache", url],
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout if result.returncode == 0 else None


def inspect_live():
    suffix = "?pdca_get=" + os.environ.get("GITHUB_RUN_ID", "manual")
    outcomes = []
    nursery = fetch_public(HOIKU_URL + suffix)
    if nursery is None:
        outcomes.append(("Nursery top meta description", "UNKNOWN (public GET failed)"))
    elif description(nursery) == EXPECTED_HOIKU_DESCRIPTION:
        outcomes.append(("Nursery top meta description", "MATCH"))
    else:
        outcomes.append(("Nursery top meta description", "MISMATCH (actual public meta differs)"))

    for path in DIGILUMI_PATHS:
        page = fetch_public(CORP_URL + path + suffix)
        label = "Digilumi " + path.split("/")[-2]
        if page is None:
            state = "UNKNOWN (public GET failed)"
        elif EXPECTED_DG_CTA in page and EXPECTED_DG_FAQ in page:
            state = "MATCH"
        else:
            state = "MISMATCH (CTA/FAQ not both present)"
        outcomes.append((label, state))
    return outcomes


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        sample = '<html><head><meta name="description" content="東京・世田谷区"></head></html>'
        assert description(sample) == "東京・世田谷区"
        assert description('<html><head></head></html>') is None
        print("Growth public audit parser tests: PASS")
        return 0

    # A source check is independent from a live deployment check.
    source = Path("site/index.html").read_text(encoding="utf-8")
    if description(source) != EXPECTED_HOIKU_DESCRIPTION:
        print("::warning::Local generated nursery meta differs; inspect build_site.py")
        print("Growth audit: source MISMATCH")
        return 1

    results = inspect_live()
    summary = ["### Trio Career growth live GET audit (no POST)", "| Public page | Result |", "| --- | --- |"]
    for label, state in results:
        summary.append(f"| {label} | {state} |")
        print(f"Growth live GET: {label}: {state}")
        if state != "MATCH":
            print(f"::warning::Growth live GET unverified or different: {label}: {state}")
    summary.append("These checks prove HTML visibility only; no actual inquiry, GA4 receipt or Make/Gmail delivery was tested.")
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write("\n" + "\n".join(summary) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
