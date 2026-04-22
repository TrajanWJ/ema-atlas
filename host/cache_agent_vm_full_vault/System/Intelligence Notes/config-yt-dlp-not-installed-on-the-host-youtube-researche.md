# Config Change: yt-dlp not installed on the host: YouTube researcher tasks fall back to title+channel inference at 0.55 confidence — transcripts are unavailable, silently degrading research quality

- **Source:** a2ecdfe4.txt
- **Suggested:** 2026-03-26T02:32:47Z
- **Impact:** 3/5

## Change Details

Run `pip install yt-dlp` or `sudo apt install yt-dlp` on the host. Optionally add a pre-flight check in the researcher agent that warns when yt-dlp is absent before attempting YouTube tasks.

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied
