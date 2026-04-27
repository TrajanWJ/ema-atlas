# Dispatch kit

Copy-paste prompts for launching Autharis lanes in fresh Codex or Claude sessions.

## How to use

1. Open a new session in `/Users/tawj/Desktop/Kor - Autharis/autharis`.
2. Pick an `open` lane from `_shared/lanes.md`.
3. Open the matching file in `_shared/dispatch/`.
4. Copy everything between `DISPATCH PROMPT BEGIN` and `DISPATCH PROMPT END`.
5. Paste it as the first message in the new session.

## Recommended order

### Group 1 — parallel, safe to fire immediately
- `lane-A1-shell-primitives.md`
- `lane-B1-marketing.md`
- `lane-B2-client.md`
- `lane-B3-talent.md`
- `lane-B4-admin.md`

### Group 1b — derivative wave after isolated surfaces exist
- `lane-D1-marketing-case-studies.md`
- `lane-D2-marketing-brief.md`
- `lane-D3-client-request-lab.md`
- `lane-D4-client-match-lab.md`
- `lane-D5-talent-opportunity-dossier.md`
- `lane-D6-talent-payout-packet.md`
- `lane-D7-admin-dispute-drilldown.md`
- `lane-D8-admin-reporting-workbook.md`
- `lane-D9-marketing-faq.md`
- `lane-D10-marketing-talent-join.md`
- `lane-D11-client-finance-packet.md`
- `lane-D12-talent-public-profile.md`
- `lane-D13-admin-queue-drilldown.md`
- `lane-D14-admin-matching-dossier.md`

### Group 2 — only after protected-file ownership is clear
- `lane-C1-integration.md`

### Group 3 — after integration lands
- `lane-V1-verification.md`

## Shared rules for every dispatched agent

- Read `AGENTS.md` first.
- Claim the lane in `_shared/lanes.md` before writing code.
- Stay inside the lane's file scope.
- Treat `/Users/tawj/Desktop/Kor - Autharis/index.html` and `/Users/tawj/Desktop/Kor - Autharis/src/**` as read-only reference files.
- Treat `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `components/Marketing.tsx`, `components/ClientApp.tsx`, `components/AppContext.tsx`, `components/TweaksPanel.tsx`, `components/Icons.tsx`, `lib/tweaks.ts`, `lib/data.ts`, and `styles/**` as protected unless your lane explicitly owns them.
- If you need protected files owned by `U0`, stop and file a handoff instead of pushing through.
