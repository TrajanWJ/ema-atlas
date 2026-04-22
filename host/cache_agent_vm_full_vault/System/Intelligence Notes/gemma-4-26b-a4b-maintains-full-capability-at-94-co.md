# Gemma 4 26B A4B maintains full capability at 94% context fill (245K/262K tokens) per community testing — most models degrade well before advertised context limits, making this an outlier for long-context agentic workloads

- **Category:** technique
- **Source:** b56e7631.txt
- **Applied:** 2026-04-12T12:37:54Z
- **Impact:** 2/5
- **Project:** EMA Phase 2 Implementation Guide

## Details

Append to existing Gemma 4 config extraction (b420af11.txt) that the 260K context window is usable to ~94% fill without degradation; relevant for local agent dispatch tasks that require deep context (e.g., full-file analysis, multi-file reasoning)

## Source Context

Extracted from agent result: `b56e7631.txt`

---
Tags: #intelligence #technique #auto-applied
