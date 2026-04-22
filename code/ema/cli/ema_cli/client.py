"""
EMA HTTP client.
Makes real HTTP calls to the EMA daemon at localhost:4488.
Returns (status_code, response_body_dict) tuples, same interface as mock_api.
"""
import json
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
from . import config


class DaemonError(Exception):
    """Raised when daemon is unreachable."""
    def __init__(self, host, original_error=None):
        self.host = host
        self.original = original_error
        super().__init__(f"Cannot reach EMA daemon at {host}")


def _make_url(path, params=None):
    host = config.host()
    if not host.startswith("http"):
        host = "http://" + host
    base = host.rstrip("/") + path
    if params:
        # Filter None values
        filtered = {k: str(v) for k, v in params.items() if v is not None}
        if filtered:
            base += "?" + urllib.parse.urlencode(filtered)
    return base


def _request(method, path, body=None, params=None):
    """
    Make HTTP request to daemon.
    Returns (status_code, dict).
    Raises DaemonError if connection fails.
    """
    url = _make_url(path, params)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    timeout = config.timeout()

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, {"raw": raw}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {"error": raw}
    except (ConnectionRefusedError, OSError) as e:
        raise DaemonError(config.host(), e)
    except Exception as e:
        raise DaemonError(config.host(), e)


def get(path, params=None):
    return _request("GET", path, params=params)


def post(path, body=None):
    return _request("POST", path, body=body)


def put(path, body=None):
    return _request("PUT", path, body=body)


def patch(path, body=None):
    return _request("PATCH", path, body=body)


def delete(path):
    return _request("DELETE", path)


# ---------------------------------------------------------------------------
# Convenience — daemon probing / compatibility
# ---------------------------------------------------------------------------

def synthesize_status():
    """
    Best-effort compatibility status for older EMA daemons that lack /api/status.
    Pulls from stable CRUD endpoints and returns a normalized status payload.
    """
    summary = {
        "mode": "compat",
        "status": "degraded",
        "message": "EMA daemon reachable via compatibility endpoints",
        "counts": {},
        "subsystems": {
            "gateway": None,
            "openclaw": None,
            "superman": None,
            "honcho": None,
        },
        "available_endpoints": [],
        "missing_endpoints": [],
        "compat_notes": [],
    }

    probes = [
        ("projects", "/api/projects", "active_projects", lambda d: len(d.get("projects", d.get("data", [])))),
        ("tasks", "/api/tasks", "pending_tasks", lambda d: len(d.get("tasks", d.get("data", [])))),
        ("proposals", "/api/proposals", "open_proposals", lambda d: len(d.get("proposals", d.get("data", [])))),
        ("executions", "/api/executions", "running_agents", lambda d: len(d.get("executions", d.get("data", [])))),
    ]

    for label, path, count_key, extractor in probes:
        try:
            code, data = get(path)
        except DaemonError:
            raise

        if code == 200:
            summary["available_endpoints"].append(path)
            try:
                summary["counts"][count_key] = extractor(data)
            except Exception:
                summary["counts"][count_key] = "?"
        else:
            summary["missing_endpoints"].append(path)

    if summary["available_endpoints"]:
        summary["compat_notes"].append("/api/status missing; synthesized status from CRUD endpoints")
        summary["compat_notes"].append("/api/surfaces may be unavailable on this daemon build")
    else:
        summary["message"] = "EMA daemon reachable, but known status or CRUD endpoints did not respond successfully"

    return summary


def control_plane_snapshot(project=None):
    """
    Best-effort agent/operator snapshot.
    Prefers canonical control-plane surfaces, falls back to legacy status/CRUD.
    """
    notes = []
    available = []

    code, data = get("/api/control-plane")
    if code == 200:
        available.append("/api/control-plane")
        snapshot = {"mode": "control-plane", "control_plane": data, "available_endpoints": available, "notes": notes}

        sweeper_code, sweeper = get("/api/control-plane/sweeper")
        if sweeper_code == 200:
            available.append("/api/control-plane/sweeper")
            snapshot["sweeper"] = sweeper

        live_code, live = get("/api/control-plane/live", params={"limit": 20})
        if live_code == 200:
            available.append("/api/control-plane/live")
            snapshot["live"] = live

        host_code, host_truth = get("/api/surfaces/host-truth")
        if host_code == 200:
            available.append("/api/surfaces/host-truth")
            snapshot["host_truth"] = host_truth

        operator_code, operator_pkg = get("/api/context/operator/package")
        if operator_code == 200:
            available.append("/api/context/operator/package")
            snapshot["operator_context"] = operator_pkg
            if operator_pkg.get("recent_host_sessions"):
                snapshot["recent_host_sessions"] = operator_pkg.get("recent_host_sessions")

        host_sessions_code, host_sessions = get("/api/surfaces/host-sessions", params={"limit": 20})
        if host_sessions_code == 200:
            available.append("/api/surfaces/host-sessions")
            snapshot["host_sessions"] = host_sessions.get("sessions", [])
            snapshot.setdefault("recent_host_sessions", host_sessions.get("sessions", []))

        if project:
            ctx_code, context = get("/api/context/project/%s/package" % urllib.parse.quote(str(project), safe=""))
            if ctx_code == 200:
                available.append("/api/context/project/:project/package")
                snapshot["project_context"] = context
            else:
                ctx_code, context = get("/api/control-plane/context_for", params={"project": project})
                if ctx_code == 200:
                    available.append("/api/control-plane/context_for")
                    snapshot["project_context"] = context

        return snapshot

    notes.append(f"/api/control-plane unavailable (HTTP {code}); falling back")

    try:
        status_code, status_data = get("/api/status")
        if status_code == 200:
            available.append("/api/status")
            return {"mode": "legacy-status", "status": status_data, "available_endpoints": available, "notes": notes}
    except DaemonError:
        raise

    compat = synthesize_status()
    compat.setdefault("compat_notes", []).extend(notes)
    return compat


def ping():
    """Return (reachable: bool, latency_ms: float|None, data: dict)."""
    t0 = time.monotonic()
    try:
        data = control_plane_snapshot()
        latency = round((time.monotonic() - t0) * 1000, 1)
        return True, latency, data
    except DaemonError:
        return False, None, {}
