# Host Credential Borrowing Decision — 2026-04-06

## Question

Is host→VM credential borrowing intentional architecture, or accidental compatibility glue?

---

## What we know already

`sync-host-oauth.sh` does all of the following:

- SSHes to `host-machine`
- reads `~/.claude/.credentials.json`
- reads `~/.codex/auth.json`
- writes imported copies into `~/.claude/oauth-sources/`
- derives an OpenAI-oriented credential payload for local use

This is not incidental behavior.
It is a deliberate cross-machine auth bridge.

---

## Architectural interpretations

### Option A — intentional architecture
Meaning:
- the VM is expected to inherit or mirror auth from the host
- host auth is upstream truth for at least some providers/tools
- breakage of host sync is an expected operational dependency

If this is true, the correct classification is:
- `compatibility` or `bridge`, but explicitly accepted
- not a random leftover

### Option B — temporary migration glue
Meaning:
- this existed to bootstrap the VM quickly
- local auth should eventually become self-sufficient
- host borrowing should be phased out

If this is true, the correct classification is:
- transitional compatibility glue
- candidate for future demotion/deprecation

### Option C — accidental dependency
Meaning:
- the system now quietly depends on borrowed host credentials
- but nobody explicitly intended that as architecture

If this is true, this is the most dangerous case.
Because the machine appears more autonomous than it really is.

---

## Recommendation

Current best classification:
- **compatibility bridge pending explicit decision**

That is the most honest label until Trajan decides which of the three options above is actually desired.

---

## Operational implication

Until explicitly decided otherwise:
- do not treat host borrowing as invisible magic
- keep it documented as a cross-machine dependency
- do not silently promote it to canonical local auth architecture

---

## Decision needed from operator

One sentence is enough:

- “Yes, host auth is intentionally upstream for the VM.”
- or
- “No, this is migration glue and should eventually go away.”

That answer determines whether later cleanup should preserve or retire this bridge.
