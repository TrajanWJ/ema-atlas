# Temporary Workspace - GitHub Cleanup

## Workspace

- Space: `Temporary Workspaces` (`space:01KR0C50SN013YRCCZA1875CQG`)
- Project: `tmp-github-cleanup-2026-05-07`
  (`project:01KR0C598B014Z8B9TNG9PR64C`)
- Lane: `lane:01KR0C5QRW0168DJ4QGJRKJJ5K`
- Actor: `actor:codex`
- Mode: inventory and proposal only until user approves exact GitHub actions.

## Goal

Clean up `TrajanWJ` GitHub repositories, especially EMA, by deciding which
repos should become private, be renamed, be deleted, be archived, or be
superseded by a new canonical private repo.

## Current GitHub Inventory

Source command:

```bash
gh repo list --limit 200 --json nameWithOwner,isPrivate,isArchived,isFork,description,pushedAt,visibility,primaryLanguage,diskUsage,url
```

Repos found: 27.

| Repo | Visibility | Type | Last push | Suggested bucket |
| --- | --- | --- | --- | --- |
| `TrajanWJ/EMA-CENTRAL-EVERYTHING` | public | source | 2026-04-30 | make private now; candidate canonical EMA remote |
| `TrajanWJ/ema` | public | source | 2026-04-13 | make private, archive or rename after canonical consolidation |
| `TrajanWJ/ema-atlas` | public | source | 2026-04-22 | make private; archive after migration check |
| `TrajanWJ/ema-transfer-pack-20260422-095631` | public | transfer pack | 2026-04-22 | make private; likely delete after backup approval |
| `TrajanWJ/t3code` | public | fork | 2026-04-13 | leave public or archive; not EMA canonical |
| `TrajanWJ/Auto-GPT` | public | fork | 2023-05-19 | archive or delete after approval |
| `TrajanWJ/AgentGPT` | public | fork | 2023-04-11 | archive or delete after approval |
| `TrajanWJ/luxury-rental-website` | public | app/site | 2026-05-05 | decide business visibility |
| `TrajanWJ/luxury-rental-website-trajan` | public | empty | 2026-01-08 | delete candidate |
| `TrajanWJ/proslync-website` | public | marketing site | 2026-04-18 | decide business visibility |
| `TrajanWJ/hate-my-brother` | public | demo | 2026-03-26 | private or archive candidate |
| `TrajanWJ/agent-os-demo` | public | demo | 2026-03-20 | private/archive candidate; possible EMA lineage donor |
| `TrajanWJ/dispohub` | public | app | 2026-02-26 | archive/private candidate |
| `TrajanWJ/truk-landing` | public | site | 2026-02-24 | archive/private candidate |
| `TrajanWJ/caspian-dashboard` | public | dashboard | 2025-12-30 | business visibility decision |
| `TrajanWJ/mentalGPT` | public | experiment | 2024-05-02 | private/archive/delete candidate |
| `TrajanWJ/Ebay-Link-Viewer-Nice` | public | utility | 2024-04-24 | archive/delete candidate |
| `TrajanWJ/proslync-mobile-app-v1` | private | app | 2026-05-07 | keep private |
| `TrajanWJ/proslync-device-preview-v1` | private | preview | 2026-04-15 | keep private |
| `TrajanWJ/place.org` | private | source | 2026-04-13 | keep private; EMA donor/reference |
| `TrajanWJ/place-companion` | private | source | 2026-03-25 | keep private; EMA donor/reference |
| `TrajanWJ/letmescale` | private | source | 2026-03-16 | keep private |
| `TrajanWJ/blueprint-media-full-archive` | private | archive | 2026-01-15 | keep private/archive |
| `TrajanWJ/execudeck` | private | source | 2026-01-13 | keep private; EMA lineage donor |
| `TrajanWJ/caspian_dash_render_webhook` | private | service | 2025-12-23 | keep private |
| `TrajanWJ/Executive` | private | empty | 2024-10-15 | delete candidate after lineage check |
| `TrajanWJ/Multi-agent-expirements` | private | experiment | 2024-09-09 | keep private; lineage donor |

## Recommended First Approval Batch

This batch is low-risk because it reduces public exposure without deleting or
renaming anything:

```bash
gh repo edit TrajanWJ/EMA-CENTRAL-EVERYTHING --visibility private
gh repo edit TrajanWJ/ema --visibility private
gh repo edit TrajanWJ/ema-atlas --visibility private
gh repo edit TrajanWJ/ema-transfer-pack-20260422-095631 --visibility private
```

## EMA Consolidation Proposal

Target state:

- One canonical private EMA repo.
- Public transfer/lineage repos private first, then archived or deleted after
  local backup and remote successor are verified.
- The active local build at
  `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.5` currently points at
  `https://github.com/TrajanWJ/EMA-CENTRAL-EVERYTHING.git`.

Conservative path:

1. Make all EMA public repos private.
2. Push current active build branch to a new private repo or keep
   `EMA-CENTRAL-EVERYTHING` as canonical private.
3. Rename the canonical repo only after all local remotes and docs are updated.
4. Archive/delete obsolete EMA transfer repos after confirming their useful
   content exists in the active build or project record.

## Actions That Need Explicit User Approval

- Making any repo private or public.
- Renaming any repo.
- Deleting any repo.
- Creating a replacement repo and pushing active code.
- Changing the local active build remote.
- Archiving forks or historical lineage repos.

## Next Command Set After Approval

If the first batch is approved, run the four `gh repo edit ... --visibility
private` commands above, then refresh this inventory with:

```bash
gh repo list --limit 200 --json nameWithOwner,isPrivate,isArchived,isFork,description,pushedAt,visibility,url
```

Then decide whether the canonical EMA repo remains
`TrajanWJ/EMA-CENTRAL-EVERYTHING` or becomes a new private repo such as
`TrajanWJ/ema-private`.
