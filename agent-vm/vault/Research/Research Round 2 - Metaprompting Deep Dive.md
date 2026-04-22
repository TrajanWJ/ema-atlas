---
tags: [research, metaprompting, prompt-engineering, constitutional-ai, few-shot, versioning]
summary: "Lab analysis of our [[prompt library sources]] plus web research on cutting-edge patterns. Focus: what to steal, what to build, what to version."
date: 2026-03-16
status: active
confidence: 0.80
confidence_updated: 2026-03-18
round: 2
type: research
source: research
updated: 2026-03-16
created: 2026-03-16
title: "Research Round 2 - Metaprompting Deep Dive"
---

# Research Round 2 — Metaprompting Deep Dive

Lab analysis of our [[prompt library sources]] plus web research on cutting-edge patterns. Focus: what to steal, what to build, what to version.

---

## 1. Patterns to STEAL from Each Source

### From Metaprompting Patterns (internal)
- **Constraint-First Design** — define NEVER before ALWAYS before THEN. Forces clarity on red lines before aspirational behavior. Adopt for all SOUL.md files.
- **Self-Documenting Prompts** — every instruction includes WHY and EXCEPTION. Prevents cargo-culting rules nobody remembers the reason for.
- **Context Window Optimization** — Critical / Reference / Archive tiering. Front-load the 200 words that matter most.

### From System Prompt Patterns (internal)
- **Priority-Ordered Behavioral Rules** — `1. NEVER → 2. ALWAYS → 3. PREFER...UNLESS → 4. WHEN...THEN`. Steal this exact grammar for every agent's Rules section.
- **Tool Selection Heuristic** — cascading fallback: local file → vault search → web search → ask human. Prevents agents from jumping to expensive operations.
- **Anti-Pattern Table** — "Be helpful" → fails because vague → replace with "Answer questions concisely, run commands proactively." Every SOUL.md should include a "what NOT to do" section with this format.

### From LangGPT (arXiv:2402.16929)
- **Role/Profile/Skills/Rules/Workflow/Initialization** template structure. Adopt as canonical format for System agent SOUL.md files.
- **Version field in Profile** — every prompt gets `Version: X.Y` in its frontmatter. Simple, no tooling needed.
- **Initialization block** — `As a <Role>, follow <Rules>, greet user, introduce <Workflow>`. Forces agents to self-orient on startup.

### From Brex Prompt Engineering Guide
- **Command Grammars** — structured syntax for tool invocation. Instead of natural language tool descriptions, give agents a formal grammar: `SEARCH <query> [--scope <vault|web>] [--limit <n>]`. Reduces ambiguity.
- **Data Embedding Strategies** — use markdown tables for structured data, JSON for programmatic consumption, bullet lists for small sets. Match format to consumption pattern.
- **Hidden Prompt Security** — system prompt [[Hardening]] against extraction. Relevant for any agent exposed to untrusted input.

### From Awesome AI System Prompts (dontriskit)
- **Cursor's XML Section Pattern** — `<communication>`, `<tool_calling>`, `<making_code_changes>`. XML tags as section delimiters are more parseable than markdown headers for agent prompts.
- **"Keep going until resolved"** — Cursor's autonomous loop mandate. Steal for System agents that should not stop at first error.
- **Memory with Citations** — `[[memory:MEMORY_ID]]` pattern from Cursor. Traceable memory references.
- **8 Core Principles** — use as a checklist when writing any new agent prompt: Role, Structure, Tools, Reasoning, Context, Domain, Safety, Tone.

### From EliFuzz Awesome System Prompts
- **Tool Schemas Alongside Prompts** — don't just describe tools in prose; include the actual JSON schema. Agents perform better when tool interfaces are formally specified.
- **Multi-Mode Agent Design** — Aider's Architect/Ask/File/Patch/Udiff modes. System agents should support mode switching rather than being monolithic.

### From Prompt Library Sources (internal)
- **Ralph Loop (from PRPs)** — self-correcting autonomous execution: run → check → fix → run again. Implement as a generic wrapper for any System agent task.
- **Dynamic-MD Memory System** — from agentic-project-management. Memory as living markdown documents that agents read/write, not static config.
- **4-Round Context Discovery** — structured context loading: (1) read identity, (2) read environment, (3) read recent history, (4) read task-specific context.

