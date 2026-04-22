---
title: Self-Critique and Auto-Evolution Design
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - evolution
  - knowledge
  - ops
  - prompts
  - research
  - security
summary: '```javascript'
wiki_id: research/Self-Critique_and_Auto-Evolution_Design
imported_from: vault/Research/Self-Critique and Auto-Evolution Design.md
imported_at: '2026-04-04T00:23:57.109Z'
---
# Self-Critique and Auto-Evolution Design

**Date:** 2026-03-16  
**Designed by:** 🔬 Researcher  
**For Implementation by:** 💻 Coder  
**Target:** Right Hand agent enhancement  

---

## 1. Self-Critique Loop Implementation

### Trigger Detection
```javascript
const needsCritique = (context) => {
  return context.hasAny([
    'research deliverable',     // Research findings, evaluations
    'decision recommendation',  // Choose A vs B, strategic advice
    'project planning',        // Multi-step workflows, timelines  
    'delegation briefing',     // Agent spawning with complex tasks
    'external communication',  // Emails, formal messages
    'system changes',          // Config updates, infrastructure
    'vault writes'            // Knowledge additions
  ]) && !context.isCasualChat;
};
```

### Critique Dimensions & Scoring
```javascript
const critiqueScores = {
  accuracy: evaluateAccuracy(response),      // 0-100: No hallucinations, facts check out
  completeness: evaluateCompleteness(response), // 0-100: Nothing important missing
  actionability: evaluateActionability(response), // 0-100: Clear next steps, not vague
  tone: evaluateTone(response),             // 0-100: Matches Trajan's preferred style
  relevance: evaluateRelevance(response, context) // 0-100: Actually answers what was asked
};
```

### Confidence Gate Logic
```javascript
const confidence = (scores) => {
  const weighted = (scores.accuracy * 0.3) + (scores.completeness * 0.25) + 
                   (scores.actionability * 0.25) + (scores.tone * 0.1) + 
                   (scores.relevance * 0.1);
  
  if (weighted >= 90) return 'send_direct';
  if (weighted >= 75) return 'send_with_caveats'; 
  if (weighted >= 60) return 'refine_once';
  return 'ask_clarification';
};
```

### Implementation Path
- Add `self_critique()` function to Right Hand's response pipeline
- Critique runs AFTER response generation, BEFORE Discord formatting
- Store critique metrics in `memory/self-critique-YYYY-MM-DD.jsonl`
- Surface low-confidence decisions: "I'm 68% confident about this recommendation..."

---

## 2. SOUL.md Auto-Evolution Implementation

### Signal Detection & Tracking
```javascript
// Track in vault/System/Evolution Signals.jsonl
const evolutionSignals = [
  {
    timestamp: '2026-03-16T10:30:00Z',
    type: 'preference_correction',
    signal: 'Trajan said "less verbose" after 3-paragraph response',
    category: 'response_length',
    file_target: 'SOUL.md',
    confidence: 0.85
  },
  {
    timestamp: '2026-03-16T10:32:00Z', 
    type: 'routing_pattern',
    signal: 'Always spawns Security after Ops for infra tasks',
    category: 'delegation_sequence',
    file_target: 'AGENTS.md',
    confidence: 0.92
  }
];
```

### Three-Signal Evolution Engine
```javascript
const evolutionCycle = () => {
  const signals = readUnprocessedSignals();
  const clusters = groupByCategory(signals);
  
  clusters.forEach(cluster => {
    if (cluster.length >= 3 && cluster.avgConfidence > 0.8) {
      const change = generatePromptChange(cluster);
      const file = determineTargetFile(cluster.category);
      
      if (validateSafetyRails(change, file)) {
        applyEvolution(file, change);
        markSignalsProcessed(cluster);
        logEvolution(file, change, cluster);
      }
    }
  });
};
```

### Version Control & Safety Rails
```yaml
# Frontmatter versioning
---
version: "2026-03-16-03"  # Date + increment
evolved_from: "2026-03-16-02"
changelog: |
  - v03: Reduced response verbosity based on 3x user feedback
  - v02: Added proactive project suggestions  
  - v01: Initial version
safety_hash: "a1b2c3..."  # Content hash to detect drift
---
```

### Safety Constraints
- Never delete existing content, only add or modify
- All changes append to `## Changelog` section
- Maximum 1 evolution per file per day
- Rollback capability via git + safety hash validation
- Human notification when major files (SOUL.md, AGENTS.md) evolve

---

## 3. Usage Pattern Analysis Implementation

### Metrics Collection
```javascript
// Log to vault/System/Usage Patterns.jsonl
const usageMetrics = {
  commands: trackCommandFrequency(),     // "research X" appears 15x this week
  corrections: trackCorrectionRate(),    // Trajan corrects 8% of Research outputs  
  timing: trackTimePatterns(),           // 90% of activity between 9am-6pm EST
  domains: trackDomainDistribution(),    // 40% code, 30% research, 20% ops, 10% security
  delegation: trackDelegationPatterns(), // Security always follows Ops for infra
  tokens: trackTokenEfficiency(),        // Avg 2.3k tokens per successful task
  satisfaction: inferSatisfactionScore() // Based on follow-ups and corrections
};
```

### Behavior Driver Rules  
```javascript
const behaviorDrivers = {
  // Command frequency → proactive suggestions
  proactiveSuggestions: (patterns) => {
    if (patterns.commands['check system health'] > 5) {
      suggest('Set up daily health monitoring cron job?');
    }
    if (patterns.timing.peak_hours.includes(currentHour())) {
      prioritizeResponseSpeed();
    }
  },
  
  // Correction frequency → self-improvement
  selfImprovement: (patterns) => {
    const highErrorAgent = findHighestCorrectionRate(patterns.corrections);
    if (highErrorAgent.rate > 0.15) {
      schedulePromptReview(highErrorAgent);
    }
  },
  
  // Domain distribution → model allocation  
  modelAllocation: (patterns) => {
    const busyAgents = findHighVolumeAgents(patterns.domains);
    busyAgents.forEach(agent => allocateFasterModel(agent));
  }
};
```

### Proactive Intelligence
- **Time-based:** "It's 2pm EST, you usually check system health now"
- **Pattern-based:** "You've researched 5 AI papers this week, should I compile a summary?"
- **Load-based:** "Coder is handling 60% of tasks lately, should I spawn a second instance?"
- **Learning-based:** "You always follow Security audits with Ops [[Hardening]] - should I queue both?"

---

## Implementation Files

**Coder should create:**
1. `src/self-critique/critique-engine.js` - Core critique logic
2. `src/evolution/signal-tracker.js` - Signal detection and clustering  
3. `src/evolution/prompt-evolver.js` - Safe prompt modification
4. `src/patterns/usage-analytics.js` - Metrics collection and analysis
5. `src/patterns/behavior-drivers.js` - Proactive suggestion system
6. `protocols/evolution-safety.md` - Safety rails documentation

**Integration points:**
- Hook into Right Hand's response pipeline before Discord formatting
- Add evolution cycle to existing heartbeat system (daily execution)
- Integrate with existing vault structure and QMD indexing

**Success metrics:**
- Critique confidence scores trending upward over time
- Prompt evolution events correlating with reduced correction rates
- Proactive suggestions showing >70% acceptance rate

---

*Under 600 words. Ready for implementation.*
## Related

- [[Claude Agent SDK Migration]]
- [[Claude Code Internals Study]]
- [[Hermes Agent]]
- [[-]]
- [[NousResearch]]
- [[LangChain-Deep-Agents]]
- [[README]]
