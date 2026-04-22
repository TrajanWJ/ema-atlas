#!/usr/bin/env bash
# Refresh discovered Claude OAuth tokens and sync them into OpenClaw auth
# profiles and provider fallbacks on the agent VM.

set -euo pipefail

CREDS_FILE="$HOME/.claude/.credentials.json"
SYNC_DIR="$HOME/.claude/oauth-sources"
OPENCLAW_ROOT="$HOME/.openclaw"
OPENCLAW_CONFIG="$OPENCLAW_ROOT/openclaw.json"
LOG_FILE="$OPENCLAW_ROOT/logs/oauth-refresh.log"
LOCK_FILE="/tmp/openclaw-oauth-refresh.lock"

mkdir -p "$(dirname "$LOG_FILE")" "$SYNC_DIR"

log() { echo "$(date -Iseconds) $1" >> "$LOG_FILE"; }

exec 9>"$LOCK_FILE"
flock -n 9 || { log "SKIP: another refresh already running"; exit 0; }

export CREDS_FILE SYNC_DIR OPENCLAW_ROOT OPENCLAW_CONFIG LOG_FILE

python3 <<'PYEOF'
import glob
import json
import os
import time
import urllib.error
import urllib.request
import base64
from pathlib import Path

CREDS_FILE = Path(os.environ["CREDS_FILE"]).expanduser()
SYNC_DIR = Path(os.environ["SYNC_DIR"]).expanduser()
OPENCLAW_ROOT = Path(os.environ["OPENCLAW_ROOT"]).expanduser()
OPENCLAW_CONFIG = Path(os.environ["OPENCLAW_CONFIG"]).expanduser()
LOG_FILE = Path(os.environ["LOG_FILE"]).expanduser()
TWO_HOURS_MS = 7_200_000
TOKEN_URL = "https://platform.claude.com/v1/oauth/token"
CLAUDE_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
DEFAULT_SCOPES = "user:inference user:profile user:file_upload user:mcp_servers user:sessions:claude_code"


def log(message: str) -> None:
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(f"{time.strftime('%Y-%m-%dT%H:%M:%S%z')} {message}\n")


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
    tmp.replace(path)


