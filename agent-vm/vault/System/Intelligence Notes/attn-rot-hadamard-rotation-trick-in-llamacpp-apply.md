# attn-rot Hadamard rotation trick in llama.cpp: applying a pre/post Hadamard rotation to Q/K/V projections before 4-bit quantization (attn-rot flag) boosts Q4_0 accuracy on AIME25 from 0–2% to 21.7% vs 37.9% F16 — a near-halving of the quantization accuracy gap for reasoning tasks

- **Category:** technique
- **Source:** 1c922b73.txt
- **Applied:** 2026-04-02T00:40:31Z
- **Impact:** 3/5
- **Project:** general

## Details

When running 27B+ reasoning models (e.g., Qwen, DeepSeek-R1) at Q4_0 quantization, add --attn-rot flag to llama.cpp invocations. Benchmark against current Q4_K_M runs before committing — attn-rot may yield better accuracy-per-GB than the K_M quant family for math/reasoning tasks.

## Source Context

Extracted from agent result: `1c922b73.txt`

---
Tags: #intelligence #technique #auto-applied
