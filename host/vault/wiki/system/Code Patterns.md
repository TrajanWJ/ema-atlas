---
type: knowledge
wiki_id: system/Code_Patterns
imported_from: vault/System/Code Patterns.md
imported_at: '2026-04-04T00:23:57.221Z'
tags: []
summary: ''
---
# Code Patterns

Auto-generated catalog of significant code blocks from Claude Code and OpenClaw sessions.
Last updated: 2026-03-25 20:57 UTC
Total patterns: 37 across 5 languages

> Use `code-search.sh "description"` to find specific patterns via semantic search.

## Contents

- [[#^python|Python]] (1 patterns)
- [[#^bash|Bash]] (11 patterns)
- [[#^typescript|Typescript]] (2 patterns)
- [[#^sql|Sql]] (1 patterns)
- [[#^json|Json]] (22 patterns)

---

## Python ^python

### Python Pattern 1

- **Date:** 2026-03-12
- **Project:** home trajan Desktop Proslync documentation
- **Lines:** 11
- **Session:** `0de22008-7ea6-4d9d-a8ca-2a8f86c94dc7.jsonl`
- **Context:** Vault insight applied: Your Wilson Premier platform uses the same human-in-the-loop approval gate pattern for its agents (zero auto-send,...

```python
# Athlete vector metadata
{
  "id": "athlete_uuid",
  "sport": "basketball",
  "school": "UVA",
  "state": "VA",
  "league": "ACC",
  "audience_size": 45000,
  "content_types": ["reels", "game_clips"],
  "compliance_cleared_states": ["VA", "NC", "MD"]
}
```

---

## Bash ^bash

### Bash Pattern 1

- **Date:** 2026-03-18
- **Project:** home trajan/openclaw agents coder workspace
- **Lines:** 11
- **Session:** `44968c0e-5b98-47df-b12c-f7f2bce04c1b.jsonl`
- **Context:** Logs to `~/.openclaw/logs/weekly-report.log` ## Usage Examples

```bash
# Generate a proposal
generate-doc.sh proposal title='Q2 Migration' client='Acme' project='CloudOps'

# Generate a report
generate-doc.sh report title='Monthly Security Review' author='Trajan'

# Generate a client brief
generate-doc.sh client-brief client='StartupXYZ' project='Brand Refresh'

# Run weekly report manually
generate-report.sh
```

### Bash Pattern 2

- **Date:** 2026-03-16
- **Project:** home trajan skills agent tester
- **Lines:** 14
- **Session:** `6f6cf7b0-f31f-4932-a5a1-b429268440b0.jsonl`
- **Context:** Look at the top few processes. This alone usually reveals the culprit. ## Deeper Investigation

```bash
# Snapshot of all processes sorted by CPU (non-interactive, good for scripts)
ps aux --sort=-%cpu | head -20

# See per-core usage (is one core pegged or all of them?)
mpstat -P ALL 1 5

# Track a specific process's threads
top -H -p <PID>

# See what system calls a suspect process is making
strace -p <PID> -c -t

# Check load average trend (1m, 5m, 15m) — is it getting worse?
uptime
```

### Bash Pattern 3

- **Date:** 2026-03-16
- **Project:** home trajan skills agent tester
- **Lines:** 19
- **Session:** `9f2a0556-1397-4f83-8372-e32f0e584e7e.jsonl`
- **Context:** Then open `package.json` and find the `<<<<<<<`, `=======`, `>>>>>>>` markers. Common conflicts: - Version bumps — both branches changed `"version"`...

```bash
# 1. Open the file and manually resolve conflicts
#    Remove all <<<<<<< / ======= / >>>>>>> markers
#    Keep the correct content

# 2. Validate JSON is valid after editing
node -e "require('./package.json')"

# 3. Regenerate the lockfile (critical!)
npm install        # for npm
# or
yarn install       # for yarn
# or
pnpm install       # for pnpm

# 4. Stage both files
git add package.json package-lock.json

# 5. Continue the merge
git merge --continue
```

### Bash Pattern 4

- **Date:** 2026-03-16
- **Project:** home trajan skills agent tester
- **Lines:** 18
- **Session:** `a86c3208-cb1f-405f-93c5-91d0759b3087.jsonl`
- **Context:** ### 2. Resolution Strategy For version bumps (most common conflict): - Pick the higher version, or bump again if both sides incremented. For...

```bash
# 1. Open the file and resolve conflict markers manually
#    (remove <<<<<<, ======, >>>>>> lines, keep correct content)

# 2. Validate the JSON is valid
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"

# 3. Regenerate the lockfile (CRITICAL — don't skip this)
npm install          # for npm
# or
yarn install         # for yarn
# or
pnpm install         # for pnpm

# 4. Stage both files
git add package.json package-lock.json   # (or yarn.lock / pnpm-lock.yaml)

# 5. Continue the merge
git merge --continue
```

### Bash Pattern 5

- **Date:** 2026-03-16
- **Project:** home trajan skills agent tester
- **Lines:** 11
- **Session:** `d4040861-a9b3-440d-9681-5ec3aeee3e49.jsonl`
- **Context:** Look for: - A single process at 90%+ → runaway process or infinite loop - Many processes each at 5-15% → overloaded service (e.g., too many PHP-FPM...

```bash
# What files does PID 12345 have open?
ls -l /proc/12345/fd

# What's it actually doing? (strace for syscalls)
strace -p 12345 -c    # summary of syscall time

# Thread-level CPU breakdown
top -H -p 12345

# Full command line that started it
cat /proc/12345/cmdline | tr '\0' ' '
```

### Bash Pattern 6

- **Date:** 2026-03-12
- **Project:** home trajan
- **Lines:** 27
- **Session:** `1f8f73af-99d5-4209-9941-537b9b34167d.jsonl`
- **Context:** ### [Paperclip](https://github.com/paperclipai/paperclip) — 4,300 stars Multi-agent orchestration. Atomic task checkout (no double-work), per-agent...

```bash
# 1. Command Center
git clone https://github.com/builderz-labs/mission-control.git
cd mission-control && bash install.sh --docker

# 2. Analytics (one command)
npx agentlytics

# 3. Persistent memory
# In Claude Code: /plugin marketplace add thedotmack/claude-mem

# 4. Skills supercharger
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code && ./install.sh typescript

# 5. n8n automation
docker run -d --name n8n --restart unless-stopped \
  -p 5678:5678 -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n

# 6. Task Master MCP
# ... (7 more lines)
```

### Bash Pattern 7

- **Date:** 2026-03-12
- **Project:** home trajan
- **Lines:** 24
- **Session:** `1f8f73af-99d5-4209-9941-537b9b34167d.jsonl`
- **Context:** Now I have the full picture. Here's my recommendation: --- ## Your Current State - Plugins: Superpowers v5.0.1, Context7, Frontend Design, Frontend...

```bash
# 1. Obsidian CLI (built-in, free, 54x faster search)
# Obsidian → Settings → General → Command line interface → Register CLI → ON
sudo ln -s /opt/obsidian/obsidian /usr/local/bin/obsidian

# 2. kepano/obsidian-skills (format awareness)
cd ~/Documents/obsidian_first_stuff/twj1
mkdir -p .claude/skills
# In Claude Code:
# /plugin marketplace add kepano/obsidian-skills
# /plugin install obsidian@obsidian-skills

# 3. Claudian (Claude Code inside Obsidian sidebar)
# Obsidian → BRAT → Add: YishenTu/claudian

# 4. obsidian-claude-code-mcp (vault exposed to Claude CLI)
# Obsidian → Community Plugins → Browse → "Claude Code" → Install

# 5. claude-mem (persistent memory)
# In Claude Code: /plugin install claude-mem

# ... (4 more lines)
```

### Bash Pattern 8

- **Date:** 2026-03-12
- **Project:** home trajan
- **Lines:** 19
- **Session:** `1f8f73af-99d5-4209-9941-537b9b34167d.jsonl`
- **Context:** What this gives you: Claude Code can read/write your vault, remembers past sessions, has semantic search over everything, and you can chat with...

```bash
# 1. obsidian-claude-pkm (goal cascading starter kit)
git clone https://github.com/ballred/obsidian-claude-pkm.git
cd obsidian-claude-pkm
chmod +x scripts/setup.sh && ./scripts/setup.sh
# Then in Claude Code: /adopt (adapts to your existing vault)

# 2. Claude Task Master (PRD → tasks via MCP)
claude mcp add taskmaster-ai -- npx -y task-master-ai

# 3. sync-claude-sessions (export sessions to searchable markdown)
# In Claude Code:
# /plugin marketplace add ArtemXTech/personal-os-skills

# 4. Mission Control (the command center dashboard)
git clone https://github.com/MeisnerDan/mission-control.git
cd mission-control/mission-control
pnpm install && pnpm dev
# Background daemon for autonomous task dispatch:
pnpm daemon:start
```

### Bash Pattern 9

- **Date:** 2026-03-12
- **Project:** home trajan
- **Lines:** 26
- **Session:** `1f8f73af-99d5-4209-9941-537b9b34167d.jsonl`
- **Context:** What this gives you: Your day has structure — `/daily` plans morning, `/weekly` reviews progress, `/monthly` checks against your 3-year vision. Task...

```bash
# 1. n8n (workflow automation)
docker run -d --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e N8N_SECURE_COOKIE=false \
  docker.n8n.io/n8nio/n8n

# 2. n8n-MCP (Claude builds n8n workflows conversationally)
claude mcp add n8n-mcp -- npx n8n-mcp

# Set env in MCP config:
# N8N_API_URL=http://localhost:5678
# N8N_API_KEY=<generate in n8n Settings → API>

# 3. SSH for n8n → Claude Code triggers
sudo apt install openssh-server
sudo systemctl enable --now ssh

# 4. Agentlytics (cross-editor analytics)
# ... (6 more lines)
```

### Bash Pattern 10

- **Date:** 2026-03-10
- **Project:** home trajan
- **Lines:** 14
- **Session:** `dfeaec9a-d6b4-4a8e-b835-6c5c5988dd23.jsonl`
- **Context:** Networks are back! The driver reload fixed it. It looks like it even auto-connected to your "home" network on channel 153. ## What happened The...

```bash
sudo tee /etc/systemd/system/wifi-reload.service << 'EOF'
[Unit]
Description=Reload mt7921e after resume
After=suspend.target hibernate.target hybrid-sleep.target

[Service]
Type=oneshot
ExecStart=/sbin/modprobe -r mt7921e
ExecStart=/bin/sleep 2
ExecStart=/sbin/modprobe mt7921e

[Install]
WantedBy=suspend.target hibernate.target hybrid-sleep.target
EOF
```

### Bash Pattern 11

- **Date:** 2026-02-15
- **Project:** home trajan
- **Lines:** 12
- **Session:** `1af45a55-4bfa-4139-a7ab-299d91aa3e1d.jsonl`
- **Context:** ### 🚀 Start Developing

```bash
# Truks
cd ~/Desktop/Coding/Projects/Truks
pnpm dev
 
# xpressdrop Frontend
cd ~/Desktop/Coding/Projects/xpressdrop/frontend
npm run dev
 
# xpressdrop Backend
cd ~/Desktop/Coding/Projects/xpressdrop/backend
source venv/bin/activate
python app.py
```

---

## Typescript ^typescript

### Typescript Pattern 1

- **Date:** 2026-02-16
- **Project:** home trajan
- **Lines:** 12
- **Session:** `d16c83e4-2579-494a-a9f3-3ffe2be41f83.jsonl`
- **Context:** #### 2. Conditional Hydration (`lib/store.ts`)

```typescript
loginFromSignup: async (user, passcode) => {
  // Create mock token if no API
  if (!hasApiConfig()) {
    const devToken = createDevToken(user)
    setToken(devToken)
  }
  
  // Skip hydration if no API
  if (hasApiConfig() && getToken()) {
    await get().hydrate()
  }
}
```

### Typescript Pattern 2

- **Date:** 2026-02-16
- **Project:** home trajan
- **Lines:** 12
- **Session:** `df90d7e2-93c3-4547-9157-0116f66630a2.jsonl`
- **Context:** #### 2. Conditional Hydration (`lib/store.ts`)

```typescript
loginFromSignup: async (user, passcode) => {
  // Create mock token if no API
  if (!hasApiConfig()) {
    const devToken = createDevToken(user)
    setToken(devToken)
  }
  
  // Skip hydration if no API
  if (hasApiConfig() && getToken()) {
    await get().hydrate()
  }
}
```

---

## Sql ^sql

### Sql Pattern 1

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 114
- **Session:** `d4907e4d-6b4c-4e35-b9ed-880e63e99a1e.jsonl`
- **Context:** ## Section 2: Data Model dispatch.db schema — replaces all JSON files, TASKS.md, feed.jsonl, agent-health.json, active-tasks.json, agent-status.json,...

```sql
-- Core entities
tasks (
  id TEXT PRIMARY KEY,          -- task-xxxx or gw-xxxx
  title TEXT NOT NULL,
  description TEXT,
  agent TEXT,
  status TEXT CHECK(status IN ('queued','active','done','failed','partial','blocked')),
  priority INTEGER DEFAULT 3,   -- 0=critical, 1=high, 2=normal, 3=low, 4=background
  source TEXT,                   -- 'manual', 'proposal:prop-xxx', 'chain:task-xxx', 'tui', 'cron'
  mission_id TEXT REFERENCES missions(id),
  pipeline_id TEXT REFERENCES pipelines(id),
  depends_on TEXT,              -- JSON array of task IDs
  created_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  timeout_min INTEGER DEFAULT 30,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 2,
  pid INTEGER,
  result_file TEXT,
# ... (94 more lines)
```

---

## Json ^json

### Json Pattern 1

- **Date:** 2026-03-25
- **Project:** home trajan
- **Lines:** 86
- **Session:** `9997764f-867e-4428-b965-f77613d9cbb3.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "claude-code v2.1.83: CwdChanged/FileChanged hooks enable filesystem-aware agent reactions without polling",
    "category": "technique",
    "source": "2d043f24.txt",
    "relevance": 5,
    "effort": "medium",
    "impact": 4,
    "novelty": 5,
    "recommended_action": "dispatch",
    "apply_details": "Add CwdChanged/FileChanged hook handlers in OpenClaw/ClaudeForge agent configs to trigger vault sync or dispatch events on file changes instead of polling loops",
    "affected_project": "OpenClaw Agent Setup"
  },
  {
    "description": "claude-code v2.1.83: initialPrompt frontmatter in agent definition files — set a startup prompt without external scripting",
    "category": "config-change",
    "source": "2d043f24.txt",
    "relevance": 5,
    "effort": "small",
    "impact": 3,
# ... (66 more lines)
```

### Json Pattern 2

- **Date:** 2026-03-24
- **Project:** home trajan
- **Lines:** 98
- **Session:** `522807e4-854f-41ad-b9d1-d011ab319726.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "NEVER→ALWAYS→PREFER→WHEN prompt instruction ordering protocol in PromptCompiler — resolves conflicts deterministically by applying constraint layers in fixed precedence order",
    "category": "design-pattern",
    "source": "peer-pr-20260324-210438-556357.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 4,
    "novelty": 5,
    "recommended_action": "auto-apply",
    "apply_details": "Document this ordering convention in SOUL.md or the prompt-building section of dispatch-engine.sh; apply to all multi-constraint prompt assembly points in Auto Delegator Layer",
    "affected_project": "Auto Delegator Layer"
  },
  {
    "description": "Discord accentColor must be integer (0x57A773 = 5744499), not a hex string — components v2 silently rejects string format causing invisible styling failures",
    "category": "config-change",
    "source": "peer-pr-20260324-210438-556357.txt",
    "relevance": 3,
    "effort": "small",
    "impact": 3,
# ... (78 more lines)
```

### Json Pattern 3

- **Date:** 2026-03-24
- **Project:** home trajan
- **Lines:** 38
- **Session:** `ccdb46cb-5916-4fe2-9620-63cf2c1539d2.jsonl`
- **Context:** (no context)

```json
{
  "enriched_description": "Build a Python script that polls dispatch.db (SQLite, the OpenClaw dispatch queue) on a schedule, computes daily effectiveness metrics (task throughput, completion rate, error rate, agent utilization, queue depth over time), and writes a dated Markdown report to ~/vault/Reports/dispatch/ with proper frontmatter. The script should be idempotent (safe to re-run for same day), log to stderr, and expose a --date flag for backfill. Wire it into cron or systemd timer for nightly execution.",
  "agent": "coder",
  "subtasks": [
    "Inspect dispatch.db schema: list tables, columns, and sample rows to understand queue structure (status, agent, timestamps, task_type fields)",
    "Define the metrics spec: tasks_submitted, tasks_completed, tasks_failed, tasks_pending, avg_completion_time_s, p95_completion_time_s, per-agent breakdown, busiest hour histogram",
    "Write dispatch_monitor.py with argparse (--date YYYY-MM-DD, --db PATH, --output-dir PATH, --dry-run), SQLite queries, and Markdown renderer",
    "Add Obsidian-compatible frontmatter (title, type: report, created, tags: [dispatch, effectiveness, agent-ops])",
    "Write at least one wikilink per report (e.g. [[OpenClaw Agent System]]) per vault-ops rules",
    "Add post-write hook: run `flock -n /tmp/qmd.lock qmd update && flock -n /tmp/qmd.lock qmd embed` after each report write",
    "Write a cron snippet (or systemd .timer unit) for nightly 00:05 execution",
    "Smoke-test against real dispatch.db: verify report file exists, frontmatter is valid YAML, metrics are non-zero"
  ],
  "context_notes": "dispatch.db is the single source of truth per the Agent OS foundation redesign (see project_agent_os_foundation_repair.md). Vault writes must follow vault-ops.md: frontmatter required, qmd update+embed must run after every write, check for existing notes before creating. Use `trash` not `rm`. Reports output dir: ~/vault/Reports/dispatch/YYYY-MM-DD-dispatch-report.md. Script lives at ~/bin/dispatch_monitor.py or alongside the dispatch engine.",
  "success_criteria": "Script runs `python dispatch_monitor.py --date 2026-03-24` and produces a valid Markdown file in ~/vault/Reports/dispatch/ with correct frontmatter, at least 8 metrics populated, per-agent rows present, qmd embed completes without error, and script exits 0. Re-running for same date overwrites cleanly without duplicates.",
  "vault_refs": [
    "vault/Reports/dispatch/",
    "memory/project_agent_os_foundation_repair.md",
    "memory/project_claude_code_instance.md"
  ],
# ... (18 more lines)
```

### Json Pattern 4

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 50
- **Session:** `38455b5b-f6ba-486f-b689-c85bf26cc9a5.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Queue API enrichment: active tasks surface first, with dependency resolution (_dep_status, _blocked) and delegation chain (_chain) linking to parent pipeline and goal",
    "category": "design-pattern",
    "source": "task-f4103744.txt",
    "relevance": 4,
    "effort": "medium",
    "impact": 4,
    "novelty": 5,
    "recommended_action": "dispatch",
    "apply_details": "Surface _blocked and _dep_status fields in the Agent-OS-Frontend queue view to visually indicate blocked tasks and their unmet dependencies",
    "affected_project": "Agent-OS-Frontend"
  },
  {
    "description": "Proposal scope estimation: derive small/medium/large effort from body word count + option count, normalize approval_status alongside status field",
    "category": "technique",
    "source": "task-f4103744.txt",
    "relevance": 3,
    "effort": "small",
    "impact": 3,
# ... (30 more lines)
```

### Json Pattern 5

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 62
- **Session:** `55922b27-05d8-44f8-ac9a-99e425b7e880.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Monkey-patching existing functions to inject UI elements without modifying original function signatures — used to add a detail button to stream items by wrapping `makeStreamItem`",
    "category": "technique",
    "source": "task-1467181f.txt",
    "relevance": 3,
    "effort": "small",
    "impact": 3,
    "novelty": 3,
    "recommended_action": "auto-apply",
    "apply_details": "In any frontend where you can't modify the original function, wrap it: `const orig = makeStreamItem; makeStreamItem = (...args) => { const el = orig(...args); el.querySelector('.actions').append(btn); return el; }`",
    "affected_project": "Agent-OS-Frontend"
  },
  {
    "description": "Bridge-or-mock fallback pattern: component tries `/api/feed/:id` first, falls back to rich local mock data when bridge isn't live — enables development without live backend",
    "category": "design-pattern",
    "source": "task-1467181f.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 4,
# ... (42 more lines)
```

### Json Pattern 6

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 62
- **Session:** `57c2dfca-f946-4f3c-9e6b-7b4ec30b5cb1.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Priority-tiered auto-dispatch routing: P3/P4 non-destructive proposals auto-dispatch to queue; P1/P2 or destructive/config-change proposals route to human review queue instead",
    "category": "design-pattern",
    "source": "task-11b91882.txt",
    "relevance": 5,
    "effort": "small",
    "impact": 4,
    "novelty": 4,
    "recommended_action": "auto-apply",
    "apply_details": "Add priority+pattern safety check to dispatch router in Auto Delegator Layer: if priority <= P2 or pattern matches destructive/config keywords, route to human-review queue file instead of dispatch queue",
    "affected_project": "Auto Delegator Layer"
  },
  {
    "description": "Proposal lifecycle state machine in proposal-state.json: tracks each proposal through proposed→dispatched→completed with success/fail outcomes for feedback loop",
    "category": "design-pattern",
    "source": "task-11b91882.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 3,
# ... (42 more lines)
```

### Json Pattern 7

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 62
- **Session:** `5d35095f-ec7f-4067-b074-837a6499b19b.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Vault has 903 broken wikilink instances across 334 files (42% of vault) — [[agent roster]] is the most referenced missing file with 40 references",
    "category": "best-practice",
    "source": "task-383ad218.txt",
    "relevance": 3,
    "effort": "large",
    "impact": 3,
    "novelty": 4,
    "recommended_action": "propose",
    "apply_details": "Create missing high-reference target files: [[agent roster]], [[Agent Knowledge]], [[memory architecture]], [[Self-learning]], [[usage patterns]]. Start with agent roster as it has 40 references and relates to active projects.",
    "affected_project": "ClaudeForge"
  },
  {
    "description": "91 vault files missing frontmatter — 48 concentrated in System/ folder, 17 in Trajan/message-harvests/ because the harvest generator never emits frontmatter",
    "category": "best-practice",
    "source": "task-383ad218.txt",
    "relevance": 2,
    "effort": "medium",
    "impact": 3,
# ... (42 more lines)
```

### Json Pattern 8

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 86
- **Session:** `5eefa66f-9b51-42c4-b942-f6698de42e09.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Proposal engine v2 spec with 6 idea source engines: Audit Gap Analysis, Goal Alignment, Pattern Recognition, Codebase Analysis, Self-Improvement, and Vault Integration",
    "category": "design-pattern",
    "source": "task-35de59aa.txt",
    "relevance": 4,
    "effort": "large",
    "impact": 5,
    "novelty": 5,
    "recommended_action": "propose",
    "apply_details": "Implement per the 4-phase plan in /home/trajan/dispatch/specs/proposal-engine-v2-spec.md. Start with Phase 1 scaffolding: extended proposal schema and gap-registry.json state file.",
    "affected_project": "Auto Delegator Layer"
  },
  {
    "description": "Extended proposal JSON schema with backwards-compatible fields: scope, source.engine, tasks[], success_criteria[], and impact",
    "category": "design-pattern",
    "source": "task-35de59aa.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 3,
# ... (66 more lines)
```

### Json Pattern 9

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 38
- **Session:** `65303715-80f6-4906-9689-cb0bb53f5e48.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Pipeline smoke test pattern: verify all layers (Dispatch, DB, API, WebSocket, UI) in a single structured table with CRUD roundtrip confirmation — standardized health verification for multi-layer agent OS",
    "category": "best-practice",
    "source": "task-a56abb87.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 3,
    "novelty": 3,
    "recommended_action": "auto-apply",
    "apply_details": "Add a smoke-test script or checklist to ClaudeForge/Agent-OS that runs each layer check in sequence and outputs a status table; store as a cron or on-demand health check",
    "affected_project": "ClaudeForge"
  },
  {
    "description": "ClaudeForge tasks table is empty while dispatch.db has 30 entries — two separate task stores are not synchronized, creating a split-brain condition",
    "category": "integration-opportunity",
    "source": "task-a56abb87.txt",
    "relevance": 5,
    "effort": "medium",
    "impact": 4,
# ... (18 more lines)
```

### Json Pattern 10

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 50
- **Session:** `66abb2a4-908c-4f6c-87d7-b3fc5df7abd5.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Agent health metrics computation from done tasks: success rate and avg duration derived from dispatch/done/ task files with outcome-tracker fallback",
    "category": "technique",
    "source": "task-a146cfa7.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 3,
    "novelty": 4,
    "recommended_action": "auto-apply",
    "apply_details": "Extract computeHealthMetrics() pattern from server.js and apply to proposal/pipeline health scoring in proposal-engine-v2.sh or frontend dashboards",
    "affected_project": "Agent-OS-Frontend"
  },
  {
    "description": "writeAgentStatusFile() side-effect pattern: list/detail endpoints populate a shared agent-status.json on every call, keeping shared state fresh without a separate cron",
    "category": "design-pattern",
    "source": "task-a146cfa7.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 3,
# ... (30 more lines)
```

### Json Pattern 11

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 50
- **Session:** `7319624d-ba69-4776-b242-571abdab26fa.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "12 orphaned task_log rows reference pipeline-research-* and proposal-prop-* task IDs that were never inserted into tasks table or were deleted — silent referential integrity gap in dispatch.db",
    "category": "best-practice",
    "source": "task-4a044071.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 3,
    "novelty": 4,
    "recommended_action": "auto-apply",
    "apply_details": "Run cleanup SQL from /tmp/dispatch-db-audit.md against dispatch/dispatch.db: DELETE FROM task_log WHERE task_id NOT IN (SELECT id FROM tasks)",
    "affected_project": "Auto Delegator Layer"
  },
  {
    "description": "2 orphaned agent_health rows for 'main' and 'utility' agent names with no matching agents table entry — likely renamed/removed agents leaving stale health data",
    "category": "best-practice",
    "source": "task-4a044071.txt",
    "relevance": 3,
    "effort": "small",
    "impact": 2,
# ... (30 more lines)
```

### Json Pattern 12

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 86
- **Session:** `766b5458-055a-4def-80fd-7f95a1111d8f.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Two-column 30/70 agent monitoring layout: narrow left column for lists (agents/queue/proposals), wide right column for selected-item detail with empty state until selection",
    "category": "design-pattern",
    "source": "task-75abbaaf.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 3,
    "novelty": 4,
    "recommended_action": "auto-apply",
    "apply_details": "Apply to Agent-OS-Frontend index.html as the canonical workbench layout — left col 30% with three stacked list sections, right col 70% with empty-state placeholder until row selection fires",
    "affected_project": "Agent-OS-Frontend"
  },
  {
    "description": "Differentiated polling intervals: fast data (agent status) polls every 5s, slow data (queue, proposals) polls every 10s — reduces bridge load while keeping critical state fresh",
    "category": "best-practice",
    "source": "task-75abbaaf.txt",
    "relevance": 3,
    "effort": "small",
    "impact": 3,
# ... (66 more lines)
```

### Json Pattern 13

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 38
- **Session:** `902fc53b-bb26-4e9b-ade1-738955a082a9.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Consolidate duplicate Startup Reads + Session-End sections in SOUL.md — two identical sections cause agents to silently skip one",
    "category": "best-practice",
    "source": "task-c8542e6a.txt",
    "relevance": 3,
    "effort": "small",
    "impact": 3,
    "novelty": 4,
    "recommended_action": "auto-apply",
    "apply_details": "Edit SOUL.md to remove duplicate Startup Reads (lines 135–138) and Session-End sections, keeping one canonical version of each",
    "affected_project": "Auto Delegator Layer"
  },
  {
    "description": "Add explicit Failed Task Protocol to SOUL.md — a promoted Auto-Learned stub (recurrence: 3) was never given a concrete recovery format or output template",
    "category": "best-practice",
    "source": "task-c8542e6a.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 4,
# ... (18 more lines)
```

### Json Pattern 14

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 62
- **Session:** `917591b4-5763-4249-b958-58035aa1c9ba.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Offset-based pagination with envelope response ({total, offset, limit, events}) for feed API — standard REST pagination pattern replacing cursor-only approach",
    "category": "best-practice",
    "source": "task-19d2d0c9.txt",
    "relevance": 3,
    "effort": "small",
    "impact": 3,
    "novelty": 2,
    "recommended_action": "auto-apply",
    "apply_details": "Apply same pagination envelope pattern to any other list endpoints in agent-os-bridge (tasks, pipelines, goals) for consistency",
    "affected_project": "Agent-OS-Frontend"
  },
  {
    "description": "Context enrichment layer: buildTaskIndex/buildPipelineIndex/buildGoalIndex helpers compose a delegation chain (_chain: {task, pipeline, goal}) attached opt-in to feed events via ?enrich=true",
    "category": "design-pattern",
    "source": "task-19d2d0c9.txt",
    "relevance": 5,
    "effort": "small",
    "impact": 4,
# ... (42 more lines)
```

### Json Pattern 15

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 38
- **Session:** `9fae5f1a-c134-4a56-8009-52597088823e.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Routing correction pattern: dispatch is overused for trivial tasks — apply a complexity gate before spawning agents (most recent active pattern in corrections.md)",
    "category": "best-practice",
    "source": "task-e66d5b3f.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 4,
    "novelty": 4,
    "recommended_action": "auto-apply",
    "apply_details": "Add a complexity gate check in dispatch.sh or proposal-engine-v2.sh: only dispatch when task has >1 step, requires external tools, or estimated duration >5min. Log skipped dispatches as direct-execute.",
    "affected_project": "Auto Delegator Layer"
  },
  {
    "description": "Tone correction pattern: hedging language and filler openers recur — enforce direct, honest responses even when pushing back on user assumptions",
    "category": "best-practice",
    "source": "task-e66d5b3f.txt",
    "relevance": 3,
    "effort": "small",
    "impact": 3,
# ... (18 more lines)
```

### Json Pattern 16

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 98
- **Session:** `acc19b35-f769-4fb1-b78c-cff7b56267f2.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Inbox integration pattern: poll /api/inbox/messages every 20s, inject as typed stream events ('inbox'), merge disk files + in-memory store in server",
    "category": "design-pattern",
    "source": "task-07cf58b8.txt",
    "relevance": 4,
    "effort": "medium",
    "impact": 4,
    "novelty": 4,
    "recommended_action": "dispatch",
    "apply_details": "Replicate pollInboxFeed() pattern in Agent-OS-Frontend: add typed 'inbox' events to stream, implement disk+memory merge at /api/inbox endpoint in local-server.js",
    "affected_project": "Agent-OS-Frontend"
  },
  {
    "description": "Shared state JSON files (active-tasks.json, agent-status.json) generated by dispatch engine via Python at end of every cycle, served via REST endpoints",
    "category": "design-pattern",
    "source": "task-07cf58b8.txt",
    "relevance": 5,
    "effort": "small",
    "impact": 4,
# ... (78 more lines)
```

### Json Pattern 17

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 98
- **Session:** `c72a64aa-f2a3-4f33-9d32-38b52837a887.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "Agent fitness scoring: Prompt Engineer (1.00), Ops (0.92), Vault Keeper (0.54, ≤50 files), Researcher (0.46, needs 8min+ timeout) — measurable reliability scores per agent type",
    "category": "best-practice",
    "source": "proposal-prop-1774031326-1698a6fd.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 4,
    "novelty": 4,
    "recommended_action": "auto-apply",
    "apply_details": "Add agent fitness scores and known constraints (file limits, timeouts) to AGENTS.md or agent config files; use scores to route tasks to appropriate agents",
    "affected_project": "Auto Delegator Layer"
  },
  {
    "description": "CONTINUE.md is non-negotiable: two incidents of 9+ hours lost work when not written — mandatory session continuity artifact",
    "category": "best-practice",
    "source": "proposal-prop-1774031326-1698a6fd.txt",
    "relevance": 5,
    "effort": "small",
    "impact": 5,
# ... (78 more lines)
```

### Json Pattern 18

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 14
- **Session:** `d4907e4d-6b4c-4e35-b9ed-880e63e99a1e.jsonl`
- **Context:** Every GET that returns a task includes its full context chain:

```json
{
  "id": "task-abc123",
  "title": "Implement /api/feed endpoint",
  "agent": "coder",
  "status": "done",
  "mission": { "id": "mission-1", "title": "Agent OS v1.0", "progress": 0.45 },
  "pipeline": { "id": "pl-1", "stage": 3, "stages": ["assess","research","implement","verify"] },
  "feed_events": [...],
  "vault_links": [{"path": "Research/bridge-api.md", "type": "produced"}],
  "handoffs": [...],
  "depends_on": ["task-xyz"],
  "blocked_by": [],
  "unblocks": ["task-def456"]
}
```

### Json Pattern 19

- **Date:** 2026-03-20
- **Project:** home trajan
- **Lines:** 50
- **Session:** `fac79543-f5ff-45ab-8430-c046693db662.jsonl`
- **Context:** (no context)

```json
[
  {
    "description": "MCP emerging as de facto tool integration standard across all major agent frameworks in 2026 — not just a Claude-specific feature but an industry convergence point",
    "category": "best-practice",
    "source": "task-8873e86e.txt",
    "relevance": 4,
    "effort": "small",
    "impact": 3,
    "novelty": 3,
    "recommended_action": "log-only",
    "apply_details": "Log as strategic validation: Agent-OS MCP server investments are aligned with industry direction. No immediate code change needed, but reinforces prioritizing MCP-native tool registration over bespoke APIs.",
    "affected_project": "Auto Delegator Layer"
  },
  {
    "description": "Graph-based orchestration is the 2026 convergence point for all major frameworks — explicit DAG task graphs replacing 'free-chat' autonomy loops. Current dispatch.db uses flat task queue without dependency graph edges.",
    "category": "design-pattern",
    "source": "task-8873e86e.txt",
    "relevance": 4,
    "effort": "large",
    "impact": 4,
# ... (30 more lines)
```

### Json Pattern 20

- **Date:** 2026-03-19
- **Project:** openclaw-main-agent
- **Lines:** 14
- **Session:** `5efe23b8-555a-446b-97ee-65282dd1843d.jsonl`
- **Context:** One task file, one schema:

```json
{
  "id": "task-a1b2c3",
  "created_at": "2026-03-19T21:00:00Z",
  "source": "trajan|auto|feedback",
  "priority": 1,
  "agent": "coder",
  "description": "Build feature X",
  "success_criteria": "Test passes, file exists at Y",
  "timeout_min": 15,
  "depends_on": [],
  "context": { "vault_refs": [], "files": [] },
  "attempts": 0,
  "max_attempts": 2
}
```

### Json Pattern 21

- **Date:** 2026-03-19
- **Project:** openclaw-main-agent
- **Lines:** 11
- **Session:** `de099a4f-0f64-499e-88a4-24f2159e9da5.jsonl`
- **Context:** Event schema:

```json
{
  "id": "evt_xxx",
  "type": "task_complete|queue_answered|agent_status|vault_write|cron_fire|error|metric",
  "source": "dispatch|queue|cron|vault|discord|agent",
  "agent": "researcher|coder|ops|...",
  "channel": "agent-feed|dispatch|...",
  "summary": "Researcher completed competitive analysis",
  "detail": { ... },
  "severity": "info|warn|error",
  "timestamp": "ISO"
}
```

### Json Pattern 22

- **Date:** 2026-03-19
- **Project:** openclaw-main-agent
- **Lines:** 11
- **Session:** `de099a4f-0f64-499e-88a4-24f2159e9da5.jsonl`
- **Context:** Auto-rule schema:

```json
{
  "id": "rule_xxx",
  "pattern": "agent:researcher AND type:approval AND contains:competitive",
  "action": "approve",
  "confidence": 0.85,
  "source_decisions": ["q_123", "q_456", "q_789"],
  "created": "ISO",
  "last_applied": "ISO",
  "apply_count": 7,
  "override_count": 0
}
```
