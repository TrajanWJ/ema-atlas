# GitHub Interesting — 2026-03-29

*Compiled 2026-03-29 23:44 UTC*

## Top Finds

### 🧠 mvanhorn/last30days-skill
**Stars:** 15,269 (+1,186 today) | **Source:** GitHub Trending
**URL:** https://github.com/mvanhorn/last30days-skill

Agent skill that researches any topic across Reddit, X, YouTube, HN, Polymarket, and the web — synthesizes grounded narrative with real citations. v2.9.5 added Bluesky (AT Protocol) as a social source, and comparative mode: `/last30 Claude Code vs Codex` runs 3 parallel research passes and gives a side-by-side table with a data-driven verdict. Auto-saves every run to `~/Documents/Last30Days/`. 455+ tests. This is the most complete multi-source research skill currently available.

**Why it matters:** Drop-in research capability for any agent setup. The comparative mode is genuinely novel.

---

### 🎤 microsoft/VibeVoice
**Stars:** 27,118 (+1,190 today) | **Source:** GitHub Trending  
**URL:** https://github.com/microsoft/VibeVoice

Microsoft's open-source frontier voice AI. Sparse documentation but 1,190 stars in a day from a credible org signals a real release. Likely competitive with ElevenLabs / Chatterbox in TTS/STT quality.

---

### 📖 luongnv89/claude-howto
**Stars:** 6,485 (+1,121 today) | **Source:** GitHub Trending
**URL:** https://github.com/luongnv89/claude-howto

Visual, example-driven Claude Code guide covering hooks, subagents, MCP servers, skills, and memory architecture — with copy-paste templates. Fills the gap the official docs leave: "I installed Claude Code, now what?" Has an extensive CATALOG.md. Clearly written by an experienced user.

---

### 🎮 moeru-ai/airi
**Stars:** 36,326 (+213 today) | **Source:** GitHub Trending
**URL:** https://github.com/moeru-ai/airi

Self-hosted AI companion (Neuro-sama style) with real-time voice chat, multiple LLM backends, plays Minecraft and Factorio, runs on web/macOS/Windows. Modular soul-container architecture, pluggable character rigs. Active international community (7 language READMEs). TypeScript.

---

### 🕵️ Decrypting Cloudflare Turnstile (ChatGPT bot detection)
**Upvotes:** 270 HN | **Source:** HN Best
**URL:** https://www.buchodi.com/chatgpt-wont-let-you-type-until-cloudflare-reads-your-react-state-i-decrypted-the-program-that-does-it/

Researcher decrypted 377 Turnstile programs from network traffic and found Cloudflare doesn't just fingerprint browsers — it verifies you've fully booted ChatGPT's React SPA specifically (`__reactRouterContext`, `loaderData`, `clientBootstrap`). The encryption uses a two-layer XOR scheme where the inner key is a float literal embedded in the bytecode. Full decryption chain documented. Security/reverse-engineering deep dive worth archiving.

---

### ⚡ CERN Burns Neural Nets into Silicon (FPGAs for LHC)
**Upvotes:** 324 HN | **Source:** HN Best
**URL:** https://news.ycombinator.com/item?id=47552562

CERN runs ultra-compact AI models on FPGAs to filter LHC particle collision data in nanoseconds. Models must make decisions faster than any CPU can handle, so they synthesize the neural net directly into FPGA logic gates. AI inference at the physical speed limit — latency bounded by the speed of light, not software.

---

### 📜 EnriqueLop/legalize-es
**Stars:** Growing | **HN:** 792 pts | **Source:** HN Best
**URL:** https://github.com/EnriqueLop/legalize-es

Spanish legislation as a Git repository — every law as a tracked file, every amendment as a diff. Makes legal change history trivially auditable. Strong HN discussion (225 comments) on implications for democratic transparency, legal challenges, and why this isn't the global standard yet.

---

### 💀 LinkedIn: 2.4 GB RAM Across Two Tabs
**Upvotes:** 574 HN | **Source:** HN Best
**URL:** https://news.ycombinator.com/item?id=47561489

341-comment HN thread on browser memory bloat, sparked by the contrast with Voyager 1 (69KB, still operational 49 years out). Best comment: "This right here — this probe collecting data in space takes 69KB and LinkedIn needs 2.4GB just to show me who viewed my profile." Substantive discussion on what went wrong with web development.

---

## Meta
- Sources used: GitHub Trending (daily), HN Best (48h)
- Items skipped (already posted): jai.scs.stanford.edu, miasma, cocoa-way, neovim 0.12, knuth-claude, css-doom, linux-interpreter, stanford-sycophancy
- Next rotation: Reddit r/MachineLearning, ArXiv, personal blogs
