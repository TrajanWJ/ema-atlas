---
title: "axios npm Supply Chain Attack — Precision RAT Dropper (March 2026)"
created: 2026-03-31
type: security-note
status: active
severity: high
tags: [security, supply-chain, npm, malware, axios, ci-cd]
summary: "Two axios npm versions poisoned with a cross-platform RAT via a fake dependency. Pre-staged attack, self-deleting payloads, C2 contact within 2s of install. Detected by anomalous outbound CI traffic."
source: https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan
---

# axios npm Supply Chain Attack — March 2026

## What Happened

Two axios versions (**1.14.1** and **0.30.4**) were poisoned with a fake dependency `plain-crypto-js@4.2.1` that deployed a cross-platform Remote Access Trojan (RAT). 

Key facts:
- No malicious code inside axios itself — attack lived entirely in the fake dependency
- Pre-staged 18 hours before the attack was triggered
- Three OS-specific payloads (Windows, Linux, macOS)
- **Called C2 within 2 seconds of `npm install`**
- All artifacts self-deleted after execution — zero forensic trace in node_modules

Detected by StepSecurity's Harden-Runner flagging anomalous outbound network connections during CI pipelines.

## Why This Matters

This isn't opportunistic. It's a precision attack on a top-10 npm package (~2B weekly downloads). The attack pattern is worth internalizing:

1. **Poison a transitive dependency, not the package itself** — direct code audits of axios would find nothing
2. **Pre-stage infrastructure** — the fake package was on npm for 18 hours before activation, passing recency checks
3. **OS-aware payloads** — not a lazy dropper, designed for real coverage across dev environments
4. **Self-destruct by design** — post-execution cleanup makes forensic recovery hard

## Operational Takeaways

- **Lock lockfiles.** `package-lock.json` and `yarn.lock` should be committed and verified in CI. A new `npm install` from scratch can pull poisoned versions.
- **Audit transitive deps, not just direct.** `npm audit` wouldn't catch this — the malicious package wasn't marked vulnerable, it was simply new and fake.
- **Outbound network monitoring in CI catches it.** Harden-Runner (StepSecurity) flagged unexpected outbound connections. Consider adding this to CI pipelines.
- **Pinned versions ≠ safe versions.** The attack versions appeared legitimate until they didn't.

## For This Setup

- Agent VM installs npm packages for OpenClaw, Claude Code, and various scripts
- Any `npm install` on a non-lockfile project could be affected if vulnerable versions are cached
- Consider periodic `npm audit` on the agent VM package tree

## Affected Versions

- `axios@1.14.1`
- `axios@0.30.4`

Both removed from npm registry after detection. If using these exact versions, reinstall from a clean state.

## Related

- [[Security/]] — Security notes index
- [[vault/Operations/]] — Agent VM operations
- [[Research/GithubInteresting-2026-03-31.md]] — Source post
