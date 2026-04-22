---
title: Independent AI System Design
created: '2026-03-19'
updated: '2026-03-19'
type: knowledge
status: active
tags:
  - architecture
  - mac-mini
  - migration
  - autonomy
  - independence
summary: >-
  Complete migration + system design plan for turning Trajan's AI agent system
  into a fully independent, self-sustaining brain on a Mac mini.
wiki_id: system/architecture/Independent_AI_System_Design
imported_from: vault/Architecture/Independent AI System Design.md
imported_at: '2026-04-04T00:23:56.752Z'
---

# Independent AI System Design
**Goal:** Turn Trajan's AI agent system into a fully independent, self-sustaining machine — migrating from KVM Ubuntu VM to Mac mini, running autonomously 24/7 without babysitting.

---

## 1. Mac mini Migration Checklist

Run in order. Should complete in an afternoon.

### Phase A — Prep (Before Touching Mac mini)

**On the current Ubuntu VM:**

```bash
# 1. Export full crontab
crontab -l > ~/vault/System/cron-backup.txt

# 2. Snapshot OpenClaw config
cp -r ~/.openclaw/config* ~/vault/System/openclaw-config-backup/
cp ~/.openclaw/*.json ~/vault/System/openclaw-config-backup/ 2>/dev/null

# 3. Commit vault to git
cd ~/vault && git add -A && git commit -m "pre-migration snapshot $(date +%Y%m%d)"

# 4. List all env vars used by agents
grep -r "ANTHROPIC\|DISCORD\|OPENAI\|GITHUB\|API_KEY" ~/bin/ ~/.openclaw/ --include="*.sh" --include="*.json" -h | grep -oP '(?<=export )\w+' | sort -u > ~/vault/System/required-env-vars.txt

# 5. Archive ~/bin
tar czf ~/vault/System/bin-scripts-backup.tar.gz ~/bin/

# 6. Note Discord bot token locations
grep -r "DISCORD_TOKEN\|BOT_TOKEN" ~/bin/ ~/.openclaw/ --include="*.sh" --include="*.env" -l
```

### Phase B — Mac mini Base Setup

```bash
# 1. Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install core tools
brew install git node python3 jq curl wget flock coreutils

# 3. Install GitHub CLI
brew install gh

# 4. Install OpenClaw
# Follow openclaw.io install instructions for macOS
# Likely: npm install -g openclaw OR brew install openclaw

# 5. Set up a dedicated user (optional but cleaner)
# Create user 'trajan' or use your main macOS account

# 6. Configure shell (zsh on macOS)
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc  # Apple Silicon
source ~/.zshrc
```

### Phase C — Data Transfer

```bash
# Option 1: rsync from VM (if on same network)
rsync -avz --progress trajan@<vm-ip>:~/vault/ ~/vault/
rsync -avz --progress trajan@<vm-ip>:~/bin/ ~/bin/
rsync -avz --progress trajan@<vm-ip>:~/.openclaw/ ~/.openclaw/
rsync -avz --progress trajan@<vm-ip>:~/dispatch/ ~/dispatch/
rsync -avz --progress trajan@<vm-ip>:~/scripts/ ~/scripts/ 2>/dev/null
rsync -avz --progress trajan@<vm-ip>:~/skills/ ~/skills/ 2>/dev/null

# Option 2: Git vault (already versioned)
git clone <vault-remote> ~/vault

# Make scripts executable
chmod +x ~/bin/*.sh
```

### Phase D — Environment Variables

```bash
# Create a single env file (NOT committed to git)
cat > ~/.openclaw/.env << 'EOF'
ANTHROPIC_API_KEY=sk-...
DISCORD_BOT_TOKEN=...
DISCORD_APP_ID=...
GITHUB_TOKEN=...
# Add others from ~/vault/System/required-env-vars.txt
EOF
chmod 600 ~/.openclaw/.env

# Source in .zshrc
echo 'source ~/.openclaw/.env' >> ~/.zshrc
source ~/.zshrc
```

### Phase E — OpenClaw Reconfiguration

