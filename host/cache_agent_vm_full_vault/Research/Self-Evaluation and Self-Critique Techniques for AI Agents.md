---
title: "Self-Evaluation and Self-Critique Techniques for AI Agents"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [code, evolution, github, knowledge, prompts, research]
summary: "Constitutional AI eliminates per-example human labels for harmfulness by replacing them with a *constitution* (a set of principles) and a two-phase se"
---
# Self-Evaluation and Self-Critique Techniques for AI Agents

> Research compiled 2026-03-16. Covers Constitutional AI, Reflexion, LLM-as-Judge, Chain-of-Verification, Self-Consistency, Multiagent Debate, and calibration techniques. Focus on implementable patterns for [[Self-Critique and Auto-Evolution Design]] and [[Agent Evaluation Frameworks]].

---

## 1. Constitutional AI / Self-Critique Patterns

**Paper**: Bai et al., "Constitutional AI: Harmlessness from AI Feedback" (2022) — Anthropic

Constitutional AI eliminates per-example human labels for harmfulness by replacing them with a *constitution* (a set of principles) and a two-phase self-improvement loop.

### Architecture

```
Phase 1: Supervised Self-Critique
  Initial Model → Generate response
    → Critique response against constitutional principle
    → Revise response based on critique
    → Finetune model on (prompt, revised_response) pairs

Phase 2: RLAIF (RL from AI Feedback)
  Finetuned Model → Generate response pairs
    → AI evaluator ranks which response is better
    → Build preference dataset from AI judgments
    → Train reward model on preferences
    → Apply RL (PPO) with AI-derived reward signal
```

### Critique-Revision Prompt Pattern

The core reusable pattern is the **Critique-then-Revise** loop:

```
System: You are a helpful assistant.

Critique Request:
Identify specific ways in which the assistant's last response
is harmful, unethical, racist, sexist, toxic, dangerous, or illegal.

Critique: [model generates critique]

Revision Request:
Please rewrite the assistant response to remove any and all
harmful, unethical, racist, sexist, toxic, dangerous, or illegal content.

Revision: [model generates improved response]
```

This can be generalized to any evaluation dimension:

```python
CRITIQUE_TEMPLATE = """
Review the following {output_type} against these criteria:
{criteria}

Content to evaluate:
{content}

Identify specific issues, citing the exact problematic portions.
"""

REVISION_TEMPLATE = """
Given the following critique:
{critique}

Original content:
{content}

Produce a revised version that addresses every identified issue
while preserving the original intent and quality.
"""
```

### Key Insight
The constitution serves as a **declarative specification** of desired behavior. The model does the work of operationalizing abstract principles into concrete corrections. This is more scalable than example-based RLHF.

---

## 2. Reflexion Framework (Agent Self-Reflection)

**Paper**: Shinn et al., "Reflexion: Language Agents with Verbal Reinforcement Learning" (2023)

Reflexion replaces scalar reward signals with **verbal self-reflection** stored in episodic memory. The agent maintains a text buffer of past failures and reflections, which it uses to improve on subsequent attempts.

### Architecture

```
Trial 1:
  Agent attempts task → Gets feedback (pass/fail, error messages)
  Agent generates self-reflection → Stored in memory buffer

Trial 2:
  Agent reads reflection memory
  Agent attempts task with improved strategy
  → If fail: generate new reflection, append to memory
  → If pass: done

Repeat up to max_trials
```

### Implementation (from the Reflexion codebase)

**Self-Reflection Prompt (Programming Tasks)**:

```
You are a Python writing assistant. You will be given your previous
function implementation and a series of unit test results.
Your goal is to write a few sentences to explain why your
implementation is wrong as indicated by the tests.
You will need this as guidance when you try again later.
Only provide the few sentence description in your answer,
not the implementation.
```

**Self-Reflection Prompt (Reasoning/QA Tasks)**:

```
You are an advanced reasoning agent that can improve based on
self-reflection. You will be given a previous reasoning trial
in which you were given access to an Observe[env] action.
You were unsuccessful in answering the question either because
you guessed the wrong answer with Finish[<answer>], or you used
up your set number of reasoning steps.

Diagnose a possible reason for failure or phrasing discrepancy
and devise a new, concise, high level plan that aims to mitigate
the same failure. Use complete sentences.
```

**Reflexion Strategy Enum**:

