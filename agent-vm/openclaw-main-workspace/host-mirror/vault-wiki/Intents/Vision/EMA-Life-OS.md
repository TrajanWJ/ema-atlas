---
title: "EMA Life OS"
intent_level: 0
intent_kind: goal
intent_status: active
intent_priority: 1
project: ema
tags: ["vision", "life-os", "core"]
---

# EMA Life OS

Personal AI operating system: an autonomous thinking companion and life management system.

## What
A desktop application that serves as the executive layer for a solo developer's entire workflow. Orchestrates AI agents, tracks intent and execution, manages knowledge, and provides observability into all running processes.

## Why
The tools exist (Claude, Codex, local models) but there's no connective tissue. Proposals get generated but never executed. Sessions happen but aren't linked to goals. Results aren't harvested back into knowledge. EMA is the missing executive layer.

## Children
- [[Ship-Core-Loop]]
- [[Agent-Collaboration]]

## Stack
Elixir/Phoenix 1.8 daemon + Tauri 2 + React 19 + Zustand + SQLite
