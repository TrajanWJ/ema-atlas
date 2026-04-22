---
tags:
  - prompt-engineering
  - qa
  - testing
  - automation
summary: >-
  A comprehensive collection of 100+ AI prompts for Quality Assurance workflows
  across manual testing, automation, and AI-assisted testing.
source: 'https://github.com/tayyabakmal1/qa-prompt-library'
category: QA Testing Prompts
date: 2026-03-14T00:00:00.000Z
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
type: knowledge
updated: '2026-03-16'
created: '2026-03-14'
title: QA Prompt Library
wiki_id: reference/Prompt_Engineering/QA_Prompt_Library
imported_from: vault/Reference/Prompt Engineering/QA Prompt Library.md
imported_at: '2026-04-04T00:23:56.933Z'
---

# QA Prompt Library

A comprehensive collection of 100+ AI prompts for Quality Assurance workflows across manual testing, automation, and AI-assisted testing.

## Structure

### Manual QA
- **Test Case Creation** - Functional, regression, edge case test scenarios
- **Bug Reporting** - Defect descriptions, reproduction steps, root cause analysis
- **Test Planning** - Test plans, strategies, risk analysis
- **Checklists** - UI, API, mobile testing checklists
- **Exploratory Testing** - AI-guided exploratory strategies
- **Usability Testing** - UX evaluation and user testing

### Automation QA
- **Web Automation** - [[QA Prompts - Playwright|Playwright]], Selenium, Cypress
- **API Testing** - REST Assured, Postman, Newman, beginner to advanced
- **Contract Testing** - Pact, Spring Cloud Contract
- **Load Testing** - JMeter, Gatling, K6
- **Security Testing** - [[QA Prompts - Security Testing|OWASP Top 10]], penetration testing
- **Accessibility Testing** - WCAG compliance
- **Database Testing** - SQL, NoSQL validation
- **Cloud Testing** - AWS, Azure, GCP
- **CI/CD** - Jenkins, GitHub Actions, GitLab CI
- **Framework Design** - Architecture and design patterns
- **Parallel Execution** - TestNG, Selenium Grid

### AI-Assisted QA
- Test data generation with AI
- AI-powered risk assessment and prediction
- Self-healing locators and auto-refactoring
- ML-based intelligent test selection
- Defect prediction models and code quality metrics

### Mobile Testing
- App lifecycle, permissions, gestures, network conditions
- Appium automation
- iOS and Android cross-platform strategies

### Cursor AI Roles (Agent Personas)
Ready-to-use expert agent personas for IDE integration:
- **Web**: **Playwright**, **Selenium**, **Cypress**
- **Mobile**: Appium, mobile testing, mobile performance
- **Frameworks**: TestNG, JUnit, pytest
- **API**: REST Assured, Karate DSL, GraphQL
- **Design Patterns**: POM, BDD, data-driven, framework design
- **Specialized**: **Security**, performance, accessibility
- **Infrastructure**: Docker, Kubernetes

## Key Patterns

### Prompt Template Structure
Every prompt follows a standard template:
1. **Context** - Application name, technology stack
2. **Placeholders** - `[APPLICATION_NAME]`, `[LIST_ROLES]`, etc.
3. **Test Scenarios** - Numbered, hierarchical test cases
4. **Expected Outputs** - Automated scripts, checklists, recommendations

### Role Template Structure
Agent personas follow:
1. **Role Overview** - Expert identity and specialization
2. **Core Competencies** - Technical skills and advanced features
3. **Responsibilities** - Specific tasks organized by category
4. **Code Examples** - Production-ready examples with best practices
5. **Problem-Solving Approach** - Decision-making framework
6. **Key Principles** - Guiding values

## Relevance to Our Stack
- Playwright prompts directly applicable to web testing
- Security testing prompts for [[Hardening]] applications
- CI/CD integration patterns for GitHub Actions
- Agent persona templates reusable as Claude Code skill definitions

## Related Notes
- [[QA Prompts - Playwright]]
- [[QA Prompts - Security Testing]]
- **8 Core Principles of Agentic Prompts**
- [[Brex Prompt Engineering Guide]]
- [[README]]
