---
tags: [prompt-engineering, claude-code, toolkit, agents, plugins, comprehensive-collection]
summary: "⭐ **Most Comprehensive Toolkit** — The most comprehensive toolkit for Claude Code -- 135 agents, 35 curated skills (+15,000 via SkillKit), 42 com"
source: https://github.com/rohitg00/awesome-claude-code-toolkit
category: Comprehensive Toolkit
date: 2026-03-16
status: active
confidence: 0.80
confidence_updated: 2026-03-18
stars: Massive (135 agents, 121 plugins, 42 commands)
type: reference
updated: 2026-03-16
created: 2026-03-16
title: "rohitg00-awesome-claude-code-toolkit"
---

# rohitg00/awesome-claude-code-toolkit

⭐ **Most Comprehensive Toolkit** — "The most comprehensive toolkit for Claude Code -- 135 agents, 35 curated skills (+15,000 via SkillKit), 42 commands, 120 plugins, 19 hooks, 15 rules, 7 templates, 6 MCP configs, and more."

## Overview

A massive, production-ready collection organized into ten specialized agent categories. Features one-command installation and extensive domain coverage from core development to specialized industries.

### Scale & Scope
- **135 Specialized Agents** across 10 categories
- **121 Production-Ready Plugins** with domain-specific capabilities
- **42 Slash Commands** organized into 8 functional groups
- **35 Curated Skills** + access to 15,000 via SkillKit marketplace
- **19 Hooks** for lifecycle automation
- **6 MCP Configs** for extended capabilities

## Agent Roster by Category

### 1. Core Development (13 agents)
- **Fullstack Engineer** — End-to-end feature delivery
- **API Designer** — RESTful design, OpenAPI, versioning
- **Frontend Architect** — Component architecture, state management
- **Backend Developer** — Node.js/Express/Fastify services
- **GraphQL Architect** — Schema design, resolvers, federation
- **Microservices Architect** — Distributed systems, event-driven patterns
- **WebSocket Engineer** — Real-time communication, Socket.io
- **UI Designer** — Design systems, Figma-to-code
- **Electron Developer** — Desktop apps, IPC, native integration
- **API Gateway Engineer** — Rate limiting, auth proxies
- **Monorepo Architect** — Turborepo/Nx strategies
- **Event-Driven Architect** — Event sourcing, CQRS, message queues

### 2. Language Experts (24 agents)
Framework and language specialists covering:
- **Modern Stack**: TypeScript, Next.js, React, Vue, Svelte, Angular
- **Backend**: Python, Django, Rails, Java Spring Boot, Kotlin, C#/.NET
- **Systems**: Rust, Go, Zig, C++
- **Functional**: Haskell, Clojure, OCaml, Elixir
- **Mobile**: Flutter, Swift, Kotlin Multiplatform
- **Specialized**: PHP Laravel, Scala Akka, Nim, Lua

### 3. Infrastructure (11 agents)
- **Cloud Architect** — AWS, GCP, Azure provisioning
- **DevOps Engineer** — CI/CD, containerization, monitoring
- **Kubernetes Specialist** — Operators, CRDs, service mesh
- **Terraform Engineer** — IaC, multi-cloud, state management
- **Database Admin** — Schema design, query tuning
- **Network Engineer** — DNS, load balancers, CDN
- **SRE Engineer** — SLOs, error budgets, incident response
- **Security Engineer** — IAM, mTLS, secrets management
- **Platform Engineer** — Internal developer platforms
- **Deployment Engineer** — Blue-green, canary releases
- **Incident Responder** — Triage, runbooks, communication

### 4. Quality Assurance (10 agents)
- **Code Reviewer** — PR review with security focus
- **Test Architect** — Test strategy, pyramid, coverage
- **Security Auditor** — Vulnerability scanning, OWASP
- **Performance Engineer** — Load testing, profiling
- **Accessibility Specialist** — WCAG compliance, ARIA
- **Chaos Engineer** — Fault injection, resilience
- **Penetration Tester** — OWASP Top 10 assessment
- **QA Automation** — Test frameworks, CI integration
- **Compliance Auditor** — SOC 2, GDPR, HIPAA
- **Error Detective** — Stack trace analysis, root cause