```bash
# 1. Start OpenClaw gateway
openclaw gateway start

# 2. Verify agents load
openclaw agents list

# 3. Check agent configs still point to correct paths
# On Mac: /home/trajan → /Users/trajan (or your username)
# Find/replace all hardcoded paths:
grep -r "/home/trajan" ~/.openclaw/ --include="*.json" --include="*.yaml" -l
# Then fix them:
find ~/.openclaw/ -name "*.json" -o -name "*.yaml" | xargs sed -i '' 's|/home/trajan|/Users/YOUR_USERNAME|g'

# 4. Restore Discord bot connections
# Re-invite bots if needed, verify webhook URLs still valid
```

### Phase F — Cron Jobs (macOS uses launchd, but cron still works)

```bash
# Restore crontab
crontab ~/vault/System/cron-backup.txt

# Fix any paths: /home/trajan → /Users/YOUR_USERNAME
crontab -l | sed 's|/home/trajan|/Users/YOUR_USERNAME|g' | crontab -

# Verify cron daemon is running
sudo crontab -l  # macOS cron needs Full Disk Access

# IMPORTANT: On macOS, cron needs FDA
# System Settings → Privacy & Security → Full Disk Access → add /usr/sbin/cron
```

### Phase G — macOS-Specific Fixes

```bash
# 1. Prevent sleep
sudo pmset -a sleep 0
sudo pmset -a disksleep 0
sudo pmset -a displaysleep 30  # Screen can sleep, system cannot

# 2. Auto-login (so system starts on power outage recovery)
# System Settings → General → Login Items & Extensions → enable auto-login

# 3. Start OpenClaw on boot (create launchd plist)
cat > ~/Library/LaunchAgents/com.trajan.openclaw.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.trajan.openclaw</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/zsh</string>
        <string>-c</string>
        <string>source ~/.zshrc && openclaw gateway start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/logs/openclaw-gateway.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/logs/openclaw-gateway-err.log</string>
</dict>
</plist>
EOF
launchctl load ~/Library/LaunchAgents/com.trajan.openclaw.plist

# 4. Install Ollama (for local models — see Section 3)
brew install ollama
# Or: curl -fsSL https://ollama.ai/install.sh | sh

# 5. Ensure ~/bin scripts use /bin/bash or /usr/bin/env bash (not /bin/sh with bash-isms)
grep -l "#!/bin/bash" ~/bin/*.sh | head -5  # verify
```

### Phase H — Smoke Tests

```bash
# 1. Test OpenClaw gateway
openclaw gateway status

# 2. Test a simple agent call
openclaw chat "Hello, are you online?"

# 3. Test Discord bot responds in #concierge
# Send a message from Discord, verify response

# 4. Test cron jobs fire
# Manually trigger one:
bash /home/trajan/bin/system-watchdog.sh

# 5. Test vault access
ls ~/vault/ && cat ~/vault/Trajan/Preferences.md

# 6. Test dispatch engine
bash ~/bin/dispatch-engine.sh

# 7. Verify all 19 cron jobs loaded
crontab -l | grep -v "^#" | grep -v "^$" | wc -l
```

**Migration done. Mac mini is now the primary system.**

---

## 2. Independence Architecture

What needs to exist for the system to run itself without Trajan touching it.

### 2.1 Self-Healing Layer

**Current gaps:** Agents can get stuck, gateway can crash, sessions can zombie. The watchdogs exist but don't cover everything.

**What to build:**

#### `agent-resurrection.sh` — Stuck agent detector
```bash
#!/bin/bash
# Run every 5 min via cron
# Check each active OpenClaw agent session for last-activity timestamp
# If any session has no activity for >30 min AND has an open task → restart it
# Alert Discord only if restart fails 3x in a row

AGENTS=("concierge" "researcher" "ops" "coder" "vault-keeper")
STALE_THRESHOLD=1800  # 30 minutes

for agent in "${AGENTS[@]}"; do
    last_activity=$(openclaw sessions list --agent $agent --format json 2>/dev/null | jq -r '.[0].lastActivity // empty')
    if [[ -z "$last_activity" ]]; then continue; fi
    
    age=$(( $(date +%s) - $(date -d "$last_activity" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$last_activity" +%s) ))
    
    if [[ $age -gt $STALE_THRESHOLD ]]; then
        openclaw sessions kill --agent $agent 2>/dev/null
        sleep 2
        openclaw gateway restart 2>/dev/null
        echo "$(date): Restarted stuck agent: $agent (age: ${age}s)" >> ~/logs/resurrection.log
    fi
done
```

