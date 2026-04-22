---
title: "3 Weeks Running 6 AI Agents 24/7 — Field Lessons"
type: research
created: 2026-03-30
tags: [multi-agent, ai-agents, orchestration, lessons-learned, workflow, reddit]
source: https://www.reddit.com/r/AI_Agents/comments/1s7bwgx/3_weeks_running_6_ai_agents_247_heres_what_id/
confidence: 0.75
---

# 3 Weeks Running 6 AI Agents 24/7 — Field Lessons

*Source: r/AI_Agents, score: 25, March 2026*  
*Type: practitioner report (not peer-reviewed, but high operational detail)*

## Setup

6 specialized agents: developer, researcher, writer, marketing, revenue ops, and a **coordinator** that routes work between them. Running 24/7 with cron-scheduled overnight tasks.

## What Actually Works

### Coordination protocol > agent count
- Without routing protocol: agents step on each other, duplicate work, overwrite outputs
- Fix: **one coordinator owns all routing**. Every task goes through it. Other agents only respond when explicitly called — no freelancing.
- Reported outcome: 60% reduction in wasted compute from agent conflicts

### Specialized roles > generalist agents
- "One super-agent that does everything" → mediocre at everything
- Narrow-scoped agents with focused jobs dramatically outperform
- Developer doesn't write blog posts. Writer doesn't touch code.

### Overnight cron jobs = best ROI
- Research tasks, deployment checks, daily summaries run while sleeping
- Wake up to a briefing instead of a to-do list
- "This alone justified the whole setup"

## What's a Waste of Time

### Don't activate all agents on day 1
- Start with 2 agents (e.g., developer + researcher)
- Learn the workflow rhythm before expanding
- Week 1: 2 agents. Week 3: all 6 in rotation

### Fancy dashboards before workflow exists
- Built a coordination dashboard week 1, used it twice
- Agents work through task queues and message each other directly
- Build the workflow first, visualize later (if ever)

### Over-engineering agent memory
- Persistent memory systems for "remember everything" → mostly noise
- Agents don't need to remember everything — they need **right context at right time**
- **A simple daily notes file beats a complex vector DB for 90% of use cases**

## 3 Core Rules

1. **One router, many workers.** Never let agents self-assign. One agent decides who does what. Everyone else executes.
2. **Kill the generalist.** If an agent's system prompt is longer than a paragraph, it's doing too much.
3. *(third rule truncated in source, likely: start small, scale up)*

## Relevance to This System

These lessons apply directly to [[Architecture/System Overview]] and [[AGENTS.md]]:
- Right Hand already operates as a coordinator — this validates the architecture
- "Simple daily notes > complex vector DB" aligns with the current memory model
- The overnight cron workflow mirrors what's already running (briefings, reddit-intel, github-trending)
- The "kill the generalist" rule supports having narrow specialist agents vs. one super-agent