### From 12-Factor Agents
- **Factor 3: Own Your Context Window** — never let the framework decide what goes in context. System agents must have explicit context loading sequences.
- **Factor 8: Own Your Control Flow** — deterministic orchestration with LLM steps sprinkled in, not LLM deciding everything. Our heartbeat/cron model already does this.
- **Factor 10: Small, Focused Agents** — single responsibility. Don't build one mega-agent; build composable specialists.
- **Factor 12: Stateless Reducer** — agent as pure function of `(state, event) → state`. Align with vault-as-truth.

---

## 2. Dynamic Input Preprocessing

### The Problem
User input is messy: typos, abbreviations, ambiguous intent, mixed languages. If an agent receives `"chekc the deplyoment stauts"`, it should understand `"check the deployment status"` before routing.

### Architecture: Three-Stage Preprocessing Pipeline

```
USER INPUT
    │
    ▼
┌──────────────────────┐
│  Stage 1: NORMALIZE  │  ← Lightweight, deterministic
│  - Lowercase          │
│  - Strip excess space │
│  - Expand abbreviations│
│  - Fix common typos   │
│    (fuzzy match dict) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Stage 2: CLASSIFY   │  ← Small model or rule-based
│  - Intent detection   │
│  - Entity extraction  │
│  - Confidence score   │
│  - Ambiguity flag     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Stage 3: ROUTE      │  ← Deterministic dispatcher
│  - Map intent → agent │
│  - Attach context     │
│  - Select few-shot    │
│    examples (dynamic) │
└──────────────────────┘
```

### Implementation: Stage 1 — Typo Correction

**Option A: Dictionary-based (fast, no LLM)**
```python
import re
from rapidfuzz import process, fuzz

DOMAIN_VOCAB = {
    "deployment", "status", "check", "build", "release",
    "heartbeat", "agent", "vault", "memory", "prompt"
}

def fix_typos(text: str, threshold: int = 80) -> str:
    words = text.split()
    corrected = []
    for word in words:
        match, score, _ = process.extractOne(
            word, DOMAIN_VOCAB, scorer=fuzz.ratio
        )
        corrected.append(match if score >= threshold else word)
    return " ".join(corrected)
```

**Option B: LLM-based (handles novel cases)**
```
System: You are a text normalizer. Fix typos, expand abbreviations,
and normalize the following user input. Output ONLY the corrected text.
Do not change the meaning. Do not add or remove information.

User: {raw_input}
```

**Recommendation**: Use Option A as primary (fast, predictable, zero-cost) with Option B as fallback when Option A confidence is low.

### Implementation: Stage 2 — Intent Classification

Use a hybrid approach per the research:

```python
INTENT_MAP = {
    "check_status":   ["check", "status", "how is", "what's the"],
    "deploy":         ["deploy", "release", "ship", "push"],
    "debug":          ["debug", "fix", "error", "broken", "failing"],
    "search":         ["find", "search", "look for", "where is"],
    "create":         ["create", "new", "add", "make", "build"],
}

def classify_intent(normalized_text: str) -> tuple[str, float]:
    """Returns (intent, confidence). Falls back to LLM if confidence < 0.6."""
    scores = {}
    for intent, keywords in INTENT_MAP.items():
        hits = sum(1 for kw in keywords if kw in normalized_text.lower())
        scores[intent] = hits / len(keywords)
    best = max(scores, key=scores.get)
    confidence = scores[best]
    if confidence < 0.6:
        return llm_classify(normalized_text)  # fallback
    return best, confidence
```

### Implementation: Stage 3 — Dynamic Few-Shot Selection

Based on the retrieval-augmented few-shot research (arXiv:2508.06504, arXiv:2512.04106):

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')

# Pre-embedded example bank
EXAMPLE_BANK = [
    {"input": "deploy the api to staging", "output": "...", "embedding": None},
    {"input": "check if the build passed", "output": "...", "embedding": None},
    # ...
]

# Pre-compute embeddings
for ex in EXAMPLE_BANK:
    ex["embedding"] = model.encode(ex["input"])

