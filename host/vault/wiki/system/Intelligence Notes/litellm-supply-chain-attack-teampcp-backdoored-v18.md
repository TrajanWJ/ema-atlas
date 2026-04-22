---
type: knowledge
wiki_id: system/Intelligence_Notes/litellm-supply-chain-attack-teampcp-backdoored-v18
imported_from: >-
  vault/System/Intelligence
  Notes/litellm-supply-chain-attack-teampcp-backdoored-v18.md
imported_at: '2026-04-04T00:23:57.248Z'
tags: []
summary: ''
---
# LiteLLM supply chain attack: TeamPCP backdoored v1.82.7/v1.82.8 via compromised Trivy scanner with 3-stage credential exfiltration payload — 97M monthly downloads affected

- **Category:** best-practice
- **Source:** c46e7cb9.txt
- **Applied:** 2026-03-26T04:38:19Z
- **Impact:** 4/5
- **Project:** OpenClaw Agent Setup

## Details

Audit any LiteLLM usage in the agent stack; pin to a safe version or migrate to Bifrost/TensorZero/direct SDKs. Check package-lock/requirements files for litellm dependency.

## Source Context

Extracted from agent result: `c46e7cb9.txt`

---
Tags: #intelligence #best-practice #auto-applied
