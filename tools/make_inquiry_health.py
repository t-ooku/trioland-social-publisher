#!/usr/bin/env python3
"""Read-only Make inquiry email relay check.

No webhook execution or inquiry form submission. Output contains only status
flags/counts; never prints auth token, webhook URLs, messages, or customer data.
A missing API token is UNKNOWN, not HEALTHY.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

BASE = "https://us2.make.com/api/v2"
SCENARIO = "6306695"
HOOK = "2823353"
TOKEN_ENV = "MAKE_API_TOKEN"


def assess(scenario: dict, hook: dict) -> tuple[str, list[str]]:
    """Returns HEALTHY/ALERT/UNKNOWN and public-safe reasons."""
    if scenario.get("id") != int(SCENARIO) or hook.get("id") != int(HOOK):
        return "UNKNOWN", ["Make API target ID could not be verified"]
    if hook.get("scenarioId") not in (None, int(SCENARIO)):
        return "ALERT", ["Webhook linked to a different scenario"]
    fields = ("isActive", "isinvalid")
    if any(not isinstance(scenario.get(k), bool) for k in fields):
        return "UNKNOWN", ["Scenario state fields missing"]
    if not isinstance(hook.get("enabled"), bool) or not isinstance(hook.get("queueCount"), int):
        return "UNKNOWN", ["Webhook enabled/queue fields missing"]
    problems = []
    if not scenario["isActive"]:
        problems.append("Scenario inactive")
    if scenario["isinvalid"]:
        problems.append("Scenario invalid")
    if scenario.get("isPaused") is True:
        problems.append("Scenario paused")
    if not hook["enabled"]:
        problems.append("Webhook disabled")
    if hook["queueCount"] > 0:
        problems.append("Webhook queued items=" + str(hook["queueCount"]))
    if isinstance(scenario.get("dlqCount"), int) and scenario["dlqCount"] > 0:
        problems.append("Incomplete executions=" + str(scenario["dlqCount"]))
    return ("ALERT", problems) if problems else ("HEALTHY", ["Scenario active; webhook enabled; queue empty"])


def get_json(token: str, path: str) -> dict:
    url = BASE + path
    req = urllib.request.Request(
        url, headers={"Authorization": "Token " + token, "Accept": "application/json"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.load(response)


def output(state: str, messages: list[str]) -> None:
    label = "Make inquiry relay: " + state + " (" + "; ".join(messages) + ")"
    print(label)
    if state != "HEALTHY":
        print("::warning::" + label)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("\n### Make inquiry relay (read only)\n")
            f.write("- " + label + "\n")
            if state == "HEALTHY":
                f.write("- This does NOT verify Gmail delivery or real inquiry counts.\n")


def self_test() -> int:
    good_s = {"id": int(SCENARIO), "isActive": True, "isinvalid": False,
              "isPaused": False, "dlqCount": 0}
    good_h = {"id": int(HOOK), "scenarioId": int(SCENARIO), "enabled": True, "queueCount": 0}
    assert assess(good_s, good_h)[0] == "HEALTHY"
    assert assess({**good_s, "isActive": False}, good_h)[0] == "ALERT"
    assert assess(good_s, {**good_h, "queueCount": 2})[0] == "ALERT"
    assert assess(good_s, {**good_h, "enabled": False})[0] == "ALERT"
    assert assess({}, good_h)[0] == "UNKNOWN"
    print("Make relay local decision tests PASS (5 cases; no API request)")
    return 0


def main() -> int:
    if "--self-test" in sys.argv:
        return self_test()
    token = os.environ.get(TOKEN_ENV, "").strip()
    if not token:
        output("UNKNOWN", ["Read-only Make API token not configured"])
        return 0  # Do not fail existing site smoke solely for missing authorization.
    try:
        scenario = get_json(token, "/scenarios/" + SCENARIO).get("scenario", {})
        hook = get_json(token, "/hooks/" + HOOK).get("hook", {})
        state, messages = assess(scenario, hook)
        # Distinguish API connectivity from a proven operational condition.
        output(state, messages)
        return 1 if state == "ALERT" else 0
    except (ValueError, TypeError, KeyError, TimeoutError,
            urllib.error.URLError, urllib.error.HTTPError) as e:
        code = getattr(e, "code", None)
        output("UNKNOWN", ["Make read failed" + (", HTTP " + str(code) if code else "")])
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
