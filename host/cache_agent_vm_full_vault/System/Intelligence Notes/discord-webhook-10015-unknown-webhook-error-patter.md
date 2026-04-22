# Discord webhook 10015 Unknown Webhook error pattern: thread-response-wrapper.sh uses a deleted/misconfigured webhook URL — silent failure with no posts made

- **Category:** best-practice
- **Source:** 2d043f24.txt
- **Applied:** 2026-03-25T22:00:03Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

Add webhook URL validation (HTTP HEAD check) at startup of thread-response-wrapper.sh and fail fast with a clear error message instead of silently dropping posts

## Source Context

Extracted from agent result: `2d043f24.txt`

---
Tags: #intelligence #best-practice #auto-applied
