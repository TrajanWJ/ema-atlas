---
title: "ClawHub Skill Audit"
created: 2026-03-16
updated: 2026-03-16
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
