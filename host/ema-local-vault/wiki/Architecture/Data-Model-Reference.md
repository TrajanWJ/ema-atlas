---
title: "Data Model Reference"
space: wiki
tags: ["architecture", "data-model", "ecto", "sqlite", "reference"]
source: manual
---

# Data Model Reference

**Status:** 115 Ecto schema files, 114 unique tables, 116 migrations defined in code.
**DB:** `~/.local/share/ema/ema.db` (SQLite via ecto_sqlite3). Currently empty — will auto-migrate on boot via `mix ecto.migrate`.
**Last verified:** 2026-04-07

## Schemas by Context

### Core

#### Intents (`Ema.Intents`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `intents` | `Intent` | id, slug, title, description, status, parent_id, project_id, source, embedding |
| `intent_links` | `IntentLink` | id, source_id, target_id, link_type, metadata |
| `intent_events` | `IntentEvent` | id, intent_id, event_type, data |

#### Executions (`Ema.Executions`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `executions` | `Execution` | id, title, intent_slug, project_slug, status, mode, agent, metadata, started_at, completed_at |
| `execution_events` | `Event` | id, execution_id, event_type, data |
| `agent_sessions` | `AgentSession` | id, execution_id, agent_id, status |

#### Proposals (`Ema.Proposals`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `proposals` | `Proposal` | id, title, summary, status, confidence, pipeline_stage, quality_score, project_id |
| `proposal_seeds` | `Seed` | id, title, description, schedule, active, project_id |
| `proposal_tags` | `ProposalTag` | id, proposal_id, tag |

#### Tasks (`Ema.Tasks`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `tasks` | `Task` | id, title, status, priority, effort, due_date, agent, actor_id, project_id |
| `task_comments` | `Comment` | id, task_id, body, author |

#### Projects (`Ema.Projects`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `projects` | `Project` | id, slug, name, status, description, icon, color, linked_path |
| `project_milestones` | `Milestone` | id, project_id, title, status, target_date |
| `project_risks` | `Risk` | id, project_id, title, severity, likelihood, mitigation |

### Workspace

#### Actors (`Ema.Actors`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `actors` | `Actor` | id, slug, actor_type (human/agent), phase, capabilities, config |
| `tags` | `Tag` | id, actor_id, entity_type, entity_id, tag |
| `entity_data` | `EntityData` | id, actor_id, entity_type, entity_id, key, value |
| `phase_transitions` | `PhaseTransition` | id, actor_id, from_phase, to_phase, intent_id |
| `actor_commands` | `ActorCommand` | id, actor_id, name, description, handler |
| `container_config` | `ContainerConfig` | id, actor_id, container_type, container_id, settings |

#### Agents (`Ema.Agents`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `agents` | `Agent` | id, slug, model, temperature, tools, settings, actor_id |
| `agent_channels` | `Channel` | id, agent_id, type, config |
| `agent_conversations` | `Conversation` | id, agent_id, title, status |
| `agent_messages` | `Message` | id, conversation_id, role, content |
| `agent_runs` | `Run` | id, agent_id, status, duration_ms |

#### Workspace

| Table | Schema | Key Fields |
|-------|--------|------------|
| `workspace_windows` | `WindowState` | id, app_id, position, size |
| `spaces` | `Space` | id, name, type, settings |
| `space_members` | `Member` | id, space_id, actor_id, role |

### Knowledge

#### SecondBrain (`Ema.SecondBrain`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `vault_notes` | `Note` | id, title, file_path, space, tags, source_type, project_id |
| `vault_links` | `Link` | id, source_note_id, target_note_id, link_type |

#### Intelligence (`Ema.Intelligence`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `reflexion_entries` | `ReflexionEntry` | id, agent, domain, project_slug, lesson, outcome_status |
| `agent_trust_scores` | `TrustScore` | id, agent_id, score, completion_rate, avg_latency_ms, calculated_at |
| `token_events` | `TokenEvent` | id, model, input_tokens, output_tokens, cost |
| `token_budgets` | `TokenBudget` | id, monthly_budget, alert_threshold |
| `context_fragments` | `ContextStore` | id, file_path, content, relevance_score, project_slug |
| `gaps` | `Gap` | id, source, description, severity |
| `intent_nodes` | `IntentNode` | id, label, type (legacy intent graph) |
| `intent_edges` | `IntentEdge` | id, source_id, target_id, relationship |
| `intent_clusters` | `IntentCluster` | id, label, readiness_score, item_count, promoted |
| `memory_fragments` | `MemoryFragment` | id, content, source, session_id |
| `vm_health_events` | `VmHealthEvent` | id, status, checked_at |
| `git_events` | `GitEvent` | id, repo, event_type, data |
| `audit_logs` | `AuditLog` | id, action, actor, details |
| `usage_records` | `UsageRecord` | id, provider, model, tokens, cost |
| `wiki_sync_actions` | `WikiSyncAction` | id, action_type, target, status |