#### Process-level watchdog (extend existing `system-watchdog.sh`)
- Check `openclaw gateway status` — restart if down
- Check dispatch engine is running — restart if not
- Check cron daemon is alive — restart if not
- Post to Discord only when something fails AND the restart also fails

### 2.2 Proactive Work Engine

**Current state:** Dispatch engine runs every 10 min, picks up queued tasks. But who queues tasks proactively?

**What to build:**

#### `priority-engine.sh` — The "always something to do" brain
Runs every hour. Logic:
1. Check dispatch queue — if >3 tasks pending, skip (don't pile on)
2. Check `~/vault/Projects/` for each project — look for files tagged `status: needs-work` or `status: blocked`
3. Check `~/dispatch/pending-approvals/` — escalate anything waiting >24h
4. Pull from a `~/vault/System/priorities.md` file (Trajan edits this to set current focus)
5. Auto-queue research tasks based on active projects

```bash
# ~/vault/System/priorities.md format:
# - project: ExecuDeck | focus: landing page copy | urgency: high
# - project: LetMeScale | focus: competitor research | urgency: medium
```

#### Night mode vs. Day mode
- **Day mode (8am-10pm):** Full autonomy, can queue anything, spend freely
- **Night mode (10pm-8am):** Only run low-cost tasks (local models where possible), no new Claude API calls unless priority=critical, batch everything for morning

```bash
# Add to priority-engine.sh:
HOUR=$(date +%H)
if [[ $HOUR -ge 22 || $HOUR -lt 8 ]]; then
    MODE="night"
else
    MODE="day"
fi
```

### 2.3 Budget Guardrails

**The risk:** An infinite loop or runaway agent burns $200 in API calls overnight.

**What to build:**

#### `budget-watchdog.sh` — Daily spend tracking
```bash
#!/bin/bash
# Run every 30 min
# Pull spend from Anthropic API usage endpoint (if available) or estimate from log counting
# Count API calls in ~/.openclaw/logs/ since midnight
# If projected daily spend > $BUDGET_LIMIT → switch to local model fallback + alert Discord

DAILY_BUDGET=15  # dollars
BUDGET_FILE=~/vault/System/daily-budget.json

# Count tokens from logs (rough estimate)
CALLS_TODAY=$(grep -c "anthropic" ~/.openclaw/logs/$(date +%Y-%m-%d)*.log 2>/dev/null || echo 0)
ESTIMATED_COST=$(echo "$CALLS_TODAY * 0.015" | bc)  # rough avg cost per call

if (( $(echo "$ESTIMATED_COST > $DAILY_BUDGET * 0.8" | bc -l) )); then
    # Alert Trajan and throttle
    openclaw message send --channel discord --to channel:1484058418607161394 \
        --message "⚠️ Budget alert: ~\$$ESTIMATED_COST spent today (limit: \$$DAILY_BUDGET). Switching to conservative mode."
    touch ~/vault/System/budget-throttle.flag
fi
```

#### Model router respects budget flag
When `~/vault/System/budget-throttle.flag` exists:
- Route non-critical tasks to Ollama
- Defer research tasks to next day
- Only use Claude for user-facing requests

### 2.4 Health Monitoring

**Architecture:** Something watches the watchers.

```
Level 0: Individual agents (do their jobs)
Level 1: Watchdogs (restart Level 0 if broken) — gateway-watchdog, session-watchdog, system-watchdog
Level 2: Meta-watchdog (checks Level 1 is running) — NEW
Level 3: Discord heartbeat (posts "I'm alive" to a private channel every hour) — SIMPLE
```

#### `meta-watchdog.sh` — Runs every 15 min
```bash
#!/bin/bash
# Checks that all Level 1 watchdogs have run in the last 10 min
# Checks that dispatch engine has run in the last 15 min
# Checks that OpenClaw gateway responds to a ping
# If anything is broken and can't self-fix → posts to Discord

CHECKS=(
    "gateway-watchdog.sh:600"    # must have run in 600s
    "session-watchdog.sh:600"
    "system-watchdog.sh:600"
    "dispatch-engine.sh:900"
)

FAILED=()
for check in "${CHECKS[@]}"; do
    script="${check%%:*}"
    max_age="${check##*:}"
    log_entry=$(grep "$script" /tmp/watchdog.log 2>/dev/null | tail -1)
    # ... check timestamp logic
done

# Heartbeat: post to Discord every 2 hours
LAST_HEARTBEAT=$(cat ~/vault/System/last-heartbeat.txt 2>/dev/null || echo 0)
NOW=$(date +%s)
if [[ $(( NOW - LAST_HEARTBEAT )) -gt 7200 ]]; then
    openclaw message send --channel discord --to channel:1484058418607161394 \
        --message "💚 System heartbeat: All green at $(date '+%H:%M UTC'). Agents active."
    echo $NOW > ~/vault/System/last-heartbeat.txt
fi
```

### 2.5 Failure Escalation

**The problem:** Too many Discord pings = Trajan ignores them. Not enough = things break silently.

**Escalation tiers:**

| Tier | Condition | Action |
|------|-----------|--------|
| 0 — Self-heal | Agent stuck, can restart | Auto-restart, log only |
| 1 — Silent fix | Script fails, retry works | Log + note in morning briefing |
| 2 — Soft alert | Something broken >30 min, auto-fix failed | DM Trajan on Discord, no @mention |
| 3 — Hard alert | System down, budget blown, data loss risk | @mention Trajan in #ops |
| 4 — Emergency | Gateway dead + can't restart + 3 retries | SMS via Pushover/ntfy.sh |

```bash
# ~/bin/alert.sh — unified alert router
#!/bin/bash
TIER=$1
MESSAGE=$2

case $TIER in
    0) echo "$(date): [SELF-HEAL] $MESSAGE" >> ~/logs/auto-heals.log ;;
    1) echo "$(date): [SILENT] $MESSAGE" >> ~/logs/silent-fixes.log ;;
    2) openclaw message send --channel discord --to user:TRAJAN_USER_ID --message "🟡 $MESSAGE" ;;
    3) openclaw message send --channel discord --to channel:1482997518362214422 --message "🔴 @Trajan $MESSAGE" ;;
    4) curl -X POST "https://ntfy.sh/trajan-emergency" -d "$MESSAGE" ;;
esac
```

---

## 3. Local Model Strategy

Mac mini M-series (M2/M3/M4) can run Ollama with surprisingly capable models. The goal is to route cost-insensitive tasks to local models to reduce Claude API spend by 40-60%.

### Model Capabilities on Mac mini M-series

| Model | Size | Quality | RAM Needed | Best For |
|-------|------|---------|------------|---------|
| `llama3.2:3b` | 2GB | Good | 8GB | Simple summaries, classification |
| `llama3.1:8b` | 5GB | Very Good | 8GB | Most research, vault ops |
| `llama3.1:70b` | 40GB | Excellent | 64GB | Complex reasoning (M2/M3 Ultra only) |
| `mistral:7b` | 4GB | Good | 8GB | Code generation, scripts |
| `deepseek-coder:6.7b` | 4GB | Excellent at code | 8GB | Script fixes, code review |
| `nomic-embed-text` | 270MB | N/A | Any | Embeddings for QMD/vault search |

**For M2/M3 Pro (16-32GB):** Use 8B models. Avoid 70B.
**For M2/M3 Max (64GB+):** Can run 70B quantized. Dramatically better quality.

### Routing Table

#### ✅ Route to Local Model (Ollama)

| Task | Model | Rationale |
|------|-------|-----------|
| Vault summarization | llama3.1:8b | Repetitive, doesn't need perfection |
| Markdown formatting | llama3.1:8b | Low stakes, fast |
| Reddit/news intel scraping | llama3.1:8b | High volume, cost-sensitive |
| Script fixes (minor) | deepseek-coder:6.7b | Code-specialized local model |
| Memory promotion decisions | llama3.1:8b | Pattern matching, not creative |
| Vault quality scoring | llama3.1:8b | Structured output, repeatable |
| Backlink extraction | llama3.1:8b | Simple NLP task |
| Log analysis + alerting | llama3.1:8b | Structured, rules-based |
| Draft blog post outlines | llama3.1:8b | Drafts, not finals |
| Research summarization (raw) | llama3.1:8b | Pre-processing for Claude |
| Cron job scheduling decisions | llama3.2:3b | Simple classification |
| Embeddings (vault search) | nomic-embed-text | Purpose-built, near free |

#### ❌ Keep on Claude (Sonnet 4.6)

| Task | Why Claude |
|------|-----------|
| User-facing concierge responses | Quality matters, Trajan is watching |
| Strategic reasoning (priorities, roadmaps) | Needs full context window + reasoning |
| Code generation for production features | Quality-critical, bugs are expensive |
| Devils-advocate / strategic challenges | Needs genuine depth |
| New project architecture | Complex, high-stakes |
| Anything requiring web search synthesis | Tool use + reasoning combo |
| PR review + code critique | Accuracy matters |
| Security analysis | Errors are costly |
| Writing final copy (landing pages, emails) | Quality matters |

### Routing Logic Implementation

```bash
# ~/bin/model-router.sh
#!/bin/bash
TASK_TYPE=$1
TASK_PRIORITY=${2:-"normal"}
BUDGET_FLAG=$([ -f ~/vault/System/budget-throttle.flag ] && echo "true" || echo "false")
HOUR=$(date +%H)
NIGHT_MODE=$([[ $HOUR -ge 22 || $HOUR -lt 8 ]] && echo "true" || echo "false")

route_to_local() {
    echo "ollama"
    # Set OLLAMA_MODEL env var
}
route_to_claude() {
    echo "claude"
    # Set CLAUDE_MODEL env var
}

# Decision tree
case $TASK_TYPE in
    "vault_ops"|"log_analysis"|"summarization"|"research_raw")
        route_to_local ;;
    "user_facing"|"architecture"|"code_production"|"strategic")
        route_to_claude ;;
    *)
        # Default: local if night mode or budget throttled, claude otherwise
        if [[ "$NIGHT_MODE" == "true" || "$BUDGET_FLAG" == "true" ]]; then
            route_to_local
        else
            route_to_claude
        fi ;;
esac
```

### Ollama Setup on Mac mini

```bash
# Install
brew install ollama

# Pull required models
ollama pull llama3.1:8b
ollama pull deepseek-coder:6.7b
ollama pull nomic-embed-text

# Start as service (auto-starts on boot)
brew services start ollama

# Test
ollama run llama3.1:8b "Summarize this in 3 bullets: $(cat ~/vault/Architecture/README.md)"

# OpenClaw config for local model fallback
# In ~/.openclaw/config.json, add local model option:
# "fallback_model": "ollama/llama3.1:8b"
```

### Cost Projection

Current estimated spend: ~$300-500/month (27 agents, 19 cron jobs, heavy vault ops)
With local routing: ~$120-200/month (40-60% reduction)
Main savings: vault ops, research pipeline, log analysis (high-frequency, low-quality-need tasks)

---

## 4. Portability Design

**Goal:** Move the entire system to a new machine in under 1 hour.

### The Portability Principle

> Everything stateful lives in `~/vault/` (versioned in git) or `~/dispatch/` (ephemeral queue, OK to lose). Everything configural lives in `~/.openclaw/` (backed up). Everything else is reconstructable.

### What to Back Up (Critical — Can't Recreate)

| Location | Contents | Backup Method |
|----------|----------|---------------|
| `~/vault/` | All knowledge, notes, agent memory, config | Git remote (GitHub/GitLab private) |
| `~/.openclaw/` | Agent configs, API endpoints, agent state | Git repo OR encrypted archive |
| `~/.openclaw/.env` | API keys, tokens | 1Password / Bitwarden (NEVER git) |
| `~/bin/` | All 218+ shell scripts | Git repo (already?) |
| `crontab -l` | 19 scheduled jobs | `~/vault/System/cron-backup.txt` (auto-backed up every 6h) |
| `~/dispatch/config/` | Dispatch routing rules | Part of vault git |

### What's Ephemeral (Can Lose)

| Location | Why It's OK to Lose |
|----------|---------------------|
| `~/dispatch/queue/` | Tasks re-queue from priorities |
| `~/dispatch/traces/` | Historical traces, not needed |
| `/tmp/*` | Always ephemeral |
| `~/.openclaw/logs/` | Historical logs, not critical |
| `~/dispatch/metrics*.json` | Rebuild from logs |
| OpenClaw session history | Agents start fresh |

### One-Command Backup Script

```bash
# ~/bin/system-backup.sh
#!/bin/bash
set -e

BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=~/vault/System/backups/$BACKUP_DATE

mkdir -p $BACKUP_DIR

# 1. Vault (if not auto-committed)
cd ~/vault && git add -A && git commit -m "backup $BACKUP_DATE" 2>/dev/null || true
git push origin main 2>/dev/null || echo "Warning: vault push failed"

# 2. OpenClaw config (without .env)
tar czf $BACKUP_DIR/openclaw-config.tar.gz ~/.openclaw/ \
    --exclude="~/.openclaw/.env" \
    --exclude="~/.openclaw/logs"

# 3. Bin scripts
tar czf $BACKUP_DIR/bin-scripts.tar.gz ~/bin/

# 4. Crontab
crontab -l > $BACKUP_DIR/crontab.txt

# 5. Dispatch config
tar czf $BACKUP_DIR/dispatch-config.tar.gz ~/dispatch/config/ ~/dispatch/workflows/ 2>/dev/null

# 6. Skills
tar czf $BACKUP_DIR/skills.tar.gz ~/skills/ 2>/dev/null

echo "Backup complete: $BACKUP_DIR"
echo "IMPORTANT: Manually back up ~/.openclaw/.env to 1Password/Bitwarden"
```

### One-Hour Recovery Playbook

```bash
# 1. Install core tools (15 min)
#    - Homebrew, git, node, python3, jq, flock, OpenClaw

# 2. Clone vault (2 min)
git clone <vault-remote> ~/vault

# 3. Restore OpenClaw config (3 min)
tar xzf ~/vault/System/backups/LATEST/openclaw-config.tar.gz -C ~/

# 4. Restore bin scripts (2 min)
tar xzf ~/vault/System/backups/LATEST/bin-scripts.tar.gz -C ~/
chmod +x ~/bin/*.sh

# 5. Restore crontab (1 min)
crontab ~/vault/System/backups/LATEST/crontab.txt
# OR: crontab ~/vault/System/cron-backup.txt (auto-backed up every 6h)

# 6. Set env vars from 1Password (5 min)
# Open 1Password, copy each key to ~/.openclaw/.env

# 7. Fix paths if new machine (5 min)
find ~/.openclaw/ ~/bin/ -name "*.json" -o -name "*.sh" | \
    xargs grep -l "/home/trajan\|/Users/oldname" | \
    xargs sed -i '' "s|/home/trajan|$HOME|g; s|/Users/oldname|$HOME|g"

# 8. Start gateway (1 min)
openclaw gateway start

# 9. Smoke test (5 min)
openclaw chat "Are you online?"
# Verify Discord response

# 10. Verify crons (2 min)
crontab -l
bash ~/bin/system-watchdog.sh
```

### Config Structure Standard

```
~/.openclaw/
├── config.json          # Main OpenClaw config
├── agents/              # Agent definitions (one dir per agent)
│   ├── concierge/
│   ├── researcher/
│   └── ...
├── plugins/             # Plugin configs
└── .env                 # API keys — NEVER in git

~/vault/System/
├── cron-backup.txt      # Auto-updated every 6h
├── required-env-vars.txt
├── priorities.md        # What the system is working on now
├── last-heartbeat.txt
├── daily-budget.json
└── backups/             # Snapshots

~/bin/                   # All scripts — should be in git
```

---

## 5. 30-Day Roadmap

### Week 1 — Stable Foundation (Days 1-7)
**Goal:** Mac mini running, all agents working, Discord connected.

| Day | Task |
|-----|------|
| 1 | Run Phase A prep on Ubuntu VM. Export everything. |
| 1 | Install Homebrew, core tools, OpenClaw on Mac mini |
| 2 | Transfer vault, bin, openclaw config via rsync |
| 2 | Set env vars, fix paths, start gateway |
| 3 | Restore all 19 cron jobs. Verify each one fires. |
| 3 | Discord smoke test: verify all bots/webhooks respond |
| 4 | Smoke test all 15 configured agents |
| 4 | Fix any broken scripts (path issues, macOS vs Linux) |
| 5 | Install Ollama. Pull llama3.1:8b, nomic-embed-text |
| 5 | Configure Mac mini: no-sleep, auto-login, launch-at-boot |
| 6 | Run system for 24h — watch logs for errors |
| 7 | Fix any issues found. Ubuntu VM is now secondary/off. |

**Exit criteria:** Mac mini runs 24h without manual intervention. Discord works. Crons fire.

### Week 2 — Self-Healing (Days 8-14)
**Goal:** System can detect and fix its own failures without Trajan.

| Day | Task |
|-----|------|
| 8 | Write `meta-watchdog.sh` — checks that watchdogs are running |
| 8 | Write `alert.sh` — tiered escalation router |
| 9 | Write `agent-resurrection.sh` — stuck agent detector/restarter |
| 9 | Add to crontab: meta-watchdog every 15 min |
| 10 | Set up Discord heartbeat — "💚 System alive" every 2h |
| 10 | Test: manually kill gateway, verify it restarts and posts alert |
| 11 | Write `system-backup.sh` — full backup in one command |
| 11 | Set up git remote for vault (GitHub private repo if not already) |
| 12 | Add backup to cron: daily at 3am |
| 12 | Test: simulate full system crash + recovery from scratch |
| 13-14 | Buffer: fix anything that broke during self-heal testing |

**Exit criteria:** Kill any component, it restarts itself. Trajan gets alerted appropriately.

### Week 3 — Proactive Engine + Budget Control (Days 15-21)
**Goal:** System works on priorities while Trajan sleeps. Doesn't burn money.

| Day | Task |
|-----|------|
| 15 | Write `~/vault/System/priorities.md` — current project priorities |
| 15 | Write `priority-engine.sh` — reads priorities, queues work |
| 16 | Implement night mode in priority-engine: 10pm-8am = no Claude calls |
| 16 | Write `budget-watchdog.sh` — tracks daily spend, sets throttle flag |
| 17 | Write `model-router.sh` — routes tasks to Ollama vs Claude |
| 17 | Update 3-5 high-frequency cron jobs to use model-router |
| 18 | Test overnight run: verify night mode kicks in, no Claude calls 10pm-8am |
| 18 | Test budget throttle: verify alert fires at 80% of daily limit |
| 19 | Tune priority-engine: verify right tasks are being queued |
| 20 | Morning briefing v3: includes "here's what I did overnight" |
| 21 | Review: is the system actually doing useful work while Trajan sleeps? |

**Exit criteria:** System auto-queues relevant work overnight. Budget never exceeds limit.

### Week 4 — Polish + Local Model Expansion (Days 22-30)
**Goal:** Stable, cost-optimized, fully portable.

| Day | Task |
|-----|------|
| 22 | Audit all 19 cron jobs: which can route to local models? |
| 22 | Update vault_ops jobs (summarization, quality scoring, backlinks) → Ollama |
| 23 | Update research pipeline → Ollama for raw summarization |
| 23 | Measure: what % of API calls now go to local? Target: 40%+ |
| 24 | Write complete recovery playbook (test it on a VM first) |
| 24 | Document all agent configs, what each does, when it runs |
| 25 | Portability test: factory-reset a VM, restore from backup, time it |
| 26 | Tweak escalation tiers based on 2 weeks of alerts (was anything noisy?) |
| 27 | Set up ntfy.sh or Pushover for Tier 4 (emergency SMS) |
| 28 | Final review: 30-day health check |
| 29 | Update vault/Architecture/ with what actually got built |
| 30 | System is independent. Trajan writes down what still needs his attention vs what the system handles. |

**Exit criteria:** System runs 30 days. Average < 1 Trajan intervention per day for non-urgent items. Cost < $200/month.

---

## Summary Metrics to Track

| Metric | Target | Where |
|--------|--------|-------|
| System uptime | >99% | `~/logs/resurrection.log` |
| Daily API cost | <$15 | `~/vault/System/daily-budget.json` |
| % tasks routed to local | >40% | model-router logs |
| Interventions needed by Trajan | <1/day avg | Discord DM count |
| Recovery time from scratch | <60 min | Tested monthly |
| Cron job failure rate | <5% | cron logs |

---

## Open Questions for Trajan

1. **Vault remote:** Is `~/vault/` already in a git remote? If not, set up a private GitHub repo before migration.
2. **Mac mini RAM:** M2 Pro (16GB) vs Max (64GB+) affects which Ollama models you can run.
3. **Discord bot token:** Hosted where? If it breaks during migration, need to know where to regenerate.
4. **Tailscale:** Consider adding it post-migration — lets you SSH into Mac mini from anywhere without exposing it to internet.
5. **`~/scripts/` directory:** Separate from `~/bin/`? Need to include in backup/transfer.
6. **Budget limit:** What's the actual monthly budget? Needs to be set in `budget-watchdog.sh`.

---
*Generated: 2026-03-19 | Architecture: Systems Architect Agent*
