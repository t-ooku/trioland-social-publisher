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
from datetime import UTC, datetime, timedelta, timezone

BASE = "https://us2.make.com/api/v2"
SCENARIO = "6306695"
HOOK = "2823353"
GMAIL_CONNECTION = "11149787"
TOKEN_ENV = "MAKE_API_TOKEN"
JST = timezone(timedelta(hours=9))


def assess(scenario: dict, hook: dict) -> tuple[str, list[str]]:
    """Returns HEALTHY/ALERT/UNKNOWN and public-safe reasons."""
    if scenario.get("id") != int(SCENARIO) or hook.get("id") != int(HOOK):
        return "UNKNOWN", ["Make API target ID could not be verified"]
    if "scenarioId" not in hook:
        return "UNKNOWN", ["Webhook scenario binding missing"]
    if hook["scenarioId"] != int(SCENARIO):
        return "ALERT", ["Webhook linked to a different scenario"]
    fields = ("isActive", "isinvalid")
    if any(not isinstance(scenario.get(k), bool) for k in fields):
        return "UNKNOWN", ["Scenario state fields missing"]
    queued = hook.get("queueCount")
    if not isinstance(hook.get("enabled"), bool) or type(queued) is not int or queued < 0:
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


def parse_date(value: object) -> datetime:
    if not isinstance(value, str):
        raise ValueError("Missing Make timestamp")
    result = datetime.fromisoformat(value)
    if result.utcoffset() is None:
        raise ValueError("Missing Make timezone")
    return result


def assess_executions(data: dict) -> tuple[str, list[str]]:
    rows = data.get("scenarioLogs")
    if not isinstance(rows, list) or not rows:
        return "UNKNOWN", ["No recent Make execution records available"]
    latest = rows[0]
    labels = {1: "success", 2: "warning", 3: "error"}
    if type(latest.get("status")) is not int or latest["status"] not in labels:
        return "UNKNOWN", ["Latest Make execution status unavailable"]
    status = latest["status"]
    timestamp = parse_date(latest.get("timestamp")).astimezone(JST)
    messages = [f"Latest Make execution: {labels[status]} ({timestamp:%Y-%m-%d %H:%M JST})"]
    if status == 1:
        return "HEALTHY", messages
    # Inspect known error fields locally and report only a fixed error category.
    details = json.dumps({key: latest.get(key) for key in ("error", "errors", "warnings", "message")}).lower()
    if "invalid_grant" in details or "accountvalidationerror" in details:
        messages.append("Make reported a connection authentication error")
    return "ALERT", messages


def assess_gmail(data: dict, now: datetime) -> tuple[str, list[str]]:
    connection = data.get("connection", {})
    if connection.get("id") != int(GMAIL_CONNECTION):
        return "UNKNOWN", ["Gmail connection ID could not be verified"]
    expires = parse_date(connection.get("expire"))
    if expires <= now:
        return "ALERT", ["Make reports that the Gmail connection expired"]
    if expires - now <= timedelta(days=30):
        return "ALERT", ["Make reports that the Gmail connection expires within 30 days"]
    return "HEALTHY", ["Gmail expiry metadata is current"]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def get_json(token: str, path: str) -> dict:
    url = BASE + path
    req = urllib.request.Request(
        url, headers={"Authorization": "Token " + token, "Accept": "application/json"},
        method="GET",
    )
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=15) as response:
        return json.load(response)


def output(state: str, messages: list[str]) -> None:
    label = "Make inquiry relay: " + state + " (" + "; ".join(messages) + ")"
    delivery = "Recipient delivery: UNKNOWN (no recipient mailbox evidence)"
    print(label)
    print(delivery)
    if state != "HEALTHY":
        print("::warning::" + label)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("\n### Make inquiry relay (read only)\n")
            f.write("- " + label + "\n")
            f.write("- " + delivery + "\n")


def self_test() -> int:
    good_s = {"id": int(SCENARIO), "isActive": True, "isinvalid": False,
              "isPaused": False, "dlqCount": 0}
    good_h = {"id": int(HOOK), "scenarioId": int(SCENARIO), "enabled": True, "queueCount": 0}
    assert assess(good_s, good_h)[0] == "HEALTHY"
    assert assess({**good_s, "isActive": False}, good_h)[0] == "ALERT"
    assert assess(good_s, {**good_h, "queueCount": 2})[0] == "ALERT"
    assert assess(good_s, {**good_h, "enabled": False})[0] == "ALERT"
    assert assess(good_s, {**good_h, "scenarioId": None})[0] == "ALERT"
    assert assess({}, good_h)[0] == "UNKNOWN"
    assert assess(good_s, {**good_h, "queueCount": False})[0] == "UNKNOWN"
    good_log = {"status": 1, "timestamp": "2026-11-14T00:00:00Z"}
    assert assess_executions({"scenarioLogs": [good_log]})[0] == "HEALTHY"
    assert assess_executions({"scenarioLogs": []})[0] == "UNKNOWN"
    error_log = {**good_log, "status": 3, "error": "invalid_grant private details"}
    assert assess_executions({"scenarioLogs": [error_log]}) == (
        "ALERT", ["Latest Make execution: error (2026-11-14 09:00 JST)",
                  "Make reported a connection authentication error"])
    assert assess_executions({"scenarioLogs": [{**good_log, "status": 2}]})[0] == "ALERT"
    now = datetime(2026, 11, 14, tzinfo=UTC)
    connection = {"id": int(GMAIL_CONNECTION), "expire": "2027-05-08T00:00:00Z"}
    assert assess_gmail({"connection": connection}, now)[0] == "HEALTHY"
    assert assess_gmail({"connection": {**connection, "expire": "2026-11-15T00:00:00Z"}}, now)[0] == "ALERT"
    assert assess_gmail({"connection": {**connection, "expire": "2026-11-13T00:00:00Z"}}, now)[0] == "ALERT"
    print("Make relay local decision tests PASS (14 cases; no API request)")
    return 0


def check(name: str, inspect) -> tuple[str, list[str]]:
    try:
        return inspect()
    except (AttributeError, ValueError, TypeError, KeyError, OSError) as error:
        code = getattr(error, "code", None)
        return "UNKNOWN", [name + " unavailable" + (f" (HTTP {code})" if code else "")]


def main() -> int:
    if "--self-test" in sys.argv:
        return self_test()
    token = os.environ.get(TOKEN_ENV, "").strip()
    if not token:
        output("UNKNOWN", ["Read-only Make API token not configured"])
        return 0  # Do not fail existing site smoke solely for missing authorization.
    scenario_path = "/scenarios/" + SCENARIO
    checks = [
        check("Scenario and webhook", lambda: assess(
            get_json(token, scenario_path).get("scenario", {}),
            get_json(token, "/hooks/" + HOOK).get("hook", {}),
        )),
        check("Execution history", lambda: assess_executions(
            get_json(token, scenario_path + "/logs?pg%5Blimit%5D=1&pg%5BsortDir%5D=desc"),
        )),
        check("Gmail expiry metadata", lambda: assess_gmail(
            get_json(token, "/connections/" + GMAIL_CONNECTION + "?cols%5B%5D=id&cols%5B%5D=expire"),
            datetime.now(UTC),
        )),
    ]
    states = {state for state, _ in checks}
    state = next(candidate for candidate in ("ALERT", "UNKNOWN", "HEALTHY") if candidate in states)
    output(state, [message for _, messages in checks for message in messages])
    return 1 if state == "ALERT" else 0


if __name__ == "__main__":
    raise SystemExit(main())
