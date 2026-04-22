# Workflow: Knowledge Growth

Discovering, documenting, and linking new tools, patterns, and knowledge in the vault.

---

## When Knowledge Growth Happens

Knowledge enters the vault through three channels:
1. **Discovery during work** — encounter a new tool, pattern, or technique while coding
2. **Deliberate research** — targeted investigation via [[Workflow - Research to Implementation]]
3. **Session capture** — insights surfaced from indexed session logs via QMD

## Trigger: New Tool or Pattern Discovered

### Quick Assessment (2 min)
Before creating a vault note, answer:
- [ ] Is this relevant to my stack? (Check [[My Stack Decisions]])
- [ ] Does a note already exist? (`qmd search "tool name"` or search vault)
- [ ] Will I realistically use or reference this again?

**If yes to all three** → create a vault note.
**If only curiosity** → log in session summary and move on. QMD will index it for later recall.

## Creating a Vault Note

### Step 1: Choose the right location

| Content Type | Location | MOC to Update |
|---|---|---|
| Tool or plugin | `AI Knowledge/[Category]/` | Category MOC |
| Architecture pattern | `AI Knowledge/Architecture Blueprints/` | [[Architecture Blueprints MOC]] |
| Claude Code plugin | `AI Knowledge/Claude Code Plugins/` | [[Claude Code Plugins MOC]] |
| Obsidian integration | `AI Knowledge/Obsidian Integration/` | [[Obsidian Integration MOC]] |
| Resource or directory | `AI Knowledge/Directories & Resources/` | [[Directories MOC]] |

### Step 2: Follow the vault note template

```markdown
# Tool Name

> One-line description of what it does and why it matters.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [link](url) |
| **Stars** | count (as of YYYY-MM) |
| **Status** | Active / New / Deprecated / Archived |
| **Category** | [e.g., State Management, Testing, CLI] |

## What It Does
[2-3 sentences: core value proposition]

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Install
```bash
npm install tool-name
# or
pip install tool-name
```

## Usage Example
```typescript
// Minimal working example
```

## Relevance to My Stack
[How this connects to existing tools and decisions]

## See Also
- [[Category MOC]]
- [[Related Tool]]
- [[My Stack Decisions]]

#category-tag
```

### Step 3: Integrate into the knowledge graph

- [ ] Add to the appropriate MOC file with a one-line description
- [ ] Cross-link with related tools (both directions: add link in the related note too)
- [ ] Tag consistently using existing vault tags
- [ ] If high-priority → add to [[AI Knowledge Hub]] Quick Reference table
- [ ] If chosen for the stack → add to [[My Stack Decisions]]

## Session-Based Discovery (Passive Growth)

Most knowledge enters the vault passively through session indexing:

```
Development session
    ↓ (SessionEnd hook)
sync-claude-sessions → clean markdown export
    ↓
QMD indexes (BM25 + vector embeddings)
    ↓
Future session → /recall or qmd vsearch surfaces past context
    ↓
If recurring/valuable → formalize into a proper vault note
```

### Promotion Rules
A session insight should be promoted to a vault note when:
- It comes up in 2+ separate sessions (recurring relevance)
- It documents a decision that affects future work
- It captures a pattern that should be followed consistently
- It describes a tool that was adopted into the stack

## Periodic Vault Maintenance

### Weekly (during `/weekly` review)
- [ ] Review any discoveries from session logs that should become vault notes
- [ ] Check for orphan notes (not linked to any MOC)

### Monthly (during `/monthly` review)
- [ ] Audit vault for outdated notes (deprecated tools, changed decisions)
- [ ] Archive notes for tools no longer relevant (move to `Archive/` or add `#archived` tag)
- [ ] Update star counts and status fields for actively referenced tools
- [ ] Review [[AI Knowledge Hub]] Quick Reference for accuracy

### Quality Gate: Avoiding Vault Bloat
Before creating a new note, verify:
- [ ] No existing note covers this (search first)
- [ ] The tool/pattern is relevant to current or planned projects
- [ ] You have enough information to fill at least Quick Info + What It Does
- [ ] It fits into an existing category (if not, is a new category warranted?)

If a note becomes stale (not referenced in 6+ months, tool deprecated), mark with `#archived` rather than deleting. QMD still indexes archived notes but they won't clutter active searches.

## Knowledge Growth Checklist

For each new discovery:
- [ ] Quick assessment: relevant + no existing note + will reference again
- [ ] Note created in correct `AI Knowledge/` subfolder
- [ ] Quick Info table filled out
- [ ] Added to appropriate MOC
- [ ] Cross-linked with related notes
- [ ] Tagged consistently
- [ ] [[My Stack Decisions]] updated (if tool was adopted)
- [ ] [[AI Knowledge Hub]] updated (if high-priority)

## See Also

- [[Workflows MOC]]
- [[AI Knowledge Hub]] — the vault's knowledge index
- [[My Stack Decisions]] — where adopted tools are tracked
- [[Workflow - Research to Implementation]] — deliberate research pipeline
- [[Workflow - Session Memory]] — how session capture feeds knowledge growth

#workflow #knowledge #growth
