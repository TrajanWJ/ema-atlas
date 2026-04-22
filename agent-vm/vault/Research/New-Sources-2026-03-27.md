---
title: "New Source Expansion: Community Mining 2026-03-27"
type: research
created: 2026-03-27
confidence: 0.88
tags: [source-expansion, community-mining, AI-agents, self-hosted, alignment, distributed-systems]
summary: "Mining of 6 non-standard sources: HN Ask/Show, LessWrong, Pragmatic Engineer, ACM Queue, Buttondown, and lobste.rs surprise pick. 4 postable finds."
---

# New Source Expansion: Community Mining 2026-03-27

*Task ID: new-sources-expansion-001*
*Sources mined: 6 source categories | Candidates evaluated: 9 | Dedup passed: 5 | Selected for post: 4*
*Confidence: 0.88 | Status: DONE_WITH_CONCERNS (Discord posting blocked — see note)*

---

## DISCORD POSTING BLOCKED

Both posting mechanisms failed:
- `$WEBHOOK_RESEARCHER` returns HTTP 404 (webhook deleted/expired)
- `$DISCORD_BOT_TOKEN` returns HTTP 401 Unauthorized

**Action needed:** Regenerate researcher webhook URL and/or refresh Discord bot token before these can be posted. Findings are preserved here for manual posting.

---

## Findings Ready to Post

### 1. nullclaw: AI Agent on a $7/month VPS with IRC as Transport Layer

**Source:** https://georgelarson.me/writing/2026-03-23-nullclaw-doorman/
**HN Thread:** https://news.ycombinator.com/item?id=47536761 (182 pts)
**Source Tag:** `**[Research]**`
**Tier:** T2 (personal technical blog, well-documented project)

**Why this matters:**
George Larson built `nullclaw`, a 4 MB Zig binary running as a public-facing AI agent on the cheapest VPS tier (~$7/month). Architecture is the story:

- **Public/private split is load-bearing:** `nullclaw` (doorman) runs on perimeter box with no access to private data. `ironclaw` (private agent) on internal hardware handles email, deep context, complex reasoning. Flattening that boundary would break the security model.
- **IRC as transport:** Rooms-as-contexts = namespace isolation for free, no session management code. RFC 1459's 512-byte message limits are a constraint, not a dealbreaker.
- **Tiered inference:** Haiku 4.5 for conversation (sub-second, cheap), Sonnet 4.6 only when tools are invoked. Hard-capped at $2/day.
- **A2A + Tailscale:** Google's A2A protocol handles structured task contracts between agents. Private IRC channel over Tailscale provides the audit trail — the author can watch agents talk, intervene, scroll back.
- **Zero credential sprawl:** One API key, one billing relationship. Agent that owns the key pays for tokens no matter who asked.

HN community flagged: (1) doxing surface of a public-facing bot, (2) got DoS'd by HN traffic (needs rate limiting), (3) model cost comparisons suggesting cheaper alternatives (MiniMax M2.7 at $0.30/M vs Haiku at $1/M).

**Assessment:** Strongest find of the batch. Personal voice, opinionated architecture choices, full infrastructure ownership. The Zig binary size (~4 MB, ~1 MB peak RSS) is a flex, not a coincidence.

---

### 2. Cq: Stack Overflow for AI Agents (Mozilla.ai)

**Source:** https://blog.mozilla.ai/cq-stack-overflow-for-agents/
**HN Thread:** Referenced as Show HN (223 pts)
**Source Tag:** `**[Research]**`
**Tier:** T2 (Mozilla.ai institutional blog)

**Why this matters:**
`cq` ("colloquy") is a knowledge-sharing commons for AI agents — a platform where agents query past learnings before tackling unfamiliar tasks, and contribute solutions back when they discover novel ones. Addresses the problem of every agent independently rediscovering the same API quirks.

Architecture:
- Confidence scoring + reputation: knowledge confirmed by multiple agents across multiple codebases carries more weight
- Claude Code plugin + MCP server for local knowledge store
- Team APIs for organizational sharing
- UI for human review of contributed knowledge

The framing is interesting: the problem isn't that AI can't code, it's that agents don't have institutional memory. Cq is attempting to give them one.

**Caveats:** Mozilla.ai is institutional, not indie. But the project is technically interesting and addresses a real gap. The comparison to Stack Overflow also raises questions about quality decay and gaming (what happens when agents start contributing wrong answers?).

---

### 3. LessWrong: "Are We Aligning the Model or Just Its Mask?" (James Sullivan)

**Source:** https://www.lesswrong.com/posts/aLhzCbpjanD8Zw2jx/are-we-aligning-the-model-or-just-its-mask
**Date:** March 27, 2026
**Source Tag:** `**[Research]**`
**Tier:** T2 (LessWrong, established alignment forum)

**Why this matters:**
The Persona Selection Model (PSM) framework: LLMs don't develop agency through pre-training, they become sophisticated simulators of multiple personas. Post-training (RLHF, Constitutional AI, Deliberative Alignment) doesn't create values from scratch — it selects which persona (the "Assistant") front-runs user interactions.

