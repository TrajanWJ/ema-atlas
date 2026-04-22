# Plan: EMA v1.1 Track F Productivity Spec

**Generated**: 2026-04-13 UTC
**Estimated Complexity**: High

## Overview
This document defines three deliverables for EMA v1.1 Track F:
1. PRD-style product specification
2. Database/schema draft
3. Component map + interaction flows

The product focus is a humane execution layer that turns captures, conversations, notes, and meetings into a realistic Today plan with focus protection, obligation tracking, and clean follow-through.

## Assumptions
- Primary surface is a personal productivity experience, not multi-user project management.
- Core differentiator is obligation/commitment tracking plus conversation-to-work extraction.
- The system should support modular “tiny utility vApps” built on shared primitives rather than separate data silos.
- AI assistance should accelerate triage/extraction, not replace user agency.

## Sprint 1: Product Definition
**Goal**: Lock the product stance, user jobs, and surface model.
**Demo/Validation**:
- A written PRD exists and can be reviewed end-to-end.
- The core jobs-to-be-done and non-goals are explicit.

### Task 1.1: Define product thesis
- **Location**: This file
- **Description**: Document the wedge, core user problems, and product principles.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Product thesis is one sentence and specific.
  - Differentiators vs generic tasks/notes/calendar apps are explicit.
- **Validation**:
  - Review for clarity and scope discipline.

### Task 1.2: Define user journeys
- **Location**: This file
- **Description**: Specify morning planning, in-flow capture, meeting aftermath, follow-up management, and shutdown rituals.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Each core workflow has trigger, steps, and success outcome.
- **Validation**:
  - Verify every feature maps to a real workflow.

## Sprint 2: Data Model
**Goal**: Establish canonical entities and relationships.
**Demo/Validation**:
- Schema draft covers captures, tasks, notes, journal, schedule, blocks, people, projects, commitments, and conversation lineage.
- Entity boundaries are clean and non-overlapping.

### Task 2.1: Define canonical entities
- **Location**: This file
- **Description**: Draft tables/interfaces for CaptureItem, Task, Note, JournalEntry, CalendarItem, WorkBlock, Person, Project, Area, Commitment, ConversationRef, and DailyPlan.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Each entity has purpose, required fields, optional fields, and lifecycle states.
- **Validation**:
  - Check that main workflows can be represented without hacks.

### Task 2.2: Define relationships and derived views
- **Location**: This file
- **Description**: Document links, indexes, and computed surfaces such as Today, Waiting On, Open Loops, and Responsibility Tracker.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Derived views are computable from canonical objects.
- **Validation**:
  - Walk through sample scenarios.

## Sprint 3: UI Architecture
**Goal**: Define screen system and interaction contracts.
**Demo/Validation**:
- Component map and interaction flows exist for Today, Inbox, Tasks, Notes, Journal, Schedule, Meeting Output, Responsibility Tracker, and Shutdown.

### Task 3.1: Define screen layouts
- **Location**: This file
- **Description**: Describe each main screen, the key panels, and the minimal interactions.
- **Dependencies**: Sprint 2
- **Acceptance Criteria**:
  - Each screen has a clear purpose and no major overlap.
- **Validation**:
  - Review against core user journeys.

### Task 3.2: Define cross-screen interactions
- **Location**: This file
- **Description**: Specify how capture turns into work, how meetings turn into commitments, and how shutdown seeds the next day.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Primary user loops are explicit and testable.
- **Validation**:
  - Simulate at least five end-to-end flows.

## Sprint 4: MVP Plan
**Goal**: Sequence implementation into testable increments.
**Demo/Validation**:
- A phased MVP plan exists with exit criteria.
- Early increments produce daily-use value.

### Task 4.1: Define MVP slice
- **Location**: This file
- **Description**: Identify what must ship first versus what is deferred.
- **Dependencies**: Sprints 1-3
- **Acceptance Criteria**:
  - First release delivers real user value with minimal scope.
- **Validation**:
  - Confirm a user can run a day from the MVP.

### Task 4.2: Define vApp sequence
- **Location**: This file
- **Description**: Prioritize Brain Dump Distiller, Meeting → Work Extractor, Responsibility Tracker, Shutdown Ritual, Orphaned Commitment Finder, and Reconnect Helper.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - Each vApp builds on shared primitives.
- **Validation**:
  - Confirm no parallel silo data model is introduced.

## Testing Strategy
- Validate each workflow via scenario walkthroughs.
- Ensure every AI-generated suggestion is reviewable and reversible.
- Check that the Today surface remains useful under overload.
- Verify that tasks, notes, schedule, and commitments stay linked to source context.
- Test edge cases: ambiguous captures, duplicate tasks, stale commitments, missed blocks, meeting transcripts with no clear action items.

## Potential Risks & Gotchas
- Scope creep into a general “life OS”.
- Over-modeling projects/areas/tags before capture and Today are excellent.
- AI overreach causing incorrect commitments or dates.
- Duplicate objects from repeated extraction.
- Calendar/task coupling becoming rigid or annoying.
- Privacy concerns if journal/reflection is mixed with shared/work contexts.

## Rollback Plan
- If schema proves too complex, collapse to: CaptureItem, Task, Note, CalendarItem, WorkBlock, Commitment, ConversationRef.
- If AI extraction is noisy, ship manual triage first and reintroduce AI as suggestions only.
- If Today becomes overloaded, reduce to Now + Timeline + Must/Should/Want + Open Loops + Daily Note.