#### Memory (`Ema.Memory`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `memory_session_entries` | `SessionEntry` | id, session_id, content, role |
| `memory_user_facts` | `UserFact` | id, fact, source, confidence |
| `memory_cross_pollinations` | `CrossPollination` | id, source_domain, target_domain, content |

#### Knowledge (`Ema.Knowledge`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `knowledge_items` | `KnowledgeItem` | id, title, content, type |
| `knowledge_edges` | `KnowledgeEdge` | id, source_id, target_id, relationship |
| `wiki_sections` | `WikiSection` | id, title, content, source_id |
| `wiki_sources` | `WikiSource` | id, url, title, type |

### Apps

#### BrainDump (`Ema.BrainDump`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `inbox_items` | `Item` | id, content, status, source, project_id |

#### Habits (`Ema.Habits`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `habits` | `Habit` | id, name, frequency, streak |
| `habit_logs` | `HabitLog` | id, habit_id, completed_at |

#### Journal (`Ema.Journal`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `journal_entries` | `Entry` | id, content, mood, energy, date |

#### Focus (`Ema.Focus`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `focus_sessions` | `Session` | id, started_at, duration, status |
| `focus_blocks` | `Block` | id, session_id, type, duration |

#### Goals (`Ema.Goals`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `goals` | `Goal` | id, title, status, target_date |
| `goal_key_results` | `KeyResult` | id, goal_id, title, current_value, target_value |
| `goal_check_ins` | `GoalCheckIn` | id, goal_id, notes, progress |

#### Responsibilities (`Ema.Responsibilities`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `responsibilities` | `Responsibility` | id, role, cadence, health_score |
| `responsibility_check_ins` | `CheckIn` | id, responsibility_id, notes |

#### Canvas (`Ema.Canvas`)

| Table | Schema | Key Fields |
|-------|--------|------------|
| `canvases` | `Canvas` | id, title, layout, project_id |
| `canvas_elements` | `Element` | id, canvas_id, type, position, data |
| `canvas_templates` | `CanvasTemplate` | id, name, layout, elements |

### Extended Contexts

| Context | Tables |
|---------|--------|
| `Finance` | `finance_accounts`, `finance_budgets`, `finance_transactions` |
| `Billing` | `billing_clients`, `invoices` |
| `Contacts` | `contacts`, `contact_interactions` |
| `Messaging` | `messaging_conversations`, `messaging_messages` |
| `Pipes` | `pipes`, `pipe_actions`, `pipe_transforms`, `pipe_runs` |
| `Decisions` | `decisions` |
| `Campaigns` | `campaigns`, `campaign_runs`, `campaign_flows` |
| `Routines` | `routines`, `routine_logs` |
| `Temporal` | `temporal_energy_logs`, `temporal_rhythms` |
| `Clipboard` | `clips` |
| `Prompts` | `prompts`, `prompt_templates` |
| `Metamind` | `metamind_prompts` |
| `Evolution` | `behavior_rules` |
| `Claude` | `ai_sessions`, `ai_session_messages`, `claude_sessions` |
| `CLI Manager` | `cli_sessions`, `cli_tools` |
| `FileVault` | `managed_files`, `vault_files` |
| `Harvesters` | `harvester_runs` |
| `Ingestor` | `ingest_jobs` |
| `IntentionFarmer` | `harvested_intents`, `harvested_sessions` |
| `Invoices` | `invoices` (duplicate context) |
| `Meetings` | `meetings` |
| `Notes` | `notes` |
| `Org` | `organizations`, `org_members`, `org_invitations` |
| `Persistence` | `session_store` |
| `Services` | `managed_services` |
| `Settings` | `settings` |
| `Standups/Team` | `standups`, `team_members` |
| `Tunnels` | `tunnels` |

## Key Patterns

### ID Generation

Most schemas use string IDs with a structured format: `<type>_<timestamp>_<random>`. Examples:
- Intents: `int_<ts>_<rand>`
- Executions: `exec_<ts>_<rand>`

Some schemas (notably in Intelligence) use `:binary_id` (UUID v4) with `autogenerate: true`.

### Polymorphic Bridges

`intent_links` serves as a polymorphic bridge table — `source_id` and `target_id` can reference intents, executions, proposals, or tasks. The `link_type` field disambiguates the relationship.

`tags` and `entity_data` in the Actors context are similarly polymorphic — they use `entity_type` + `entity_id` to attach to any record.

### Embeddings

Embedding vectors are stored as `:binary` fields (raw float arrays). Used by `intents.embedding` and potentially vault notes for semantic search.

### Timestamps

All schemas use `:utc_datetime` for timestamp fields. Most have both `inserted_at` and `updated_at`, though append-only schemas like `ReflexionEntry` only have `inserted_at`.

### Append-Only Tables

Several tables are append-only by design:
- `reflexion_entries` — lessons are never updated
- `execution_events` — event log
- `intent_events` — intent lifecycle events
- `phase_transitions` — actor phase change log
- `token_events` — cost tracking
- `vm_health_events` — health snapshots

## Related

- [[EMA-Overview]] — System architecture and supervised processes
- [[Intent-System]] — Intent tree, links, and lifecycle
