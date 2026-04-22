#!/usr/bin/env python3
"""Provision Adil Discord categories/channels for the target guild.

Usage:
  DISCORD_BOT_TOKEN=... python3 create_adil_discord_structure.py <guild_id>

This script is idempotent for category/text channel creation by name.
It does not delete anything.
"""

import json
import os
import sys
import time
from typing import Optional

import requests

API_BASE = "https://discord.com/api/v10"
TYPE_TEXT = 0
TYPE_CATEGORY = 4

STRUCTURE = {
    "ADIL — PERSONAL": [
        ("welcome", "Welcome + operating context + where to start"),
        ("personal-hub", "Adil-specific discussion that is not pipeline-specific"),
        ("handoff-log", "Concise updates, blockers, decisions, next actions"),
    ],
    "ADIL — WHOLESALING AI": [
        ("ai-hq", "High-level command, routing, priorities, architecture decisions"),
        ("opportunity-intake", "Normalized lead intake and source intake staging"),
        ("lead-enrichment", "Owner/parcel/distress/context enrichment outputs"),
        ("strategy-router", "Route lead to house, land, nurture, or dead"),
        ("follow-up-orchestrator", "Next touches, reminders, revive stale leads, escalation timing"),
        ("kpi-intelligence", "Conversion, throughput, bottlenecks, source quality"),
        ("queue", "Concrete assignable work items only"),
        ("done-feed", "Completed actions and closed loops"),
    ],
    "ADIL — WHOLESALING HOUSES": [
        ("house-list-builder", None),
        ("house-distress-monitoring", None),
        ("house-seller-motivation", None),
        ("house-outreach", None),
        ("seller-response-triage", None),
        ("house-fast-underwriting", None),
        ("house-buyer-match-dispo", None),
    ],
    "ADIL — WHOLESALING LAND": [
        ("land-buyer-criteria", None),
        ("land-sourcing", None),
        ("zoning-entitlement", None),
        ("gis-parcel-constraints", None),
        ("land-seller-qualification", None),
        ("highest-best-use", None),
        ("land-underwriting", None),
        ("land-buyer-match", None),
        ("municipality-planning-monitor", None),
    ],
    "ADIL — LEGACY / IMPORTED": [
        ("legacy-notes", "Old reference notes only — not source of truth"),
        ("legacy-architecture", "Imported historical architecture references"),
        ("legacy-archive", "Archived low-signal imported material"),
    ],
}


def api(method: str, endpoint: str, token: str, **kwargs):
    headers = {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json",
    }
    url = f"{API_BASE}{endpoint}"
    for _ in range(5):
        r = requests.request(method, url, headers=headers, timeout=30, **kwargs)
        if r.status_code == 429:
            retry_after = r.json().get("retry_after", 1)
            time.sleep(retry_after + 0.5)
            continue
        return r
    return r


def get_channels(guild_id: str, token: str):
    r = api("GET", f"/guilds/{guild_id}/channels", token)
    r.raise_for_status()
    return r.json()


def find(channels, name: str, type_: Optional[int] = None):
    for ch in channels:
        if ch.get("name") == name and (type_ is None or ch.get("type") == type_):
            return ch
    return None


def create_category(guild_id: str, token: str, name: str):
    r = api("POST", f"/guilds/{guild_id}/channels", token, json={"name": name, "type": TYPE_CATEGORY})
    r.raise_for_status()
    return r.json()


def create_text(guild_id: str, token: str, name: str, parent_id: str, topic: Optional[str]):
    payload = {"name": name, "type": TYPE_TEXT, "parent_id": parent_id}
    if topic:
        payload["topic"] = topic
    r = api("POST", f"/guilds/{guild_id}/channels", token, json=payload)
    r.raise_for_status()
    return r.json()


def main():
    if len(sys.argv) != 2:
        print("usage: DISCORD_BOT_TOKEN=... python3 create_adil_discord_structure.py <guild_id>")
        raise SystemExit(2)

    guild_id = sys.argv[1]
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if not token:
        print("missing DISCORD_BOT_TOKEN")
        raise SystemExit(2)

    channels = get_channels(guild_id, token)
    summary = {"categories_created": [], "channels_created": [], "categories_existing": [], "channels_existing": []}

    for category_name, channel_defs in STRUCTURE.items():
        category = find(channels, category_name, TYPE_CATEGORY)
        if category:
            summary["categories_existing"].append(category_name)
        else:
            category = create_category(guild_id, token, category_name)
            channels.append(category)
            summary["categories_created"].append(category_name)

        for channel_name, topic in channel_defs:
            existing = find(channels, channel_name, TYPE_TEXT)
            if existing:
                summary["channels_existing"].append(channel_name)
                continue
            created = create_text(guild_id, token, channel_name, category["id"], topic)
            channels.append(created)
            summary["channels_created"].append(channel_name)

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
