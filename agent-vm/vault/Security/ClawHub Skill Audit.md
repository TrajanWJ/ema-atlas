---
title: "ClawHub Skill Audit"
created: 2026-03-16
updated: 2026-04-16
type: security
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: security
tags: [discord, github, knowledge, research, security, skills]
summary: "Audited 38 installed skills. **No malicious patterns found.** Some skills have legitimate network calls for their intended function."
---
# ClawHub Skill Audit — 2026-03-16

## Summary
Audited 38 installed skills. **No malicious patterns found.** Some skills have legitimate network calls for their intended function.

## Skills with Runtime Network Calls

### ai-daily-digest
- Fetches RSS feeds (expected behavior)
- Calls Gemini API for scoring (needs API key)
- **Risk:** Low — does what it says

### deep-scraper
- Fetches URLs and YouTube API (expected for scraping)
- **Risk:** Low — needs user-provided URLs

### discord-voice
- Calls OpenAI Whisper/TTS, ElevenLabs, Deepgram APIs
- **Risk:** Low — audio processing, uses configured API keys

### clawdefender
- No actual network calls in code — sanitize.sh is a filter utility
- Example URLs in docs only
- **Risk:** None

## Benign URL Patterns (docs/examples only)
- [[agent-browser]], [[agent-factory]], [[autonomous-pm]], claude-usage-checker — GitHub/docs links only
- [[elite-longterm-memory]], [[memory-hygiene]], [[soulcraft]] — npm/GitHub references
- news-summary — RSS feed URLs in config (expected)
- [[parallel-ai-research]] — UV installer from astral.sh (Python tooling)
- [[security-audit-toolkit]] — Trivy docs links

## Suspicious Patterns Checked
- [x] Phone-home URLs — None found
- [x] Data exfiltration endpoints — None found
- [x] eval() with external input — None found
- [x] base64-encoded payloads — None found
- [x] Webhook exfiltration — None ([[clawdefender]] references webhook.site as an example of what TO DETECT)
- [x] Telemetry/analytics — None found

## Recommendations
1. **Keep skills updated** — `clawhub update` periodically
2. **Review new skills before install** — check for network calls in executable files
3. **Pin versions** where possible for production skills

---

## Staleness Review — 2026-04-16

**Reviewed by:** Vault maintenance task

### Changes Since Original Audit
- **Skill count:** 38 → 25 (13 skills removed or consolidated)
- **ClawHub still installed:** Yes (`/usr/bin/clawhub` present)
- **OpenClaw still active:** Yes (gateway running on port 18789)

### Assessment
The audit methodology and findings are sound but the skill inventory is stale. 13 fewer skills means the attack surface has shrunk, which is positive. However:
- The removed skills should be documented (were they explicitly removed or did they fail to update?)
- The remaining 25 skills have not been re-audited since March
- New skills may have been installed since the audit

### Recommended Action
Run a fresh `clawhub list` and diff against this audit to identify:
1. Which 13 skills were removed
2. Whether any new skills were added
3. Re-audit any new or updated skills for network calls and suspicious patterns
