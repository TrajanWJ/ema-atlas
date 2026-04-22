---
title: "Agent Tester - Multi-Model SOUL.md Testing"
created: 2026-03-16
updated: 2026-03-16
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: agent-research
tags: [agent-testing, benchmarking, model-optimization, production-routing, soul-md]
summary: "A testing framework specifically designed to run agent SOUL.md files through multiple models, score outputs, and find the optimal model for each agent"
---
# Agent Tester - Multi-Model SOUL.md Testing

**Source:** https://github.com/leo-guinan/agent-tester  
**Quality Rating:** ⭐⭐⭐⭐ (4/5)  
**Category:** Agent Testing, Model Benchmarking, SOUL.md Optimization  
**Relevance:** High - Direct tool for optimizing our agent prompts across models

## What It Is

A testing framework specifically designed to run agent SOUL.md files through multiple models, score outputs, and find the optimal model for each agent. Answers the critical question: "When you have 6 AI agents in production, which model should each one run on?"

## Key Features

### Multi-Model Testing
- Tests agents against 20+ models via OpenRouter
- Supports free models, premium models, and local Ollama models
- Model grouping by provider (OpenAI, Anthropic, Google, free tier)
- Cost tracking and latency measurement

### Automated Scoring
- Judge model evaluates outputs on 0-10 scale
- Customizable scoring criteria per agent type
- Default metrics: voice accuracy, format compliance, specificity, hook quality
- Breakdown scoring with detailed feedback

### Comprehensive Reporting
- Ranked markdown reports with cost/latency analysis
- Historical benchmarking and trend tracking
- Model recommendation engine based on performance/cost

## Benchmark Results Example

| Rank | Model | Avg Score | Cost/call | Latency |
|------|--------|-----------|-----------|---------|
| 1 | GPT-5.3-chat | 8.6 | $0.007 | 5s |
| 1 | Opus 4.6 | 8.6 | $0.020 | 16s |
| 3 | Haiku 4.5 | 8.1 | $0.0024 | 2s |

**Key Finding**: Haiku 4.5 emerges as the "sweet spot" - best quality-per-dollar with no agent scoring below 7.5.

## Actionable Takeaways

### For Our Agent System

1. **Agent-Model Matching**: Different agents excel on different models
2. **Cost Optimization**: 3x cost differences between equivalent-performing models
3. **Performance Variability**: Same model family can have different structural constraints
4. **Budget Routing**: Implement tiered routing based on task complexity

### Testing Framework Implementation

```bash
# Test specific agents against models
node run.mjs --agent ~/right-hand-agent --cases cases/right-hand.json \
  --models "anthropic/claude-haiku-4-5,openai/gpt-5.3-chat"

# Budget-optimized routing
node run.mjs --agent ~/researcher-agent --cases cases/researcher.json --groups free

# Full benchmarking suite
bash run-all-agents.sh
```

### Test Case Structure
```json
[
  {
    "id": "case-id",
    "name": "Human-readable name", 
    "user_message": "Exact message sent to model",
    "context": "What good looks like — used by judge"
  }
]
```

## Applications for Trajan's System

### Agent Optimization Strategy

1. **Create test cases** for each specialized agent (Researcher, Coder, Ops, Security)
2. **Benchmark across models** to find optimal model per agent type
3. **Implement smart routing** based on task complexity and budget constraints
4. **Continuous testing** as new models become available

### Custom Scoring Criteria

1. **Right Hand Agent**: Helpfulness, accuracy, task routing effectiveness
2. **Researcher Agent**: Depth, citation quality, synthesis capability  
3. **Coder Agent**: Code quality, security awareness, documentation
4. **Ops Agent**: System understanding, safety, troubleshooting

### Production Implementation

1. **Multi-model routing**: Route different agents to their optimal models
2. **Budget controls**: Automatic fallback to cheaper models when appropriate
3. **Performance monitoring**: Track agent effectiveness over time
4. **A/B testing**: Compare new SOUL.md versions against established baselines

## Integration Steps

1. **Set up testing framework** in our workspace
2. **Create test cases** for each agent's common scenarios  
3. **Run initial benchmarks** across all available models
4. **Implement model routing** based on results
5. **Schedule regular re-testing** as new models release

## Production Deployment Insights

The RedshirtAI Away Team uses these results for production routing:
- **WALL-E**: Opus 4.6 for signal compression quality (9.2/10)
- **Mando**: GPT-5.3-chat for precision (8.1/10)  
- **Budget mode**: 3x cheaper routing available

## Related
- [[Multi-Agent Architecture Evaluation]] — architecture evaluation that benefits from this testing framework
- [[Agent-Architecture-Synthesis-2026-03]] — synthesis of agent patterns including model selection
- [[Agent Capabilities Matrix]] — capabilities matrix that testing results inform