### 5. Data & AI (15 agents)
- **AI Engineer** — RAG, agent integration
- **ML Engineer** — Pipelines, training, evaluation
- **Data Scientist** — Statistical analysis, visualization
- **Data Engineer** — ETL, Spark, warehousing
- **LLM Architect** — Fine-tuning, model serving
- **Prompt Engineer** — Optimization, structured outputs
- **MLOps Engineer** — Model serving, monitoring
- **NLP Engineer** — Embeddings, classification
- **Computer Vision** — PyTorch, object detection
- **Database Optimizer** — Query optimization, indexing
- **Vector DB Engineer** — FAISS, Pinecone, Qdrant
- **Data Visualization** — D3.js, Plotly dashboards
- **Recommendation Engine** — Collaborative filtering
- **Feature Engineer** — Feature stores, encoding
- **ETL Specialist** — Data quality, schema evolution

## Production Plugins (121 total)

### Standout Examples
- **aws-cost-saver** — 173 automated checks, 60% cost reduction results
- **api-architect** — OpenAPI spec generation, testing
- **bug-detective** — Root cause analysis, execution tracing
- **security-guidance** — Vulnerability detection and fixes
- **deploy-pilot** — Dockerfile generation, CI/CD pipelines
- **performance-monitor** — API benchmarking, bottleneck identification
- **test-writer** — Comprehensive test generation with coverage
- **docker-helper** — Optimized image builds, best practices

### Installation Methods
```bash
# Plugin marketplace (recommended)
/plugin marketplace add rohitg00/awesome-claude-code-toolkit

# Manual clone
git clone https://github.com/rohitg00/awesome-claude-code-toolkit.git ~/.claude/plugins/claude-code-toolkit

# One-liner
curl -fsSL https://raw.githubusercontent.com/rohitg00/awesome-claude-code-toolkit/main/setup/install.sh | bash
```

## Skills Architecture (35 + 15,000)

### Included Skills (35)
- **TDD Mastery** — Red-green-refactor patterns
- **API Design Patterns** — RESTful conventions, versioning
- **Database Optimization** — Query planning, N+1 prevention
- **Security [[Hardening]]** — Input validation, secrets management
- **DevOps Automation** — Infrastructure as code, GitOps
- **React Patterns** — Hooks, server components, suspense
- **Python Best Practices** — Type hints, async patterns
- **GraphQL Design** — Schema, DataLoader, subscriptions
- **Kubernetes Operations** — Deployments, Helm, troubleshooting
- **TypeScript Advanced** — Generics, conditional types

### SkillKit Integration
```bash
# Launch interactive marketplace
npx skillkit@latest

# Search 15,000+ skills
npx skillkit@latest search "react"

# AI-powered recommendations
npx skillkit@latest recommend
```

## Command Library (42 commands)

### Git Workflow Commands
- `/commit` — Conventional commit generation
- `/pr-create` — PR with summary and test plan
- `/changelog` — Generate from commit history
- `/release` — Tagged release with auto-notes
- `/worktree` — Git worktrees for parallel development

### Code Analysis Commands
- `/optimize` — Performance bottleneck analysis
- `/code_analysis` — Advanced inspection menu
- `/check` — Comprehensive quality and security checks
- `/repro-issue` — Reproducible test case creation

### Testing Commands
- `/tdd` — Test-driven development workflow
- `/unit-test-generator` — Comprehensive test creation
- `/e2e-runner` — End-to-end test execution

## Agent Orchestration Patterns

### Task Coordination
- **Task Coordinator** — Routes work between agents
- **Context Manager** — Compression and session summaries
- **Workflow Director** — Multi-agent pipeline orchestration
- **Knowledge Synthesizer** — Information compression, knowledge graphs
- **Multi-Agent Coordinator** — Parallel execution, output merging