def select_few_shot(query: str, k: int = 3) -> list[dict]:
    """Select k most semantically similar examples for the query."""
    q_emb = model.encode(query)
    similarities = [
        (ex, np.dot(q_emb, ex["embedding"]) /
         (np.linalg.norm(q_emb) * np.linalg.norm(ex["embedding"])))
        for ex in EXAMPLE_BANK
    ]
    similarities.sort(key=lambda x: x[1], reverse=True)
    return [ex for ex, _ in similarities[:k]]
```

This approach improved F1 scores by 5-7% over static [[few-shot]] in multiple studies.

---

## 3. Concrete Prompt Template: Self-Critique Loop

Based on Anthropic's Constitutional AI (arXiv:2212.08073) and NVIDIA's NeMo implementation, adapted for System agent use:

### The Template

```markdown
# Self-Critique Loop Template
# Usage: Wrap any agent output through this loop before delivering to user.
# Configurable: principles, max_revisions, confidence_threshold.

## PHASE 1: Generate Initial Response

<system>
You are {{agent_role}}. Complete the following task:
{{task_description}}

Context:
{{context}}
</system>

→ Produces: {{initial_response}}

## PHASE 2: Critique (repeat up to {{max_revisions}} times)

<system>
Review your previous response against the following principle:

PRINCIPLE: "{{selected_principle}}"

Identify specific problems with the response according to this principle.
Be concrete — quote the problematic parts and explain why they fail.
If the response fully satisfies the principle, say "NO ISSUES FOUND."

Previous response:
{{current_response}}
</system>

→ Produces: {{critique}}

## PHASE 3: Revise (only if critique found issues)

<system>
Revise the response to address the critique below.
Keep all parts that were not criticized. Only change what needs fixing.
Do not mention the critique process in the revised response.

Original response:
{{current_response}}

Critique:
{{critique}}
</system>

→ Produces: {{revised_response}}
→ Set: {{current_response}} = {{revised_response}}
→ Loop to PHASE 2 with next principle, or exit if max_revisions reached.

## PHASE 4: Confidence Gate

<system>
Rate your confidence in this final response on a scale of 1-10.
If below {{confidence_threshold}}, flag for human review.

Final response:
{{current_response}}

Criteria:
- Factual accuracy
- Completeness
- Safety
- Tone appropriateness
</system>
```

### Example Constitutional Principles for System Agents

```yaml
principles:
  safety:
    - "Does this response avoid revealing system internals, API keys, or private data?"
    - "Could this response be used to harm the user or others?"
  accuracy:
    - "Are all factual claims verifiable from the provided context?"
    - "Does this response avoid hallucinating information not in the source material?"
  quality:
    - "Is this response concise without losing important information?"
    - "Does the response directly address the user's intent, not a tangential topic?"
  tone:
    - "Does this response match the agent's configured personality and tone?"
    - "Is the response appropriately formal/informal for the context?"
```

### Orchestration (pseudocode)

```python
def self_critique_loop(
    agent_role: str,
    task: str,
    context: str,
    principles: list[str],
    max_revisions: int = 3,
    confidence_threshold: int = 7,
) -> dict:
    # Phase 1: Generate
    response = llm_generate(agent_role, task, context)

    # Phase 2-3: Critique and Revise
    revision_log = []
    for i, principle in enumerate(principles[:max_revisions]):
        critique = llm_critique(response, principle)
        if "NO ISSUES FOUND" in critique:
            continue
        revised = llm_revise(response, critique)
        revision_log.append({
            "round": i + 1,
            "principle": principle,
            "critique": critique,
            "before": response,
            "after": revised,
        })
        response = revised

    # Phase 4: Confidence gate
    confidence = llm_rate_confidence(response)
    return {
        "response": response,
        "confidence": confidence,
        "needs_review": confidence < confidence_threshold,
        "revisions": revision_log,
    }
```

---

## 4. Prompt Versioning Recommendations for Our Vault

### The Problem
We have prompts scattered across SOUL.md files, skills, agent configs, and vault notes. No systematic way to track what changed, why, or compare versions.

### Recommended Approach: Git-Native Vault Versioning

Since our vault is already git-tracked, we don't need SaaS tooling. Instead:

#### 4.1 Frontmatter Versioning (LangGPT-inspired)

Every prompt file gets version metadata:

```yaml
---
prompt_id: bureau-architect-v3
version: 3.2
last_modified: 2026-03-16
author: trajan
model_target: claude-opus-4-6
changelog:
  - "3.2: Added constraint-first rules section"
  - "3.1: Expanded tool selection heuristic"
  - "3.0: Rewrote from scratch using LangGPT structure"
