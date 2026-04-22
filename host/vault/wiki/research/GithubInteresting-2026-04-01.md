---
type: research
wiki_id: research/GithubInteresting-2026-04-01
imported_from: vault/Research/GithubInteresting-2026-04-01.md
imported_at: '2026-04-04T00:23:57.039Z'
tags: []
summary: ''
---
# GitHub Interesting — 2026-04-01

*Posted to #github-interesting at 23:10 UTC*

## 👁️ agents-observe
**Real-time observability dashboard for Claude Code multi-agent sessions**
- Uses Claude Code hook system (not OTEL) to capture tool calls, file touches, subagent relationships in real-time
- Streams to live local dashboard via Docker + Node hooks
- Install as a Claude Code marketplace plugin: `claude plugin install agents-observe`
- Dashboard at http://localhost:4981
- https://github.com/simple10/agents-observe
- Source: HN, 67pts

## ⚡ SwiftLM
**Native Swift/MLX LLM inference server for Apple Silicon**
- Pure Swift compiled binary, no Python, no GIL, direct Metal access
- Cracked the TurboQuant V2/V3 hybrid: V3 Lloyd-Max codebook quality fused into Metal shaders at V2 speed
- SSD Expert Streaming: zero-copy MoE layer swaps from NVMe to GPU command buffer for 100B+ models without Watchdog panics
- K-Cache: 3-bit PolarQuant + 1-bit QJL = 4.25 bits/dim (~3.5x compression vs FP16)
- https://github.com/SharpAI/SwiftLM
- Source: HN, 76pts

## 🎯 The AI Marketing BS Index
**A "Crackpot Index" for AI hype — Bastian Rieck (ML researcher)**
- +10 for inventing something without a citation/paper
- +20 for motte-and-bailey hedging ("It is not X, it is Y")
- +20 for claiming product does "what nature/the universe does"
- +20 for "emergent properties" where clearly not warranted
- +30 for zero falsifiable claims in technical description
- +40 for unverifiable research collaborations
- https://bastian.rieck.me/blog/2026/bs/
- Source: HN, 84pts

## 🍓 DRAM Pricing Killing the Hobbyist SBC Market
**Jeff Geerling on the structural shift in Pi/SBC economics**
- 16GB Pi 5 now $299.99; LPDDR chips = majority of board cost
- Fewer new boards launched (Radxa only active vendor in 2025)
- Mini PCs also up to $250+ for 8GB
- Geerling pivoting back to microcontrollers; fears smaller SBC vendors won't survive
- https://www.jeffgeerling.com/blog/2026/dram-pricing-is-killing-the-hobbyist-sbc-market/
- Source: HN, 148pts

## 🤔 What Is Copilot Exactly?
**The fragmentation problem from the user perspective**
- Developer tries to use Copilot, discovers there are 9+ products with the same name
- Teams Copilot ≠ Web Copilot ≠ GitHub Copilot (VS Code) ≠ Copilot+ PC ≠ Copilot Pages
- Good documentation of why the naming mess matters for enterprise adoption
- https://idiallo.com/blog/what-is-copilot-exactly
- Source: HN, 73pts

## ✈️ Flight-Viz
**10K live flights on 3D globe in 3.5MB Rust+WASM**
- No external tile servers, no framework bloat
- Real-time ADS-B data rendered directly in browser
- Notable as a Rust/WASM performance benchmark
- https://flight-viz.com
- Source: HN Show, 42pts

---
*Tags: #agents #claude-code #apple-silicon #quantization #hardware #ai-hype #wasm*
