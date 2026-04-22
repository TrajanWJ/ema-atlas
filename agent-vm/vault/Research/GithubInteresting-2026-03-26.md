# GitHub Interesting — 2026-03-26

*Scouted by Right Hand · 9:49 PM UTC*

---

## 🤖 oh-my-claudecode
**URL:** https://github.com/Yeachan-Heo/oh-my-claudecode
**Stars:** 12,484 · **Source:** GitHub Trending

Teams-first multi-agent orchestration for Claude Code. Zero learning curve via `/omc-setup`. The key differentiator is `/deep-interview` — a Socratic questioning flow that clarifies requirements across weighted dimensions before any code is generated. Pipeline: `team-plan → executor`. Has a sibling project `oh-my-codex` for OpenAI Codex CLI users. TypeScript.

---

## 📈 dexter
**URL:** https://github.com/virattt/dexter
**Stars:** 18,911 · **Source:** GitHub Trending

Autonomous financial research agent with task planning, self-reflection, and live market data. Described as "Claude Code but for financial research." Decomposes complex queries into structured plans, runs them, checks its own work, iterates to confident data-backed answers. Oddly ships with a WhatsApp interface. TypeScript.

---

## 🔒 Ensu — Ente's Offline LLM App
**URL:** https://ente.com/blog/ensu/
**HN Upvotes:** 356

From the team behind Ente Photos (local face recognition, ML on-device, E2EE). Rust core with Tauri desktop and native mobile apps sharing the same codebase. E2EE chat sync via Ente account coming soon. The thesis: local models will cross a sufficiency threshold where privacy + control beats frontier capability for most use cases. Open source.

**Why it matters:** One of the few local LLM apps from a team with a credible track record of shipping difficult local-first AI features.

---

## ⚠️ GitHub Copilot Data Policy Change
**URL:** https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/
**HN Upvotes:** 338

Effective April 24, 2026: Copilot Free, Pro, and Pro+ users will have their interaction data (inputs, outputs, code snippets, context) used for model training by default. Opt-out available in Settings → Privacy. Business and Enterprise tiers unaffected. Users who previously opted out are preserved.

---

## 🏛️ Moving from GitHub to Codeberg (for lazy people)
**URL:** https://unterwaditzer.net/2025/codeberg.html
**HN Upvotes:** 460

Practical migration guide. The good: Codeberg's GitHub import preserves issue numbers, labels, authorship — surprisingly seamless. Codeberg Pages works fine. The hard part: CI. GitHub's free macOS runners and unlimited public repo capacity are a serious moat. Solution: cross-compilation + self-hosted Forgejo Actions runners. Honest about current gaps.

---

## 🖥️ VitruvianOS
**URL:** https://v-os.dev
**HN Upvotes:** 361

Desktop Linux inspired by BeOS/Haiku. The technically interesting piece: *Nexus Kernel Bridge* — a custom Linux kernel subsystem implementing BeOS-style node monitoring, device tracking, and messaging at the kernel level to enable Haiku application compatibility on standard Linux. Not a distro reskin — they're reimplementing the BeOS messaging model.

---

*Tags: [[Claude Code]] [[agents]] [[local LLM]] [[privacy]] [[GitHub]] [[Linux]] [[open source]]*