def decode_jwt_payload(token: str):
    parts = token.split(".")
    if len(parts) < 2:
        return {}
    payload = parts[1]
    payload += "=" * (-len(payload) % 4)
    try:
        raw = base64.urlsafe_b64decode(payload.encode("utf-8"))
        data = json.loads(raw.decode("utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def slugify(value: str) -> str:
    chars = []
    for ch in value.lower():
        if ch.isalnum():
            chars.append(ch)
        else:
            chars.append("-")
    slug = "".join(chars).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug or "oauth"


def read_oauth_file(path: Path, priority: int, label_hint: str):
    if not path.is_file():
      return None

    data = load_json(path)
    oauth = data.get("claudeAiOauth")
    if not isinstance(oauth, dict):
        return None

    return {
        "kind": "file",
        "path": str(path),
        "label": label_hint,
        "priority": priority,
        "data": data,
        "oauth": oauth,
    }


def read_profile_sources(path: Path, start_priority: int):
    if not path.is_file():
        return []

    data = load_json(path)
    profiles = data.get("profiles", {})
    sources = []

    for index, (name, profile) in enumerate(profiles.items()):
        if not name.startswith("anthropic:"):
            continue
        if profile.get("type") != "oauth":
            continue
        if not profile.get("refresh") or not profile.get("access"):
            continue

        sources.append(
            {
                "kind": "profile",
                "path": str(path),
                "label": name.split(":", 1)[1],
                "priority": start_priority + index,
                "data": None,
                "oauth": {
                    "accessToken": profile["access"],
                    "refreshToken": profile["refresh"],
                    "expiresAt": profile.get("expires", 0),
                    "subscriptionType": profile.get("subscriptionType") or "unknown",
                    "rateLimitTier": profile.get("rateLimitTier") or "unknown",
                    "scopes": profile.get("scopes") or [],
                },
            }
        )

    return sources


def refresh_oauth(oauth: dict) -> dict:
    refresh_token = oauth.get("refreshToken")
    if not refresh_token:
        return oauth

    remaining_ms = int(oauth.get("expiresAt") or 0) - int(time.time() * 1000)
    if remaining_ms > TWO_HOURS_MS:
        return oauth

    scopes = oauth.get("scopes", [])
    scope_str = " ".join(scopes) if scopes else DEFAULT_SCOPES
    payload = json.dumps(
        {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": CLAUDE_CLIENT_ID,
            "scope": scope_str,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        TOKEN_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        log(f"WARN: refresh failed for token ending {refresh_token[-6:]}: HTTP {exc.code} {details[:200]}")
        return oauth
    except Exception as exc:
        log(f"WARN: refresh failed for token ending {refresh_token[-6:]}: {exc}")
        return oauth

    oauth["accessToken"] = body["access_token"]
    oauth["refreshToken"] = body.get("refresh_token") or refresh_token
    oauth["expiresAt"] = int(time.time() * 1000) + int(body.get("expires_in", 28800)) * 1000
    return oauth


def persist_source(source: dict) -> None:
    if source["kind"] != "file":
        return

    payload = source["data"]
    payload["claudeAiOauth"] = source["oauth"]
    write_json(Path(source["path"]), payload)


def sync_cli_credentials(best_oauth: dict) -> None:
    payload = {"claudeAiOauth": best_oauth}
    write_json(CREDS_FILE, payload)
    log(
        "Synced Claude CLI credentials from best OAuth source "
        f"(expiresAt={best_oauth.get('expiresAt')})"
    )


def discover_sources():
    discovered = []
    seen = set()

    file_candidates = []
    if CREDS_FILE.is_file():
        file_candidates.append(CREDS_FILE)

    file_candidates.extend(sorted(SYNC_DIR.glob("*.json")))

    extras = os.environ.get("CLAUDE_OAUTH_EXTRA_PATHS", "")
    for raw in [part.strip() for part in extras.split(",") if part.strip()]:
        file_candidates.append(Path(raw).expanduser())

    priority = 0
    for path in file_candidates:
        label = path.parent.name if path.name == ".credentials.json" else path.stem
        source = read_oauth_file(path, priority, label)
        priority += 1
        if not source:
            continue
        key = source["oauth"].get("refreshToken") or source["oauth"].get("accessToken")
        if key in seen:
            continue
        discovered.append(source)
        seen.add(key)

    profile_files = sorted(OPENCLAW_ROOT.glob("agents/*/agent/auth-profiles.json"))
    for profile_file in profile_files:
        for source in read_profile_sources(profile_file, 100 + priority):
            priority += 1
            key = source["oauth"].get("refreshToken") or source["oauth"].get("accessToken")
            if key in seen:
                continue
            discovered.append(source)
            seen.add(key)

    return sorted(discovered, key=lambda item: (item["priority"], item["label"]))


def build_profile_entries(sources):
    entries = {}
    order = []

    for index, source in enumerate(sources):
        profile_name = f"anthropic:{'default' if index == 0 else ('secondary' if index == 1 else 'slot-' + str(index + 1))}"
        oauth = source["oauth"]
        entries[profile_name] = {
            "type": "oauth",
            "provider": "anthropic",
            "access": oauth["accessToken"],
            "refresh": oauth["refreshToken"],
            "expires": oauth["expiresAt"],
            "subscriptionType": oauth.get("subscriptionType"),
            "rateLimitTier": oauth.get("rateLimitTier"),
            "scopes": oauth.get("scopes", []),
            "label": slugify(source["label"]),
        }
        order.append(profile_name)

    return entries, order


def sync_auth_profiles(entries, order):
    profile_files = sorted(OPENCLAW_ROOT.glob("agents/*/agent/auth-profiles.json"))
    now = int(time.time() * 1000)

    for path in profile_files:
        data = load_json(path) if path.is_file() else {"version": 1}
        profiles = data.get("profiles", {})

        non_anthropic = {
            key: value
            for key, value in profiles.items()
            if not (key.startswith("anthropic:") and value.get("provider") == "anthropic")
        }

        usage_stats = data.get("usageStats", {})
        new_usage = {
            key: {
                **usage_stats.get(key, {}),
                "lastUsed": usage_stats.get(key, {}).get("lastUsed", now),
                "errorCount": 0,
            }
            for key in order
        }

        data["profiles"] = {**non_anthropic, **entries}
        data["order"] = {**data.get("order", {}), "anthropic": order}
        data["lastGood"] = {**data.get("lastGood", {}), "anthropic": order[0]}
        data["usageStats"] = new_usage
        write_json(path, data)
        log(f"Updated auth profiles: {path} ({len(order)} OAuth source(s))")


def sync_codex_openai():
    """Sync Codex/OpenAI token to OpenClaw OpenAI + Codex providers and auth profiles."""
    codex_path = SYNC_DIR / "host-codex-openai.json"
    codex_auth_path = SYNC_DIR / "host-codex.json"
    if not codex_path.is_file():
        return
    try:
        codex = load_json(codex_path)
        token = codex.get("accessToken", "")
        if not token:
            return

        codex_auth = load_json(codex_auth_path) if codex_auth_path.is_file() else {}
        codex_tokens = codex_auth.get("tokens", {}) if isinstance(codex_auth, dict) else {}
        codex_access = codex_tokens.get("access_token") or token
        codex_refresh = codex_tokens.get("refresh_token")
        codex_account_id = codex_tokens.get("account_id") or codex.get("accountId")
        id_payload = decode_jwt_payload(codex_tokens.get("id_token", ""))
        access_payload = decode_jwt_payload(codex_access)
        codex_email = id_payload.get("email")
        codex_expires = access_payload.get("exp")
        codex_expires_ms = int(codex_expires) * 1000 if codex_expires else int(time.time() * 1000) + TWO_HOURS_MS

        config = load_json(OPENCLAW_CONFIG)
        providers = config.setdefault("models", {}).setdefault("providers", {})
        if "openai" in providers:
            providers["openai"]["apiKey"] = token

        providers["openai-codex"] = {
            "baseUrl": "https://chatgpt.com/backend-api",
            "apiKey": codex_access,
            "api": "openai-codex-responses",
            "models": [
                {
                    "id": "openai-codex/gpt-5.4",
                    "name": "GPT-5.4 (Codex)",
                    "api": "openai-codex-responses",
                    "reasoning": True,
                    "input": ["text", "image"],
                    "cost": {
                        "input": 0,
                        "output": 0,
                        "cacheRead": 0,
                        "cacheWrite": 0,
                    },
                    "contextWindow": 200000,
                    "maxTokens": 200000,
                }
            ],
        }

        defaults = config.setdefault("agents", {}).setdefault("defaults", {})
        model_defaults = defaults.setdefault("model", {})
        fallbacks = list(model_defaults.get("fallbacks", []))
        codex_model = "openai-codex/gpt-5.4"
        if codex_model not in fallbacks:
            insert_at = len(fallbacks)
            for index, fallback in enumerate(fallbacks):
                if fallback == "anthropic/claude-haiku-4-5-20251001":
                    insert_at = index
                    break
            fallbacks.insert(insert_at, codex_model)
            model_defaults["fallbacks"] = fallbacks

        defaults.setdefault("models", {})[codex_model] = {"alias": "codex"}

        write_json(OPENCLAW_CONFIG, config)
        log(f"Updated OpenClaw OpenAI/Codex providers and fallback chain ({len(token)} chars)")

        if codex_access and codex_refresh:
            profile_entry = {
                "type": "oauth",
                "provider": "openai-codex",
                "access": codex_access,
                "refresh": codex_refresh,
                "expires": codex_expires_ms,
                "accountId": codex_account_id,
                "label": "codex",
            }
            if codex_email:
                profile_entry["email"] = codex_email

            now = int(time.time() * 1000)
            profile_files = sorted(OPENCLAW_ROOT.glob("agents/*/agent/auth-profiles.json"))
            for path in profile_files:
                data = load_json(path) if path.is_file() else {"version": 1}
                profiles = data.setdefault("profiles", {})
                profiles["openai-codex:default"] = profile_entry
                order = data.setdefault("order", {})
                order["openai-codex"] = ["openai-codex:default"]
                last_good = data.setdefault("lastGood", {})
                last_good["openai-codex"] = "openai-codex:default"
                usage_stats = data.setdefault("usageStats", {})
                usage_stats["openai-codex:default"] = {
                    **usage_stats.get("openai-codex:default", {}),
                    "lastUsed": usage_stats.get("openai-codex:default", {}).get("lastUsed", now),
                    "errorCount": 0,
                }
                write_json(path, data)
            log("Updated OpenClaw auth profiles with Codex OAuth credentials")
    except Exception as exc:
        log(f"WARN: Codex sync failed: {exc}")


def sync_openclaw_config(entries, order):
    if not OPENCLAW_CONFIG.is_file() or not order:
        return

    config = load_json(OPENCLAW_CONFIG)
    providers = config.setdefault("models", {}).setdefault("providers", {})

    primary = entries[order[0]]["access"]
    secondary = entries[order[1]]["access"] if len(order) > 1 else primary

    if "anthropic" in providers:
        providers["anthropic"]["apiKey"] = primary

    if "anthropic-backup" in providers:
        providers["anthropic-backup"]["apiKey"] = secondary

    write_json(OPENCLAW_CONFIG, config)
    log("Updated OpenClaw provider keys for primary and backup Anthropic providers")

    # Also sync Codex/OpenAI
    sync_codex_openai()


def main():
    sources = discover_sources()
    if not sources:
        log("ERROR: no OAuth sources discovered")
        raise SystemExit(1)

    for source in sources:
        source["oauth"] = refresh_oauth(dict(source["oauth"]))
        persist_source(source)

    sources = sorted(
        sources,
        key=lambda item: (
            item["priority"],
            -(item["oauth"].get("expiresAt") or 0),
            item["label"],
        ),
    )

    best_source = max(sources, key=lambda item: item["oauth"].get("expiresAt") or 0)
    sync_cli_credentials(dict(best_source["oauth"]))

    entries, order = build_profile_entries(sources)
    sync_auth_profiles(entries, order)
    sync_openclaw_config(entries, order)
    log(
        "OAuth refresh complete — order: "
        + ", ".join(f"{name}:{entries[name].get('label')}" for name in order)
    )


main()
PYEOF

if pgrep -f "openclaw-gateway" > /dev/null 2>&1; then
  nohup bash -c "sleep 3 && openclaw gateway restart" > /tmp/oauth-gateway-reload.log 2>&1 &
  disown
  log "Gateway reload scheduled (detached)"
fi
