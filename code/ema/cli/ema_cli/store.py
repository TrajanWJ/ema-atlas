"""
Persistent in-memory store backed by a JSON file on disk.
All mock state lives here; survives across CLI invocations.
"""
import json
import os
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

STORE_PATH = Path(os.environ.get("EMA_STORE", Path.home() / ".ema_cli_state.json"))

_DEFAULT = {
    "projects": {},
    "intent_nodes": {},
    "intent_edges": {},
    "gaps": {},
    "proposals": {},
    "seeds": {},
    "tasks": {},
    "ai_sessions": {},
    "ai_session_messages": {},
    "token_events": {},
    "providers": {},
    "usage_records": {},
    "executions": {},        # proposal → task → agent dispatch tracking
    "dispatch_history": {},  # openclaw dispatch records with full context
}

_state: dict = {}


def load():
    global _state
    if STORE_PATH.exists():
        try:
            with open(STORE_PATH) as f:
                _state = json.load(f)
            # Ensure all collections exist
            for k, v in _DEFAULT.items():
                _state.setdefault(k, {})
            return
        except Exception:
            pass
    _state = {k: dict(v) for k, v in _DEFAULT.items()}


def save():
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(STORE_PATH, "w") as f:
        json.dump(_state, f, indent=2, default=str)


def get(collection: str) -> dict:
    return _state.get(collection, {})


def put(collection: str, obj: dict) -> dict:
    _state.setdefault(collection, {})[obj["id"]] = obj
    save()
    return obj


def find(collection: str, id: str) -> dict | None:
    return _state.get(collection, {}).get(id)


def all_items(collection: str) -> list:
    return list(_state.get(collection, {}).values())


def delete(collection: str, id: str) -> bool:
    col = _state.get(collection, {})
    if id in col:
        del col[id]
        save()
        return True
    return False


def clear_all():
    global _state
    _state = {k: {} for k in _DEFAULT}
    save()


# Load on import
load()
