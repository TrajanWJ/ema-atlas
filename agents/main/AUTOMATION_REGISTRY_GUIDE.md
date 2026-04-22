# Automation Registry Guide

## Purpose

The generated cron snapshot was useful, but too dumb to drive real cleanup.
This curated registry is the next step:

- `bootstrap/automation-registry.curated.json`

It is intended to become the machine-readable source of truth for automation ownership.

---

## Registry model

Each entry should answer:

- **what is it?**
- **who owns it?**
- **what domain is it in?**
- **what kind of automation is it?**
- **what is the risk?**
- **does it have external effects?**
- **is it canonical or secondary?**
- **what does it read?**
- **what does it write?**
- **what docs explain it?**

---

## Current field meanings

### `kind`
- `service`
- `cron`
- later maybe `hook`, `manual`, `mcp`, `pipeline`

### `owner`
Who should own changes / review:
- `ops`
- `vault-keeper`
- `researcher`
- `strategist`
- etc.

### `domain`
Broad system area:
- `openclaw`
- `dispatch`
- `knowledge`
- `research`
- `auth`
- `ema`
- `maintenance`
- `integrity`

### `class`
Recommended finite set:
- `detector`
- `feeder`
- `executor`
- `mutator`
- `ingestor`
- `janitor`
- `publisher`

### `risk`
Suggested levels:
- `low`
- `medium`
- `high`
- `critical`

### `canonical`
- `true` means this should be treated as part of the intended system
- `false` means likely overlapping, experimental, legacy-adjacent, or review-needed

---

## How to use it

### For cleanup
Filter entries where:
- `canonical == false`
- `risk in ["high", "critical"]`
- same `domain` but overlapping `class`

### For ownership
Group by:
- `owner`
- `domain`

### For docs generation
Render views like:
- all auth mutators
- all dispatch executors
- all knowledge ingestors
- all external-effect jobs

---

## Immediate next upgrades

1. add remaining cron jobs
2. add all systemd user services
3. add major hooks and MCP-adjacent mutators
4. add explicit `related` links between overlapping jobs
5. add `status` (`active`, `legacy`, `experimental`, `unknown`)

---

## Important principle

The registry should become the thing from which cleanup docs are derived.
Not the other way around.

That is how this stops turning back into folklore.