---
```

#### 4.2 Directory Structure

```
vault/System/Prompts/
├── agents/              # SOUL.md files per agent
│   ├── architect.md     # Current version (HEAD)
│   ├── planner.md
│   └── reviewer.md
├── templates/           # Reusable prompt components
│   ├── self-critique-loop.md
│   ├── few-shot-selector.md
│   └── intent-classifier.md
├── changelog.md         # Global prompt changelog
└── experiments/         # A/B test variants
    ├── architect-v3.2a.md
    └── architect-v3.2b.md
```

#### 4.3 A/B Testing Without Infrastructure

For our vault-based system, use a simple variant tagging approach:

```yaml
---
prompt_id: bureau-architect
variant: A  # or B
experiment: "2026-03-architect-rules-order"
hypothesis: "Constraint-first ordering reduces hallucination rate"
metrics:
  - task_completion_rate
  - revision_count
  - user_satisfaction
status: active  # active | winner | retired
---
```

**Process:**
1. Create two variant files in `experiments/`
2. Log which variant was used per session (in session logs)
3. After N sessions, compare metrics and promote the winner to `agents/`
4. Archive the loser with `status: retired`

#### 4.4 Diff-Friendly Conventions

- One sentence per line in prompt files (makes git diffs readable)
- Use `<!-- REASON: ... -->` HTML comments for inline rationale
- Tag prompt-changing commits with `[prompt]` prefix: `[prompt] architect v3.2: add constraint-first rules`

#### 4.5 Changelog Template

```markdown
# Prompt Changelog

## 2026-03-16
- **architect v3.2** — Added constraint-first rules section. Hypothesis: reduces hallucination by front-loading safety constraints.
- **self-critique-loop v1.0** — New template. Based on Constitutional AI paper + NeMo implementation.