### Error Handling
- **Error Coordinator** — Multi-agent workflow error management
- **Performance Monitor** — Token usage tracking, response quality

## Specialized Domain Coverage

### Blockchain & Fintech
- **Blockchain Developer** — Smart contracts, Solidity, Web3
- **Fintech Engineer** — Financial systems, compliance
- **Payment Integration** — Stripe, PCI DSS, 3D Secure

### Healthcare & Education
- **Healthcare Engineer** — HIPAA, HL7 FHIR, medical data
- **Education Tech** — LMS, SCORM/xAPI, adaptive learning

### Media & Gaming
- **Game Developer** — Game logic, ECS, state machines
- **Media Streaming** — HLS/DASH, transcoding, CDN
- **Voice Assistant** — STT, TTS, dialog management

### Emerging Technologies
- **IoT Engineer** — MQTT, edge computing, digital twins
- **Robotics Engineer** — ROS2, sensor fusion, SLAM
- **Geospatial Engineer** — PostGIS, spatial queries, mapping

## Business & Product Agents (12)

- **Product Manager** — PRDs, RICE prioritization
- **Technical Writer** — Documentation, style guides
- **UX Researcher** — Usability testing, surveys
- **Project Manager** — Sprint planning, Agile
- **Scrum Master** — Ceremonies, velocity tracking
- **Business Analyst** — Requirements, process mapping
- **Growth Engineer** — A/B testing, funnel optimization
- **Sales Engineer** — Technical demos, POCs
- **Customer Success** — Ticket triage, health scoring
- **Legal Advisor** — ToS, privacy policies
- **Marketing Analyst** — Campaign analysis, ROI
- **Content Strategist** — SEO content, editorial calendars

## Integration Strategies

### For Our System

#### 1. Agent Template Extraction
```markdown
# Role Templates to Adapt
- Fullstack Engineer → Our Coder agent enhancement
- Security Auditor → Our Security agent patterns
- Performance Engineer → Ops agent capabilities
- Task Coordinator → Orchestrator patterns
```

#### 2. Plugin Architecture
- **Modular Design** — Domain-specific capabilities
- **One-Command Install** — Streamlined setup
- **Configuration Templates** — Pre-built workflows
- **Hook Integration** — Lifecycle automation

#### 3. Skill Marketplace Model
- **Local Curated Skills** (35) + **External Marketplace** (15,000)
- **AI-Powered Recommendations** based on project context
- **Cross-Agent Compatibility** — Works with 32+ AI agents

## Key Patterns to Adopt

### 1. Agent Specialization Matrix
```
Domain × Role × Technology = Specialized Agent
Examples:
- Frontend × Architect × React = React Specialist
- Data × Engineer × Python = ML Engineer
- Infrastructure × Operations × Kubernetes = K8s Specialist
```

### 2. Progressive Capability Loading
```bash
# Core agents (always available)
main, researcher, coder, ops

# Specialized agents (on-demand)
security, vault-keeper, browser-automation

# Domain experts (project-specific)
frontend-architect, ml-engineer, devops-specialist
```

### 3. Command Organization
```
Category-based command grouping:
- git/ → Version control commands
- analysis/ → Code inspection commands  
- testing/ → Test-related commands
- deploy/ → Deployment commands
- context/ → Context loading commands
```

## Production Readiness Score: 9/10

**Strengths**: 
- Massive scale and comprehensive coverage
- Production-tested across multiple domains
- Excellent organization and documentation
- One-command installation
- Active marketplace integration

**Considerations**:
- Scope can be overwhelming for smaller teams
- Need careful selection for specific use cases
- Potential conflicts between overlapping agents

**Recommendation**: 
Extract core patterns and specialized agents most relevant to our workflows. Use as inspiration for agent categorization and capability matrix design.
## Related

- [[Awesome AI System Prompts]]
- [[Claude Code Test Integrity]]
- [[README]]
