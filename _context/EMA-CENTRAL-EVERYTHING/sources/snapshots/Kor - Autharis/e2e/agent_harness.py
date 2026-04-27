#!/usr/bin/env python3
"""
Autharis agent-friendly E2E testing harness.

Features
--------
- Launches headless Chromium with Chrome DevTools Protocol (CDP) exposed on
  port 9222 so external agents can attach Chrome DevTools or a CDP client.
- Logs in as any demo profile via the dev-only GET endpoint
  /auth/session/login?profile=<id>&next=<path>, which sets the real signed
  session cookie the app uses in normal flow.
- Per-profile persistent browser context (cookies, localStorage) written under
  e2e/profiles/<id>/ so agents can re-attach and continue a session.
- Captures per-step screenshots, full DOM HTML, console logs, and a network
  transcript to e2e/logs/<run>/.

Usage
-----
  # One-shot sweep of every surface for every profile:
  python3 e2e/agent_harness.py --sweep

  # Drive a single profile to a specific page and exercise an input:
  python3 e2e/agent_harness.py \
      --profile talent-amara-okafor \
      --surface /talent \
      --input 'textarea[name=bio]=Hello from the harness'

  # Open a popup/modal by URL param (app surfaces use ?modal=<name>&id=<row>):
  python3 e2e/agent_harness.py \
      --profile client-meridian-ops \
      --surface /client \
      --modal invoice --id inv-001

  # Keep the browser alive so an external Chrome can connect to CDP
  # (useful for humans or another agent to inspect live):
  python3 e2e/agent_harness.py --profile admin-jordan-vale \
      --surface /admin --keep-alive

Connecting Chrome DevTools manually
-----------------------------------
While this script is running with --keep-alive, open Chrome on your desktop
and go to  chrome://inspect/#devices  then click "Configure..." and add
localhost:9222. The page list at http://localhost:9222/json/list shows the
page IDs you can inspect.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

try:
    from playwright.sync_api import (
        Browser,
        BrowserContext,
        Page,
        Playwright,
        sync_playwright,
    )
except ImportError as exc:  # pragma: no cover
    sys.stderr.write("playwright not installed. Run:\n")
    sys.stderr.write("  python3 -m pip install --user --break-system-packages playwright\n")
    sys.stderr.write("  python3 -m playwright install chromium\n")
    raise SystemExit(1) from exc


REPO_ROOT = Path(__file__).resolve().parent.parent
E2E_DIR = REPO_ROOT / "e2e"
PROFILES_DIR = E2E_DIR / "profiles"
SHOT_DIR = E2E_DIR / "screenshots"
LOG_DIR = E2E_DIR / "logs"

PROFILES_DIR.mkdir(parents=True, exist_ok=True)
SHOT_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Mirror of lib/auth/demo-profiles.ts — kept in sync manually.
DEMO_PROFILES: dict[str, dict[str, str]] = {
    "client-meridian-ops": {"role": "client", "default_surface": "/client"},
    "talent-amara-okafor": {"role": "talent", "default_surface": "/talent"},
    "admin-jordan-vale": {"role": "admin", "default_surface": "/admin"},
}

# Surfaces a sweep will visit per role. URL-param surfaces (?tweaks=1, etc.)
# are included to exercise the dev panel.
SWEEP_SURFACES: dict[str, list[str]] = {
    "public": [
        "/",
        "/marketing",
        "/brief",
        "/case-studies",
        "/faq",
        "/join",
        "/auth",
        "/?tweaks=1",
    ],
    "client": ["/client", "/client?tweaks=1"],
    "talent": ["/talent", "/talent?tweaks=1"],
    "admin": ["/admin", "/admin?tweaks=1"],
}


@dataclass
class RunContext:
    base_url: str
    cdp_port: int
    run_id: str
    run_log_dir: Path
    keep_alive: bool
    slow_mo: int

    def log(self, msg: str) -> None:
        stamp = datetime.now().strftime("%H:%M:%S")
        line = f"[{stamp}] {msg}"
        print(line, flush=True)
        with (self.run_log_dir / "harness.log").open("a") as fh:
            fh.write(line + "\n")


def launch_browser(pw: Playwright, ctx: RunContext) -> Browser:
    # Expose CDP for external DevTools clients/agents.
    return pw.chromium.launch(
        headless=True,
        slow_mo=ctx.slow_mo,
        args=[
            f"--remote-debugging-port={ctx.cdp_port}",
            "--remote-debugging-address=0.0.0.0",
            "--disable-features=IsolateOrigins,site-per-process",
        ],
    )


def open_profile_context(browser: Browser, profile_id: str | None) -> BrowserContext:
    storage_state: str | None = None
    if profile_id:
        state_file = PROFILES_DIR / profile_id / "state.json"
        if state_file.exists():
            storage_state = str(state_file)

    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        storage_state=storage_state,
    )
    return context


def persist_profile_state(context: BrowserContext, profile_id: str) -> None:
    out = PROFILES_DIR / profile_id / "state.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    context.storage_state(path=str(out))


def login(page: Page, ctx: RunContext, profile_id: str, next_path: str | None) -> None:
    url = f"{ctx.base_url}/auth/session/login?profile={profile_id}"
    if next_path:
        url += f"&next={next_path}"
    ctx.log(f"login → {profile_id} (next={next_path or '<default>'})")
    page.goto(url, wait_until="networkidle", timeout=30_000)


def apply_input(page: Page, spec: str, ctx: RunContext) -> None:
    """spec format:  'selector=value'  e.g.  '#bio=hello'  or  'input[name=rate]=85'"""
    if "=" not in spec:
        ctx.log(f"skip input (no '='): {spec}")
        return
    selector, value = spec.split("=", 1)
    selector = selector.strip()
    try:
        page.fill(selector, value, timeout=5_000)
        ctx.log(f"filled {selector!r} = {value!r}")
    except Exception as err:  # noqa: BLE001
        ctx.log(f"fill FAILED {selector!r}: {err}")


def capture(page: Page, ctx: RunContext, tag: str) -> None:
    safe = tag.replace("/", "_").replace("?", "_").replace("&", "_").strip("_") or "root"
    shot = SHOT_DIR / f"{ctx.run_id}-{safe}.png"
    try:
        page.screenshot(path=str(shot), full_page=True)
    except Exception as err:  # noqa: BLE001
        ctx.log(f"screenshot FAILED {safe}: {err}")
        return
    html = ctx.run_log_dir / f"{safe}.html"
    try:
        html.write_text(page.content(), encoding="utf-8")
    except Exception as err:  # noqa: BLE001
        ctx.log(f"html dump FAILED {safe}: {err}")
    ctx.log(f"captured {safe} → {shot.relative_to(REPO_ROOT)}")


def visit(
    page: Page,
    ctx: RunContext,
    surface: str,
    *,
    modal: str | None = None,
    record_id: str | None = None,
    inputs: Iterable[str] = (),
) -> None:
    url = ctx.base_url + surface
    extras: list[str] = []
    if modal:
        extras.append(f"modal={modal}")
    if record_id:
        extras.append(f"id={record_id}")
    if extras:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}{'&'.join(extras)}"

    ctx.log(f"visit {url}")
    try:
        page.goto(url, wait_until="networkidle", timeout=30_000)
    except Exception as err:  # noqa: BLE001
        ctx.log(f"visit FAILED {url}: {err}")
        return

    for spec in inputs:
        apply_input(page, spec, ctx)

    capture(page, ctx, surface)


def attach_console_capture(page: Page, ctx: RunContext) -> None:
    out = ctx.run_log_dir / "console.log"

    def on_console(msg) -> None:  # noqa: ANN001
        try:
            with out.open("a") as fh:
                fh.write(f"[{msg.type}] {msg.text}\n")
        except Exception:  # noqa: BLE001
            pass

    def on_request_failed(req) -> None:  # noqa: ANN001
        try:
            with (ctx.run_log_dir / "net-failed.log").open("a") as fh:
                fh.write(f"{req.method} {req.url} — {req.failure}\n")
        except Exception:  # noqa: BLE001
            pass

    page.on("console", on_console)
    page.on("requestfailed", on_request_failed)


def do_sweep(browser: Browser, ctx: RunContext) -> None:
    # Public surfaces with no session
    ctx.log("--- sweep: public (no session) ---")
    pub_ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = pub_ctx.new_page()
    attach_console_capture(page, ctx)
    for s in SWEEP_SURFACES["public"]:
        visit(page, ctx, s)
    pub_ctx.close()

    # Authenticated sweeps
    for profile_id, meta in DEMO_PROFILES.items():
        ctx.log(f"--- sweep: {profile_id} ({meta['role']}) ---")
        context = open_profile_context(browser, profile_id)
        page = context.new_page()
        attach_console_capture(page, ctx)
        login(page, ctx, profile_id, meta["default_surface"])
        role = meta["role"]
        for s in SWEEP_SURFACES.get(role, []):
            visit(page, ctx, s)
        persist_profile_state(context, profile_id)
        context.close()


def run(args: argparse.Namespace) -> int:
    run_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    run_log_dir = LOG_DIR / run_id
    run_log_dir.mkdir(parents=True, exist_ok=True)

    ctx = RunContext(
        base_url=args.base_url.rstrip("/"),
        cdp_port=args.cdp_port,
        run_id=run_id,
        run_log_dir=run_log_dir,
        keep_alive=args.keep_alive,
        slow_mo=args.slow_mo,
    )

    ctx.log(f"run {run_id} — base={ctx.base_url} cdp=:{ctx.cdp_port} keep_alive={ctx.keep_alive}")
    ctx.log(f"DevTools: http://localhost:{ctx.cdp_port}/json/list  (while running)")

    with sync_playwright() as pw:
        browser = launch_browser(pw, ctx)

        try:
            if args.sweep:
                do_sweep(browser, ctx)
            else:
                profile_id = args.profile
                surface = args.surface or (
                    DEMO_PROFILES[profile_id]["default_surface"] if profile_id else "/"
                )
                context = open_profile_context(browser, profile_id)
                page = context.new_page()
                attach_console_capture(page, ctx)
                if profile_id:
                    login(page, ctx, profile_id, surface)
                visit(
                    page,
                    ctx,
                    surface,
                    modal=args.modal,
                    record_id=args.id,
                    inputs=args.input or (),
                )
                if profile_id:
                    persist_profile_state(context, profile_id)

            summary = {
                "run_id": run_id,
                "base_url": ctx.base_url,
                "cdp_port": ctx.cdp_port,
                "screenshots": sorted(p.name for p in SHOT_DIR.glob(f"{run_id}-*.png")),
                "logs_dir": str(run_log_dir.relative_to(REPO_ROOT)),
            }
            (run_log_dir / "summary.json").write_text(json.dumps(summary, indent=2))
            ctx.log(f"summary → {run_log_dir.relative_to(REPO_ROOT)}/summary.json")

            if ctx.keep_alive:
                ctx.log("keep-alive mode: press Ctrl+C to quit. CDP stays exposed.")
                try:
                    while True:
                        time.sleep(5)
                except KeyboardInterrupt:
                    ctx.log("shutting down")
        finally:
            browser.close()

    return 0


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--base-url", default="http://localhost:3000")
    p.add_argument("--cdp-port", type=int, default=9222)
    p.add_argument("--slow-mo", type=int, default=0, help="ms delay between actions (debug)")
    p.add_argument("--sweep", action="store_true", help="visit every surface for every profile")
    p.add_argument("--profile", choices=sorted(DEMO_PROFILES.keys()))
    p.add_argument("--surface", help="path to visit, e.g. /client or /admin?tweaks=1")
    p.add_argument("--modal", help="value for ?modal= URL param")
    p.add_argument("--id", help="value for ?id= URL param")
    p.add_argument(
        "--input",
        action="append",
        help="selector=value pair to fill; may be repeated",
    )
    p.add_argument("--keep-alive", action="store_true", help="keep browser open for CDP attach")
    return p.parse_args()


if __name__ == "__main__":
    sys.exit(run(parse_args()))