```python
class ReflexionStrategy(Enum):
    NONE = "none"                          # No memory of prior attempts
    LAST_ATTEMPT = "last_attempt"          # Prior trace as context
    REFLEXION = "reflexion"                # Self-generated critique
    LAST_ATTEMPT_AND_REFLEXION = "last_attempt_and_reflexion"  # Both
```

### Core Algorithm (Pseudocode)

```python
def reflexion_loop(task, agent, max_trials=5):
    reflections = []

    for trial in range(max_trials):
        # Attempt with accumulated reflections
        result = agent.attempt(
            task=task,
            prior_reflections=reflections
        )

        # Check success
        feedback = evaluate(result, task.expected)
        if feedback.success:
            return result

        # Generate verbal reflection
        reflection = agent.reflect(
            task=task,
            attempt=result,
            feedback=feedback,
            prior_reflections=reflections
        )
        reflections.append(reflection)

    return best_attempt
```

### Key Insight
Reflexion achieved **91% pass@1 on HumanEval** (vs GPT-4's 80% at the time) by letting the agent learn from its own mistakes across trials without any weight updates. The verbal reflection acts as a "gradient" in natural language space.

---

## 3. LLM-as-Judge / Self-Evaluation Scoring

**Paper**: Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (2023)

### Three Judging Modes

| Mode | Description | Best For |
|------|-------------|----------|
| **Direct Scoring** | Single response, absolute score | Objective criteria (factuality, format) |
| **Pairwise Comparison** | Compare two responses, pick winner | Subjective quality (helpfulness, tone) |
| **Reference-Based** | Compare against gold answer | Tasks with known correct answers |

### MT-Bench Judge Prompts

**Single-Answer Grading**:

```
[System]
You are a helpful assistant.

[User]
Please act as an impartial judge and evaluate the quality of the
response provided by an AI assistant to the user question displayed
below. Your evaluation should consider factors such as the
helpfulness, relevance, accuracy, depth, creativity, and level of
detail of the response. Begin your evaluation by providing a short
explanation. Be as objective as possible. After providing your
explanation, you must rate the response on a scale of 1 to 10
by strictly following this format: "`[[rating]]`", for example:
"Rating: `[[5]]`".

[Question]
{question}

[The Start of Assistant's Answer]
{answer}
[The End of Assistant's Answer]
```

**Pairwise Comparison**:

```
[System]
Please act as an impartial judge and evaluate the quality of the
responses provided by two AI assistants to the user question
displayed below. You should choose the assistant that follows the
user's instructions and answers the user's question better.
Your evaluation should consider factors such as the helpfulness,
relevance, accuracy, depth, creativity, and level of detail of
their responses. Avoid any position biases and ensure that the
order in which the responses were presented does not influence
your decision. Do not allow the length of the responses to
influence your evaluation. Be as objective as possible. Output
your final verdict by strictly following this format: "[[A]]"
if assistant A is better, "[[B]]" if assistant B is better,
and "[[C]]" for a tie.
```

### G-Eval Rubric Pattern (from OpenAI Cookbook)

The most robust scoring pattern uses structured rubrics with explicit anchors:

```python
EVAL_PROMPT = """
You will be given a {output_type}. Your task is to rate it on
one metric.

Evaluation Criteria:
{criterion_name} ({score_min}-{score_max}) - {criterion_definition}

Evaluation Steps:
1. {step_1}
2. {step_2}
3. {step_3}

Score Anchors:
- {score_min}: {worst_description}
- {score_mid}: {mid_description}
- {score_max}: {best_description}

{output_type} to evaluate:
{content}

Evaluation Form (scores ONLY):
- {criterion_name}:
"""
```

**Concrete Rubric Example (Factual Consistency)**:

```
Evaluation Criteria:
Consistency (1-5) - The factual alignment between the response
and the source material. A factually consistent response contains
only statements that are entailed by the source.

Score Anchors:
- 1: The response contains multiple fabricated facts not in source
- 3: The response is mostly consistent with minor unsupported claims
- 5: All statements in the response are fully supported by source

Evaluation Steps:
1. Read the source material carefully, noting key facts
2. Read the response and identify every factual claim
3. For each claim, verify whether it is supported by the source
4. Count unsupported or contradicted claims
5. Assign a score based on the proportion of supported claims
```

### Known Biases and Mitigations

| Bias | Description | Mitigation |
|------|-------------|------------|
| **Position bias** | Favoring first/second response | Randomize order, evaluate both orderings |
| **Verbosity bias** | Preferring longer outputs | Explicitly instruct to ignore length |
| **Self-enhancement** | Favoring own outputs | Use different model as judge |
| **Anchoring** | First impression dominates | Use CoT before scoring |

### Implementation Pattern

```python
import json

def llm_judge(content, criteria, model="claude-sonnet-4-20250514"):
    """Score content on multiple criteria using LLM-as-judge."""
    scores = {}
    for criterion in criteria:
        prompt = build_eval_prompt(content, criterion)
        response = call_llm(
            model=model,
            prompt=prompt,
            temperature=0,      # Deterministic scoring
            max_tokens=512       # Room for CoT + score
        )
        scores[criterion["name"]] = parse_score(response)
    return scores

def pairwise_judge(response_a, response_b, question, model):
    """Compare two responses with position-bias mitigation."""
    # Evaluate in both orderings
    verdict_ab = judge_pair(question, response_a, response_b, model)
    verdict_ba = judge_pair(question, response_b, response_a, model)

    if verdict_ab == "A" and verdict_ba == "B":
        return "A_wins"  # Consistent: A is better
    elif verdict_ab == "B" and verdict_ba == "A":
        return "B_wins"  # Consistent: B is better
    else:
        return "tie"     # Inconsistent → tie
```

### AlpacaEval Pattern

AlpacaEval computes **length-controlled win rates** against a reference model:

- Compare each output against a baseline on identical instructions
- Ask evaluator LLM to rank paired outputs
- Average preferences across the evaluation set
- Apply length-debiasing regression to prevent gaming via verbosity
- Achieves 0.98 correlation with Chatbot Arena human rankings

Key config: randomize output order, cache annotations, use `temperature=0` for reproducibility.

---

## 4. Chain-of-Verification (CoVe)

**Paper**: Dhuliawala et al., "Chain-of-Verification Reduces Hallucination in Large Language Models" (2023)

### Four-Step Process

```
Step 1: DRAFT
  Model generates initial response to query

Step 2: PLAN VERIFICATION
  Model generates specific fact-checking questions
  about claims in its own draft

Step 3: EXECUTE VERIFICATION (independently!)
  Model answers each verification question WITHOUT
  seeing the original draft (prevents confirmation bias)

Step 4: FINAL VERIFIED RESPONSE
  Model produces corrected response incorporating
  verification results
```

### Implementation Pattern

```python
def chain_of_verification(query, model):
    # Step 1: Draft
    draft = model.generate(f"Answer this question: {query}")

    # Step 2: Plan verification questions
    verification_qs = model.generate(f"""
Given this draft response:
{draft}

Generate a list of specific, independently verifiable questions
that would help fact-check the claims made in this response.
Each question should target one specific claim.
""")

    # Step 3: Answer independently (KEY: no draft context)
    verified_answers = []
    for q in parse_questions(verification_qs):
        # Critical: answer WITHOUT the draft to avoid confirmation bias
        answer = model.generate(f"""
Answer this factual question concisely:
{q}
""")
        verified_answers.append((q, answer))

    # Step 4: Generate corrected response
    verification_context = "\n".join(
        f"Q: {q}\nVerified A: {a}" for q, a in verified_answers
    )

    final = model.generate(f"""
Original question: {query}
Draft response: {draft}

Fact-check results:
{verification_context}

Based on the verification results, produce a corrected final
response. Fix any claims that were contradicted by verification.
If a claim could not be verified, either remove it or note the
uncertainty.
""")
    return final
```

### Key Insight
The **independent verification** in Step 3 is critical. If the model sees its own draft while answering verification questions, it tends to confirm its original claims (confirmation bias). Isolation forces genuine fact-checking.

---

## 5. Self-Consistency Checking

**Paper**: Wang et al., "Self-Consistency Improves Chain of Thought Reasoning in Language Models" (2023)

### Core Mechanism

Instead of greedy decoding (single reasoning path), sample multiple diverse reasoning paths and take the majority vote on the final answer.

```
Query → Sample N reasoning paths (temperature > 0)
      → Extract answer from each path
      → Majority vote → Final answer
```

### Implementation

```python
def self_consistency(query, model, n_samples=10, temperature=0.7):
    """Sample multiple reasoning paths and take majority vote."""
    answers = []

    for _ in range(n_samples):
        response = model.generate(
            prompt=f"Let's think step by step.\n\n{query}",
            temperature=temperature
        )
        answer = extract_final_answer(response)
        answers.append(answer)

    # Majority vote
    from collections import Counter
    vote_counts = Counter(answers)
    best_answer = vote_counts.most_common(1)[0][0]
    confidence = vote_counts[best_answer] / n_samples

    return best_answer, confidence
```

### Advanced Variant: Complexity-Weighted Consistency

Take majority vote among only the **top-k most complex** reasoning chains (longer, more detailed reasoning tends to be more accurate):

```python
def complexity_weighted_consistency(query, model, n=20, k=10):
    paths = []
    for _ in range(n):
        response = model.generate(query, temperature=0.7)
        answer = extract_final_answer(response)
        complexity = len(response.split())  # Proxy for reasoning depth
        paths.append((response, answer, complexity))

    # Keep top-k most complex
    paths.sort(key=lambda x: x[2], reverse=True)
    top_k = paths[:k]

    # Vote among complex paths only
    answers = [p[1] for p in top_k]
    return Counter(answers).most_common(1)[0][0]
```

### Performance Gains
Demonstrated +17.9% on GSM8K, +11.0% on SVAMP, +12.2% on AQuA over standard CoT.

### Self-Consistency as Confidence Signal

The **agreement ratio** across samples serves as a natural confidence calibration metric:
- High agreement (>90%) → model is confident and likely correct
- Low agreement (<50%) → model is uncertain, flag for review or escalation

---

## 6. Multiagent Debate

**Paper**: Du et al., "Improving Factuality and Reasoning in Language Models through Multiagent Debate" (2023)

### Architecture

Multiple LLM instances each propose solutions, then iteratively critique and revise each other's responses over multiple rounds until convergence.

```
Round 1:
  Agent A → proposes answer + reasoning
  Agent B → proposes answer + reasoning
  Agent C → proposes answer + reasoning

Round 2:
  Agent A reads B's and C's answers → revises own answer
  Agent B reads A's and C's answers → revises own answer
  Agent C reads A's and B's answers → revises own answer

Round 3: (repeat until convergence or max rounds)
  ...

Final: Take majority vote or consensus answer
```

### Implementation Pattern

```python
def multiagent_debate(query, model, n_agents=3, max_rounds=3):
    """Run multi-agent debate for improved factuality."""

    # Round 1: Independent proposals
    responses = []
    for i in range(n_agents):
        resp = model.generate(
            f"Answer this question with detailed reasoning:\n{query}",
            temperature=0.7  # Diversity across agents
        )
        responses.append(resp)

    # Subsequent rounds: debate
    for round_num in range(1, max_rounds):
        new_responses = []
        for i in range(n_agents):
            other_responses = [r for j, r in enumerate(responses) if j != i]
            debate_prompt = f"""
These are solutions to the problem from other agents:

{chr(10).join(f'Agent {j+1}: {r}' for j, r in enumerate(other_responses))}

Using the reasoning from other agents as additional information,
can you provide your updated answer? Examine your solution and
that of other agents. If you identify errors in your previous
response, correct them. If you find errors in others' responses,
explain why they are wrong.

Original question: {query}
Your previous answer: {responses[i]}
"""
            new_resp = model.generate(debate_prompt, temperature=0.3)
            new_responses.append(new_resp)

        # Check convergence
        answers = [extract_answer(r) for r in new_responses]
        if len(set(answers)) == 1:
            return answers[0], round_num + 1  # Consensus reached

        responses = new_responses

    # No consensus: majority vote
    final_answers = [extract_answer(r) for r in responses]
    return Counter(final_answers).most_common(1)[0][0], max_rounds
```

### Key Insight
Debate reduces hallucinations because fabricated facts are unlikely to survive cross-examination by multiple independent reasoning paths. It is a **social epistemology** approach to AI reliability.

---

## 7. Calibration: When an Agent Knows What It Doesn't Know

**Paper**: Kadavath et al., "Language Models (Mostly) Know What They Know" (2022) — Anthropic

### P(True) Pattern

Ask the model to evaluate the probability that its own answer is correct:

```python
def calibrated_answer(query, model):
    # Generate candidate answer
    answer = model.generate(query)

    # Self-evaluate confidence
    confidence_prompt = f"""
Question: {query}
Proposed Answer: {answer}

How confident are you that the above answer is correct?
Respond with a probability between 0 and 1, where:
- 0.0 = certainly wrong
- 0.5 = uncertain / guessing
- 1.0 = certainly correct

Consider: Is this within your training data? Are there
ambiguities? Could you be confusing similar concepts?

Confidence: """

    p_true = float(model.generate(confidence_prompt, max_tokens=5))
    return answer, p_true
```

### Multi-Sample Calibration

Generate multiple candidate answers before evaluating — seeing the diversity (or lack thereof) in its own samples helps the model better estimate P(True):

```python
def multi_sample_calibration(query, model, n_samples=5):
    # Generate diverse candidates
    candidates = [
        model.generate(query, temperature=0.7)
        for _ in range(n_samples)
    ]

    # Let model see its own diversity
    eval_prompt = f"""
Question: {query}

I generated {n_samples} candidate answers:
{chr(10).join(f'{i+1}. {c}' for i, c in enumerate(candidates))}

Based on the agreement and quality of these candidates:
1. What is the best answer?
2. How confident am I? (0.0 to 1.0)
3. What am I uncertain about?
"""
    return model.generate(eval_prompt)
```

### Abstention Pattern

```python
CONFIDENCE_THRESHOLD = 0.7

def answer_with_abstention(query, model):
    answer, confidence = calibrated_answer(query, model)

    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "answer": answer,
            "confidence": confidence,
            "status": "low_confidence",
            "message": f"I'm only {confidence:.0%} confident. "
                       f"Consider verifying this independently."
        }
    return {"answer": answer, "confidence": confidence, "status": "confident"}
```

### Key Finding
Larger models are significantly better calibrated. The P(True) technique is cheap (one extra inference) and provides a usable uncertainty signal. However, P(IK) ("I know") predictions **do not generalize** well across task types — calibrate per-domain.

---

## 8. Self-RAG: Self-Reflective Retrieval-Augmented Generation

**Paper**: Asai et al., "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection" (2023)

### Reflection Token Architecture

Self-RAG trains the model to emit special **reflection tokens** inline during generation:

| Token | Purpose | Values |
|-------|---------|--------|
| `[Retrieve]` | Should I retrieve? | Yes / No / Continue |
| `[ISREL]` | Is retrieved passage relevant? | Relevant / Irrelevant |
| `[ISSUP]` | Is claim supported by passage? | Fully / Partially / No Support |
| `[ISUSE]` | Is response useful overall? | 1-5 scale |

### Generation Flow

```
Input query
  → [Retrieve] = Yes → fetch passages
    → For each passage: [ISREL] = Relevant?
      → Generate response segment
        → [ISSUP] = Supported by evidence?
        → [ISUSE] = Useful to user?
  → Select best segment based on reflection scores
```

### Key Insight
By making retrieval and critique **inline** (part of the generation itself rather than a separate pass), Self-RAG is faster and more controllable than post-hoc verification. The reflection tokens act as learned, task-adaptive quality gates.

---

## 9. Critical Counterpoint: Self-Correction Limitations

**Paper**: Huang et al., "Large Language Models Cannot Self-Correct Reasoning Yet" (2024, ICLR)

### Key Finding
> "LLMs struggle to self-correct their responses without external feedback, and at times, their performance even degrades after self-correction."

### What This Means for Implementation

- **Intrinsic self-correction** (model correcting itself with no external signal) is unreliable
- Self-correction works best when there is an **external feedback signal**: test results, retrieval verification, tool output, or human feedback
- Reflexion works because it has unit test results (external signal); CoVe works because it isolates verification (reducing confirmation bias)
- Simply asking "are you sure?" or "check your answer" without structure often **degrades** performance

### Design Principle
Always pair self-critique with one or more of:
1. **External verification** (tests, tools, retrieval)
2. **Structural isolation** (CoVe's independent verification)
3. **Multi-agent diversity** (debate across independent instances)
4. **Concrete criteria** (constitutional principles, rubrics)

Never rely on "just think harder" — it doesn't work.

---

## 10. Integrated Self-Evaluation Architecture

Combining the above patterns into a practical agent self-evaluation system:

```python
class SelfEvaluatingAgent:
    """
    Integrates multiple self-evaluation techniques into
    a unified agent loop.
    """

    def __init__(self, model, constitution, rubrics):
        self.model = model
        self.constitution = constitution  # List of principles
        self.rubrics = rubrics            # Scoring criteria
        self.reflection_memory = []       # Reflexion buffer

    def execute(self, task, max_attempts=3):
        for attempt in range(max_attempts):
            # 1. Generate with reflection context
            response = self.generate(task)

            # 2. Self-consistency check (cheap confidence)
            confidence = self.consistency_check(task, response)

            # 3. If confident, run CoVe for factuality
            if confidence > 0.7:
                response = self.chain_of_verification(task, response)

            # 4. Score against rubrics (LLM-as-judge)
            scores = self.evaluate(response)

            # 5. Constitutional critique
            critique = self.constitutional_critique(response)

            # 6. Check if good enough
            if scores["overall"] >= 4.0 and not critique["issues"]:
                return response

            # 7. Reflexion: reflect on failure
            reflection = self.reflect(task, response, scores, critique)
            self.reflection_memory.append(reflection)

        return self.best_response  # Return best attempt

    def consistency_check(self, task, response, n=5):
        """Quick confidence via self-consistency sampling."""
        alternatives = [
            self.model.generate(task, temperature=0.7)
            for _ in range(n)
        ]
        answers = [extract_answer(r) for r in [response] + alternatives]
        agreement = max(Counter(answers).values()) / len(answers)
        return agreement

    def chain_of_verification(self, task, draft):
        """CoVe with isolated verification."""
        # Generate verification questions
        questions = self.model.generate(
            f"What factual claims in this need checking?\n{draft}"
        )
        # Answer independently (no draft context!)
        verifications = [
            self.model.generate(f"Answer: {q}")
            for q in parse_questions(questions)
        ]
        # Revise if needed
        return self.model.generate(
            f"Revise based on verifications:\n"
            f"Draft: {draft}\nVerifications: {verifications}"
        )

    def constitutional_critique(self, response):
        """Critique against constitutional principles."""
        issues = []
        for principle in self.constitution:
            critique = self.model.generate(
                f"Does this response violate: '{principle}'?\n"
                f"Response: {response}\n"
                f"If yes, explain. If no, say PASS."
            )
            if "PASS" not in critique:
                issues.append({"principle": principle, "critique": critique})
        return {"issues": issues}

    def reflect(self, task, response, scores, critique):
        """Reflexion-style verbal reflection."""
        return self.model.generate(f"""
You attempted this task and received the following evaluation:

Task: {task}
Your response: {response}
Scores: {scores}
Critique: {critique}

Previous reflections: {self.reflection_memory}

Diagnose the root cause of any issues and propose a specific,
actionable strategy for your next attempt. Be concise.
""")
```

---

## 11. Scoring Rubric Design Principles

Based on the MT-Bench, G-Eval, and AlpacaEval patterns:

### Rubric Construction Checklist

1. **Single dimension per criterion** — never mix "accuracy and helpfulness" into one score
2. **Explicit anchors** for each score level (1, 3, 5 at minimum)
3. **Procedural steps** before scoring — forces CoT reasoning
4. **Binary output format** (e.g., `[[4]]`) for reliable parsing
5. **Separate rubrics for separate concerns** — factuality vs style vs completeness

### Template for Custom Criteria

```yaml
criterion:
  name: "Factual Accuracy"
  definition: >
    The degree to which all claims in the response are
    verifiable and consistent with established knowledge.
  scale: 1-5
  anchors:
    1: "Multiple fabricated or contradicted claims"
    2: "Several unsupported claims mixed with accurate ones"
    3: "Mostly accurate with minor unverifiable claims"
    4: "Accurate with at most one uncertain claim noted"
    5: "All claims verifiable and correctly stated"
  steps:
    - "Identify every factual claim in the response"
    - "For each claim, assess if it is verifiable"
    - "Check for internal contradictions"
    - "Assign score based on proportion of accurate claims"
```

---

## 12. Hallucination Detection Patterns

### Pattern 1: Claim Decomposition + Verification

```python
def detect_hallucinations(response, source_context, model):
    # Decompose into atomic claims
    claims = model.generate(f"""
Break this response into individual factual claims.
Each claim should be a single, verifiable statement.

Response: {response}

Claims (one per line):
""")

    # Verify each claim
    results = []
    for claim in claims.split("\n"):
        verdict = model.generate(f"""
Based ONLY on the following context, is this claim supported?

Context: {source_context}
Claim: {claim}

Answer: SUPPORTED / NOT SUPPORTED / UNVERIFIABLE
Explanation:
""")
        results.append({"claim": claim, "verdict": verdict})

    return results
```

### Pattern 2: Cross-Examination (Multi-Turn)

An evaluator LLM interrogates the generator about its claims:

```python
def cross_examine(response, model, max_questions=3):
    """Multi-turn cross-examination for factual consistency."""
    history = [f"Original response: {response}"]

    for _ in range(max_questions):
        question = model.generate(f"""
You are a skeptical fact-checker. Based on the conversation:
{chr(10).join(history)}

Ask ONE probing question about the most suspicious or
unverifiable claim. If all claims seem solid, say DONE.
""")
        if "DONE" in question:
            break

        answer = model.generate(f"""
You previously stated: {response}
A fact-checker asks: {question}
Provide a detailed, honest answer. If you're unsure, say so.
""")
        history.extend([f"Examiner: {question}", f"Response: {answer}"])

    # Final judgment
    return model.generate(f"""
Based on this cross-examination:
{chr(10).join(history)}

Rate the factual reliability of the original response (1-5)
and list any claims that appear unreliable.
""")
```

Research shows cross-examination achieves 0.75-0.84 recall and 0.82-0.87 precision at detecting errors.

---

## 13. Production Considerations

### Cost-Performance Tradeoffs

| Technique | Extra LLM Calls | Latency | Reliability Gain |
|-----------|-----------------|---------|------------------|
| Self-Consistency (n=5) | 5x | 1x (parallel) | High for reasoning |
| CoVe | 3-5x | 3-5x (sequential) | High for factuality |
| Constitutional Critique | 1x per principle | Nx (parallelizable) | High for safety |
| LLM-as-Judge | 1x per criterion | Nx (parallelizable) | Medium (biased) |
| Multiagent Debate | 3x per round | 2-3 rounds | High for factuality |
| Reflexion | 2-5 full attempts | 2-5x | Very high (with external signal) |

### Panel-Based Evaluation (Budget Alternative)

Use multiple smaller models as a panel of judges instead of one large model:
- 7x cost reduction vs single GPT-4 judge
- Sometimes exceeds single-model performance through diversity
- Aggregate via majority vote across panel members

### When to Use What

- **Quick confidence check** → Self-consistency (cheap, parallelizable)
- **Factual accuracy** → CoVe or cross-examination
- **Safety/alignment** → Constitutional critique
- **Quality scoring** → LLM-as-judge with rubrics
- **Complex reasoning** → Reflexion with external test signals
- **High-stakes output** → Multiagent debate + CoVe

---

## Related Notes

- [[Self-Critique and Auto-Evolution Design]] — Design patterns for self-evolving agents
- [[Agent Evaluation Frameworks]] — Broader evaluation infrastructure
- [[Metaprompting and Dynamic Agent Architecture]] — Dynamic prompt construction
- [[Self-Organizing Agent Architectures]] — [[Multi-agent coordination patterns]]
- [[Multi-Agent Architecture Evaluation]] — Evaluating multi-agent systems

## Sources

1. Bai et al. (2022). "Constitutional AI: Harmlessness from AI Feedback." arXiv:2212.08073
2. Shinn et al. (2023). "Reflexion: Language Agents with Verbal Reinforcement Learning." arXiv:2303.11366
3. Zheng et al. (2023). "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena." arXiv:2306.05685
4. Dhuliawala et al. (2023). "Chain-of-Verification Reduces Hallucination in LLMs." arXiv:2309.11495
5. Wang et al. (2023). "Self-Consistency Improves Chain of Thought Reasoning." arXiv:2203.11171
6. Du et al. (2023). "Improving Factuality and Reasoning through Multiagent Debate." arXiv:2305.14325
7. Kadavath et al. (2022). "Language Models (Mostly) Know What They Know." arXiv:2207.05221
8. Asai et al. (2023). "Self-RAG: Learning to Retrieve, Generate, and Critique." arXiv:2310.11511
9. Huang et al. (2024). "Large Language Models Cannot Self-Correct Reasoning Yet." arXiv:2310.01798
10. Li et al. (2023). "AlpacaEval: An Automatic Evaluator of Instruction-following Models." GitHub
11. Eugene Yan (2024). "LLM-as-Judge." eugeneyan.com
12. OpenAI Cookbook. "How to Evaluate Abstractive Summarization."
13. Noahshinn. "Reflexion." GitHub repository