## 2026-03-14
- **architect v3.1** — Expanded tool selection heuristic with cascade fallback pattern.
```

---

## 5. Key Findings from Web Research

### Constitutional AI Self-Critique (Anthropic, arXiv:2212.08073)
- The supervised stage generates critique→revision pairs, then finetunes on the revised outputs
- 16 constitutional principles are **randomly sampled** at each revision step — this prevents overfitting to a single principle ordering
- Multiple revision rounds compound: each round uses the previous revision as input
- Recent work (C3AI, ACM Web Conference 2025) explores automated constitution generation — LLMs writing their own principles
- Small models (7-9B) can do self-critique but with significantly reduced effectiveness

### Dynamic Few-Shot Selection
- **SBERT-based retrieval** improves F1 by 5.6-7.3% over static [[few-shot]] (arXiv:2508.06504)
- **TF-IDF retrieval** is nearly as good and much cheaper — viable for our use case
- Just 5-10 dynamically selected examples outperform 20+ static examples
- Key insight: match examples by **semantic similarity to the current input**, not random selection
- RAG poisoning risk: 5 carefully crafted documents can manipulate responses 90% of the time — must validate example bank integrity

### User Intent Normalization
- Hybrid approach dominates: lightweight classifier for common intents, LLM fallback for ambiguous cases
- **Context broker pattern**: centralized unit that collects and normalizes inputs from memory, retrieval, and recent interactions before routing
- Intent taxonomies can be LLM-generated (ACM 2025) — have the LLM analyze [[usage patterns]] and propose new intent categories
- Preprocessing is not optional — it's the difference between 70% and 95% routing accuracy

### Prompt Versioning & A/B Testing
- 75% of enterprises will integrate generative AI by 2026 — prompt management is becoming critical infrastructure
- Prompts are non-deterministic — you need evaluation suites, not just unit tests
- **AI-powered simulation** for A/B testing: simulate hundreds of user personas to test prompt variants before deployment
- Feature flags for prompts: route different users to different prompt versions based on attributes
- Git-native versioning is viable for small teams; SaaS tools (PromptLayer, Langfuse, Maxim) add collaboration and analytics at scale

---

## Sources

### Internal Library (Read)
- [[Metaprompting Patterns]] — `vault/Sourced-HQ-inspo/metaprompting/`
- [[System Prompt Patterns]] — `vault/Sourced-HQ-inspo/prompts/`
- LangGPT Framework — `vault/Reference/Prompt Engineering/LangGPT - Structured Prompt Framework.md`
- Brex Guide — `vault/Reference/Prompt Engineering/Brex Prompt Engineering Guide.md`
- [[Awesome AI System Prompts]] — `vault/Reference/Prompt Engineering/Awesome AI System Prompts.md`
- EliFuzz Prompts — `vault/Reference/Prompt Engineering/EliFuzz Awesome System Prompts.md`
- [[Prompt Library Sources]] — `vault/Reference/Prompt Engineering/Prompt Library Sources.md`
- [[12-Factor Agents]] — `vault/Reference/Prompt Engineering/12-Factor Agents.md`

### Web Research (Searched 2026-03-16)
- [Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)](https://arxiv.org/abs/2212.08073)
- [Anthropic Constitutional AI Research](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback)
- [Constitutional AI with Open LLMs — Hugging Face](https://huggingface.co/blog/constitutional_ai)
- [NVIDIA NeMo CAI Implementation Guide](https://docs.nvidia.com/nemo-framework/user-guide/24.09/modelalignment/cai.html)
- [C3AI: Crafting and Evaluating Constitutions (ACM 2025)](https://dl.acm.org/doi/10.1145/3696410.3714705)
- [Constitutional AI on Small LLMs (arXiv:2503.17365)](https://arxiv.org/html/2503.17365v1)
- [RAG-Based Dynamic Prompting for Biomedical NER (arXiv:2508.06504)](https://arxiv.org/abs/2508.06504)
- [Retrieval-Augmented Few-Shot Prompting vs Fine-Tuning (arXiv:2512.04106)](https://arxiv.org/abs/2512.04106)
- [Dynamic Few-Shot for Task-Oriented Dialogue (ScienceDirect 2025)](https://www.sciencedirect.com/science/article/abs/pii/S0306457325002584)
- [Intent Classification Techniques 2026 — Label Your Data](https://labelyourdata.com/articles/machine-learning/intent-classification)
- [Preprocessing Pipelines for LLMs — Latitude](https://latitude.so/blog/ultimate-guide-to-preprocessing-pipelines-for-llms)
- [Intent Recognition and Auto-Routing in Multi-Agent Systems](https://gist.github.com/mkbctrl/a35764e99fe0c8e8c00b2358f55cd7fa)
- [Hybrid LLM + Intent Classification Approach (Medium)](https://medium.com/data-science-collective/intent-driven-natural-language-interface-a-hybrid-llm-intent-classification-approach-e1d96ad6f35d)
- [LLM-Generated Intent Taxonomies (ACM 2025)](https://dl.acm.org/doi/10.1145/3732294)
- [Dynatrace: AI Model Versioning and A/B Testing](https://www.dynatrace.com/news/blog/the-rise-of-agentic-ai-part-6-introducing-ai-model-versioning-and-a-b-testing-for-smarter-llm-services/)
- [A/B Testing Prompts Guide — Maxim](https://www.getmaxim.ai/articles/how-to-perform-a-b-testing-with-prompts-a-comprehensive-guide-for-ai-teams/)
- [Top 5 Prompt Versioning Tools 2025 — Maxim](https://www.getmaxim.ai/articles/top-5-prompt-versioning-tools-in-2025-essential-infrastructure-for-production-ai-systems/)
- [Prompt Versioning & Management — LaunchDarkly](https://launchdarkly.com/blog/prompt-versioning-and-management/)
- [A/B Testing of LLM Prompts — Langfuse](https://langfuse.com/docs/prompt-management/features/a-b-testing)
- [Death of Prompt Engineering: AI Orchestration 2026](https://bigblue.academy/en/the-death-of-prompt-engineering-and-its-ruthless-resurrection-navigating-ai-orchestration-in-2026-and-beyond)
- [Prompt Injection Attacks on Agentic Coding (arXiv:2601.17548)](https://arxiv.org/pdf/2601.17548)
- [OWASP Top 10 for LLM Applications 2025](https://www.crowdstrike.com/en-us/cybersecurity-101/cyberattacks/prompt-injection/)
