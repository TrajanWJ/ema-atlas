# GitHub Interesting — 2026-04-02

*Scout run: Apr 2, 4:33 PM UTC*

## 🔍 Claude Code Unpacked
**URL:** https://ccunpacked.dev/
**Source:** HN · 1,075 pts
**Why it matters:** Visual walkthrough of Claude Code's entire source — agent loop step by step, architecture explorer, all 44 tools categorized, all slash commands, hidden/unreleased features. Essential reference for anyone building on Claude Code.

## ⚡ PrismML — 1-bit Bonsai LLMs
**URL:** https://prismml.com/
**Source:** HN Show · 411 pts
**Why it matters:** Claims first commercially viable 1-bit weight models. 8B in 1.15GB RAM, 14× smaller than full-precision, 8× faster, 5× more energy efficient while matching 8B benchmarks. 1.7B at 0.24GB hits 130 tok/s on iPhone. Step-change for local/edge inference if benchmarks hold up.

## 🤖 NousResearch/hermes-agent
**URL:** https://github.com/NousResearch/hermes-agent
**Source:** GitHub Trending · 22.4k ⭐ (+8,214 this week)
**Why it matters:** NousResearch (credible — Hermes series is go-to for structured outputs/tool calling) releasing their persistent self-improving agent architecture. Worth tracking.

## 🧬 SakanaAI/AI-Scientist-v2
**URL:** https://github.com/SakanaAI/AI-Scientist-v2
**Source:** GitHub Trending · 4.4k ⭐ (+1,972 this week)
**Why it matters:** MCTS-based autonomous scientific discovery. Generates research directions, runs experiments, writes papers. Has cleared workshop-level peer review in demos. The "AI does research" frontier moving fast.

## 📦 MiniStack — Free LocalStack Replacement
**URL:** https://ministack.org/
**Source:** HN · 308 pts
**Why it matters:** LocalStack core services went paid. MiniStack is MIT-licensed, 34 AWS services, 30MB RAM, 2s startup, runs *real* Postgres/Redis for RDS/ElastiCache. Drop-in replacement via same `--endpoint-url`.

## 🔐 LinkedIn Browser Extension Scanning (BrowserGate)
**URL:** https://browsergate.eu/
**Source:** HN · 912 pts
**Why it matters:** LinkedIn silently probes thousands of extension IDs on every page load, collects + encrypts + exfiltrates the fingerprint. Documents exactly which IDs and how. Privacy-relevant for anyone using LinkedIn with a browser.

## 💾 DRAM Pricing Is Killing the Hobbyist SBC Market
**URL:** https://www.jeffgeerling.com/blog/2026/dram-pricing-is-killing-the-hobbyist-sbc-market/
**Source:** HN · 578 pts (Jeff Geerling)
**Why it matters:** RPi 5 16GB is now $299.99. LPDDR chips are majority of board cost. Practical implication: building local AI inference rigs on SBCs is getting expensive fast. Mini PCs at $250+ for 8GB. Affects hardware planning.

## 🐛 Claude Wrote a Full FreeBSD Kernel RCE (CVE-2026-4747)
**URL:** https://github.com/califio/publications/blob/main/MADBugs/CVE-2026-4747/write-up.md
**Source:** HN · 264 pts
**Why it matters:** Classic stack overflow in NFS GSS-API handler — `oa_length` copied into 128-byte stack buffer with no bounds check. Claude Code found the vuln, wrote the exploit, wrote the write-up. Affects FreeBSD 13.5–15.0 with kgssapi.ko. Patched as FreeBSD-SA-26:08. Demonstrates AI-assisted vuln research maturing.

---

## Also Notable (GitHub Trending, not posted)
- **microsoft/VibeVoice** — Open-source frontier voice AI from Microsoft. 35k stars, 10k this week.
- **affaan-m/everything-claude-code** — 133k stars, 23.5k this week. De facto agent harness optimization reference.
- **obra/superpowers** — Agentic skills framework & software dev methodology. Worth a closer look.
- **Yeachan-Heo/oh-my-codex** — Oh My codeX: hooks, agent teams, HUDs for Codex. 10.7k stars.
