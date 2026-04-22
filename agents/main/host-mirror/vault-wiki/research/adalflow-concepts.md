---
title: AdalFlow — PyTorch-like Library for Auto-Optimizing LLM Workflows
created: '2026-03-18'
updated: '2026-03-18'
type: research
status: active
source: unknown
wiki_id: research/adalflow-concepts
imported_from: vault/Research/adalflow-concepts.md
imported_at: '2026-04-04T00:23:57.154Z'
tags: []
summary: ''
---

# AdalFlow — PyTorch-like Library for Auto-Optimizing LLM Workflows

**Source:** [SylphAI-Inc/AdalFlow](https://github.com/SylphAI-Inc/AdalFlow) · [Docs](https://adalflow.sylph.ai) · MIT License
**Commercial product:** [AdaL CLI](https://sylph.ai) — "The Self-Evolving AI Coding Agent"
**Paper:** [LLM-AutoDiff (arXiv 2501.16673)](https://arxiv.org/abs/2501.16673) — Jan 2025

## What It Is

AdalFlow does for LLM prompts what PyTorch does for neural network weights: makes them automatically optimizable. Define your LLM pipeline, provide a dataset + eval metric, and AdalFlow finds the best prompts through automated textual gradient descent.

**Key claim:** Highest accuracy among all auto-prompt optimization libraries. Outperforms DSPy, TextGrad in both accuracy and training cost.

## Core Concepts

### 1. Parameters as Trainable Objects

```python
system_prompt = adal.Parameter(
    data="You will answer a reasoning question. Think step by step.",
    role_desc="Task instruction for the LLM in system prompt",
    requires_opt=True,            # This parameter gets optimized
    param_type=ParameterType.PROMPT  # Type: prompt text (vs DEMOS for few-shot)
)
```

Two parameter types:
- **PROMPT** — Auto-optimized via LLM-AutoDiff textual gradients
- **DEMOS** — Few-shot examples, optimized via Bootstrap Learning

### 2. Generator Class

Wraps any LLM with a jinja2 template + output parser. You see exactly what's sent to the model.

```python
template = r"""<START_OF_SYSTEM_PROMPT>
{{system_prompt}}
<END_OF_SYSTEM_PROMPT>
<START_OF_USER>
{{input_str}}
<END_OF_USER>"""

generator = adal.Generator(
    model_client=adal.OpenAIClient(),
    model_kwargs={"model": "gpt-4o"},
    template=template,
    prompt_kwargs={"system_prompt": system_prompt},
    output_processors=parse_answer,
)
```

### 3. LLM-AutoDiff (The Core Innovation)

Treats the entire LLM pipeline as a **computation graph**. Each prompt parameter is a node. A frozen "backward engine" LLM generates **textual gradients** — natural language feedback that guides iterative prompt updates.

Key advances over prior work (TextGrad, DSPy):
- Handles **multi-component, potentially cyclic** architectures
- Accommodates **functional nodes** (retrieval, data formatting)
- Preserves **time-sequential behavior** in multi-hop loops
- Combats **"lost-in-the-middle"** by isolating distinct sub-prompts
- **Selective gradient computation** — focuses on error-prone samples

### 4. Few-Shot Bootstrap Learning (Learn-to-Reason)

For DEMOS parameters:
1. Auto-samples training examples
2. Runs them through a "teacher" model (high-quality LLM)
3. Filters by correctness
4. Selects the best subset that maximizes task performance

Can combine with PROMPT optimization for both zero-shot + few-shot in one training loop.

### 5. Component + `bicall()` Pattern

Same component code path for inference (`call`) and training (`forward` with backward pass):

```python
class MyPipeline(adal.Component):
    def bicall(self, question, id=None):
        # Works in both eval mode (returns GeneratorOutput) 
        # and train mode (returns Parameter for backward pass)
        return self.llm(prompt_kwargs={"input_str": question}, id=id)
```

### 6. Trainer + AdalComponent

PyTorch Lightning-style training:

```python
class MyAdal(adal.AdalComponent):
    def __init__(self, ...):
        task = MyPipeline(model_client, model_kwargs)
        eval_fn = AnswerMatchAcc(type="exact_match").compute_single_item
        loss_fn = adal.EvalFnToTextLoss(eval_fn=eval_fn, ...)
        super().__init__(task=task, eval_fn=eval_fn, loss_fn=loss_fn, ...)

    def prepare_task(self, sample):
        return self.task.bicall, {"question": sample.question, "id": sample.id}

    def prepare_eval(self, sample, y_pred):
        return self.eval_fn, {"y": y_pred_label, "y_gt": sample.label}

    def prepare_loss(self, sample, y_pred):
        # Wire up for textual gradient computation
        ...
```

Then train: `trainer = adal.Trainer(...); trainer.fit(train_dataset, val_dataset)`

### 7. Model-Agnostic

Swap between GPT-4o, Claude, Gemini, local models via config — not code changes. All are optional dependencies.

## Auto-Prompt Optimization Ecosystem

| Library | Approach | Key Idea |
|---------|----------|----------|
| **AdalFlow** | PyTorch-style auto-diff | Unified textual gradient descent + few-shot bootstrap |
| **DSPy** | Declarative programming | Composable modules, automatic compilation |
| **TextGrad** | Textual gradients | Single-node text optimization |
| **SAMMO** | Graph-based optimization | Prompt structure search |
| **PromptAgent** | Monte Carlo Tree Search | Strategic prompt exploration |

## AdaL CLI — The Commercial Product

Built on AdalFlow. Tagline: "The Self-Evolving AI Coding Agent."
- Self-optimizes its own prompts based on task performance
- "Say Goodbye to Manual Prompting"
- Powers coding agent workflows that improve over time

## Related Research

- [LLM-AutoDiff](https://arxiv.org/abs/2501.16673) — The foundational paper
- [LAD-VF](https://arxiv.org/pdf/2509.18384) — Fine-tuning-free robot planning using LLM auto-differentiation
- [Scaling Textual Gradients](https://arxiv.org/abs/2506.00400) — Momentum-weighted optimization

## Related
- [[Auto-Prompt Optimization]] — How to apply this to OpenClaw
- [[SciTeX Concepts]] — Complementary framework (reproducibility + evidence)
- [[Scientific Method for Agents]] — Evidence chain architecture
