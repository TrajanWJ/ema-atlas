#!/usr/bin/env python3
"""Synthesize an event stream CSV that simulates the F8 publish stream.

Reads the seed CSVs in services/warehouse/seeds/ and writes seed_events.csv,
which becomes the source for models/staging/stg_events.sql.

Event schema matches the F8 Bun WebSocket gateway's discriminated union
(match-found, timesheet-submitted, invoice-paid, dispute-opened,
message-received), with flat columns suited for a CSV seed.
"""
from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

SEEDS_DIR = Path(__file__).resolve().parent.parent / "seeds"


def _read(name: str) -> list[dict[str, str]]:
    with (SEEDS_DIR / name).open(newline="") as fh:
        return list(csv.DictReader(fh))


def _event_id(kind: str, subject: str, ts: str) -> str:
    h = hashlib.md5(f"{kind}:{subject}:{ts}".encode()).hexdigest()
    return f"evt-{h[:12]}"


def _iso(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat(timespec="seconds")


def main() -> None:
    jobs = _read("seed_jobs.csv")
    engagements = _read("seed_engagements.csv")
    timesheets = _read("seed_timesheets.csv")
    invoices = _read("seed_invoices.csv")

    base = datetime(2026, 4, 15, 12, 0, 0)
    rows: list[dict[str, str]] = []

    # match-found: emitted per job when matches > 0
    for idx, j in enumerate(jobs):
        if int(j.get("matches") or 0) > 0:
            ts = _iso(base + timedelta(hours=idx))
            rows.append({
                "event_id": _event_id("match-found", j["id"], ts),
                "channel": "matching",
                "event_type": "match-found",
                "subject_id": j["id"],
                "actor_id": "system",
                "occurred_at": ts,
                "payload": json.dumps({"job_id": j["id"], "match_count": int(j["matches"])}),
            })

    # timesheet-submitted: emitted for each Submitted timesheet
    for idx, t in enumerate(timesheets):
        if t["status"] == "Submitted":
            ts = _iso(base + timedelta(hours=6 + idx))
            rows.append({
                "event_id": _event_id("timesheet-submitted", t["id"], ts),
                "channel": "timesheets",
                "event_type": "timesheet-submitted",
                "subject_id": t["id"],
                "actor_id": t["engagement_id"],
                "occurred_at": ts,
                "payload": json.dumps({"hours": float(t["hours"]), "rate": float(t["rate"])}),
            })

    # invoice-paid: emitted for each Paid invoice
    for idx, inv in enumerate(invoices):
        if inv["status"] == "Paid":
            ts = _iso(base + timedelta(hours=12 + idx))
            rows.append({
                "event_id": _event_id("invoice-paid", inv["id"], ts),
                "channel": "invoices",
                "event_type": "invoice-paid",
                "subject_id": inv["id"],
                "actor_id": inv["engagement_id"],
                "occurred_at": ts,
                "payload": json.dumps({"total": float(inv["total"]), "client": inv["client"]}),
            })

    # dispute-opened + message-received: a couple synthetic ones for coverage
    ts = _iso(base + timedelta(hours=30))
    rows.append({
        "event_id": _event_id("dispute-opened", "ts-00017", ts),
        "channel": "disputes",
        "event_type": "dispute-opened",
        "subject_id": "ts-00017",
        "actor_id": "admin",
        "occurred_at": ts,
        "payload": json.dumps({"reason": "hours mismatch"}),
    })
    ts = _iso(base + timedelta(hours=33))
    rows.append({
        "event_id": _event_id("message-received", engagements[0]["id"], ts),
        "channel": "messaging",
        "event_type": "message-received",
        "subject_id": engagements[0]["id"],
        "actor_id": engagements[0]["talent_id"],
        "occurred_at": ts,
        "payload": json.dumps({"preview": "confirming week coverage"}),
    })

    out = SEEDS_DIR / "seed_events.csv"
    fieldnames = [
        "event_id",
        "channel",
        "event_type",
        "subject_id",
        "actor_id",
        "occurred_at",
        "payload",
    ]
    with out.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {len(rows)} rows -> {out}")


if __name__ == "__main__":
    main()
