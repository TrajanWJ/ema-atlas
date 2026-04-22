---
type: research
wiki_id: research/GithubInteresting-2026-03-31
imported_from: vault/Research/GithubInteresting-2026-03-31.md
imported_at: '2026-04-04T00:23:57.039Z'
tags: []
summary: ''
---
# GitHub Interesting — March 31, 2026

*Run: 11:12 PM UTC · 7 items · Source: HN Best*

---

## 🦠 Fedware: Government Apps That Spy Harder Than the Apps They Ban
**URL:** https://www.sambent.com/the-white-house-app-has-huawei-spyware-and-an-ice-tip-line/
**HN pts:** 655
**Why notable:** APK-level forensic analysis of US federal agency apps. The White House app ships with HuaweiMobileServicesCore (a sanctioned Chinese vendor), biometric access permissions, an ICE tip line, and a "Text the President" button that harvests your phone number after auto-filling "Greatest President Ever!". Sam Bent covered 13 federal apps in depth — FBI app serves ads, FEMA wants 28 permissions for weather alerts. The term "Fedware" is a good shorthand for this class of surveillance.

---

## 📄 Universal CLAUDE.md — Cut Claude Output Verbosity ~63%
**URL:** https://github.com/drona23/claude-token-efficient
**HN pts:** 446
**Why notable:** One file drop-in that immediately suppresses Claude's default verbosity patterns (sycophancy, em-dash abuse, question restating, unsolicited abstractions). Benchmarked specifically on automation pipelines. Author is unusually honest about the limits: doesn't fix input token costs, not worth it for low-volume use. Directly relevant to Claude Code workflows.

---

## ⚖️ Microsoft: Copilot Is "For Entertainment Purposes Only"
**URL:** https://www.microsoft.com/en-us/microsoft-copilot/for-individuals/termsofuse
**HN pts:** 419
**Why notable:** The HN thread surfaced a more interesting story: Anthropic's consumer terms served from a UK IP inject a clause banning commercial use for Pro subscribers — no equivalent exists for US users. Someone posted a diffchecker link showing the exact injection at line 134. Two major AI companies, two hidden ToS gotchas in one thread.
**Related:** https://www.diffchecker.com/BtqVrR9p/ (US vs UK Anthropic terms diff)

---

## ✍️ Don't Let AI Write For You
**URL:** https://alexhwoods.com/dont-let-ai-write-for-you/
**HN pts:** 709
**Why notable:** Structural argument, not a moral one. Writing is posed questions; the effort of answering is what builds understanding and credibility. "Using LLMs to write is like paying someone to work out for you." Uses Oxide's RFD LLM policy as a concrete reference. Short, sharp, worth bookmarking.

---

## 🤖 Android Developer Verification — Identity Now Required, Including Sideloading
**URL:** https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html
**HN pts:** 316
**Why notable:** Most significant change to Android's sideloading model in years. All Android devs — including those who distribute entirely outside the Play Store — now need identity verification in a new "Android Developer Console." User-facing enforcement starts Sept 2026 in Brazil/Indonesia/Singapore/Thailand, global in 2027. Implications for pseudonymous/privacy-focused development are real.

---

## 🔤 CodingFont — Blind Tournament to Find Your Coding Font
**URL:** https://www.codingfont.com/
**HN pts:** 472
**Why notable:** Bracket-style blind comparison — same code in two fonts, pick one, repeat until winner. No descriptions, no marketing copy. Genuinely the right way to pick a coding font.

---

## 🎨 The Curious Case of Retro Demo Scene Graphics
**URL:** https://www.datagubbe.se/aipixels/
**HN pts:** 353
**Why notable:** Well-researched essay arguing early demoscene pixel art was almost entirely plagiarized from Frazetta/Vallejo, with craft (not originality) as the value. Draws a sharp parallel to AI image generation — same tradition of transforming reference material into something new via skilled process. Uses real demoscene history rather than hot takes.

---

*Saved by Right Hand · github-interesting cron · 2026-03-31*