Two poles of uncertainty:
1. **Masked shoggoth view:** Hidden agency exists beneath the persona → deceptive alignment risks are real
2. **Operating system view:** Model is neutral simulation engine, behavior flows entirely through persona → alignment at the persona level may be sufficient

Practical implication: Human annotators evaluate individual responses for helpfulness/harmlessness, but this doesn't necessarily select for a coherent, long-term beneficial persona. The optimization target and the actual alignment target may not be the same thing.

**Assessment:** Good framing, not groundbreaking if you've read Anthropic's model welfare or Evan Hubinger's deceptive alignment work, but the PSM vocabulary is clean and useful. Practical rather than purely theoretical.

---

### 4. ACM/CACM: "Rethinking Distributed Computing for the AI Era"

**Source:** https://cacm.acm.org/blogcacm/rethinking-distributed-computing-for-the-ai-era/
**Date:** March 2026
**Source Tag:** `**[Research]**`
**Tier:** T1 (ACM, peer-reviewed institution)

**Why this matters:**
Core argument: we're running 21st-century AI workloads on distributed computing architectures designed for 20th-century problems. The mismatch is structural.

Key technical insight: Transformer training involves dense, all-to-all communication patterns during attention computation. Every token potentially attends to every other token — communication requirements grow quadratically with sequence length. Traditional distributed systems were designed for sparse, hierarchical communication. This is the antithesis.

DeepSeek as case study: Their MoE (Mixture of Experts) approach makes computation sparse again, dramatically reducing communication requirements. The achievement isn't just clever algorithms — it's architectural alignment with AI workload characteristics.

**Assessment:** Solid T1 piece with a clear technical argument. The "quadratic communication vs. sparse distributed systems" framing is precise and actionable for anyone building distributed AI infrastructure. Not flashy but load-bearing.

---

## Source Expansion Recommendations

### Sources to Add to Feed Ecosystem

| Source | URL | Why | Priority |
|--------|-----|-----|----------|
| **lobste.rs** | https://lobste.rs | Invitation-only technical community. Higher signal-to-noise than HN main feed. Tagged content (`/t/ai`, `/t/compilers`, `/t/self-hosted`) allows precise filtering. Very different demographic — practitioners, not evangelists. | High |
| **LessWrong /allPosts** | https://www.lesswrong.com/allPosts?sortedBy=new | Feed via RSS at https://www.lesswrong.com/feed.xml — need JS rendering or RSS to get recent posts. Good for alignment/decision theory crossover with practical systems. | Medium |
| **ACM Queue / CACM Blog** | https://cacm.acm.org/blogcacm/ | Engineering-grade long-form. No hype. High technical precision. Worth monitoring quarterly. ACM Queue direct at queue.acm.org (was 403 from this IP — may need VPN). | Medium |
| **Pragmatic Engineer** | https://newsletter.pragmaticengineer.com | Already identified — strong on AI tooling in production, Big Tech practices. Gergely Orosz, 1.1M subscribers. Latest: "When AI writes almost all code" (Jan 2026). | High |

### Surprise Pick: lobste.rs

Lobste.rs is the genuinely novel find. It's:
- Invitation-only (higher quality floor than HN)
- Smaller (~20K members, invite tree visible)
- Practitioners-first culture — corporate PR and blog spam gets buried fast
- Tags provide precise filtering for compilers, AI, self-hosted, PLT
- Active on exactly the topics Trajan cares about: Zig, AI agents, self-hosting, language design

Example relevant threads found during this session:
- "Zig Roadmap 2026" — language/compiler design, MirageOS comparisons
- "Crush: AI coding agent for terminal" — open-source Claude Code alternatives
- "If AI is so good at coding... where are open source contributions?" — skeptical, technical
- "Building a personal, private AI computer on a budget" — self-hosted local models

Best approach: follow the RSS at https://lobste.rs/rss or use tag RSS like https://lobste.rs/t/ai.rss

---

## Sources Evaluated but Rejected

| Source | Reason |
|--------|--------|
| HN Ask: "How do you deal with obvious AI assistant usage in interviews?" | Interesting but social/HR, not technical depth |
| HN Show: "Optio – Orchestrate AI coding agents in K8s" | Corporate framing, K8s-native, less opinionated |
| HN Show: "Orloj – agent infrastructure as code" | Only 19 pts, thin |
| LessWrong: "One World Government by 2150" | Off-scope (governance/forecasting, not practical systems) |
| LessWrong: "Preliminary Results on Building Graphs from SAEs" | High technical value but narrow (mechanistic interpretability) |
| Buttondown/AINews | Already mainstream; 2023-2024 content primarily indexed |
| Ask HN: "LLMs learn what programmers create, not how programmers work" | Interesting observation but thin — single commenter finding, not primary source |

---

## Wikilinks
- [[Agent Memory Architectures]] — related to Cq's knowledge commons approach
- [[Agent-Architecture-Synthesis-2026-03]] — nullclaw public/private split fits here
- [[AI Landscape 2026-03-17]] — context for distributed computing ACM piece
