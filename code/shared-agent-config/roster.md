# Agent Roster — Full 20

## How to Request Work from Another Agent

Write a JSON file to `~/dispatch/inter-agent/<target-agent-id>/<timestamp>-<your-id>.json`:
```json
{ "from": "your-id", "to": "target-id", "task": "what you need", "priority": 1, "context": "relevant details" }
```
Use `~/bin/inter-agent-mailbox.sh <target-id> "<task>" [priority] [context]` for convenience.
Right Hand monitors this directory and chains spawns.

## The Roster

### Life & Executive Function
| ID | Agent | Role | Best For |
|---|---|---|---|
| `chief-of-staff` | 📋 Chief of Staff | Morning briefings, day planning, accountability nudges, end-of-day capture | Daily structure, reminders, agenda management |
| `finance` | 💰 Finance | Invoice tracking, runway, expenses, revenue pipeline | Money questions, invoicing, expense tracking |
| `wellness` | 🧑‍⚕️ Wellness | Routine tracking, habit streaks, brainrot interrupts, exercise nudges | Health habits, break reminders, routine adherence |

### Business & Revenue
| ID | Agent | Role | Best For |
|---|---|---|---|
| `biz-dev` | 💼 Biz Dev | Outreach, lead research, proposal drafts, CRM tracking | New business opportunities, outreach drafts |
| `account-manager` | 🤝 Account Manager | Wilson Premier relationship, deliverables, client comms | Client relationships, deliverable tracking |
| `creative-director` | 🎨 Creative Director | Brand, copy, content calendars, design direction | Brand voice, content strategy, visual direction |
| `marketer` | 📣 Marketer | Social media, SEO, growth tactics, content distribution | Growth, social posts, SEO, distribution |

### Technical
| ID | Agent | Role | Best For |
|---|---|---|---|
| `coder` | 💻 Coder | Builds features, debugs, ships | Code tasks, bug fixes, feature implementation |
| `architect` | 🏛️ Architect | System design, tech stack, code review for structure | Architecture decisions, design review, tech stack |
| `researcher` | 🔬 Researcher | Deep dives, scraping, competitive analysis | Research, investigation, competitive intel |
| `ops` | ⚙️ Ops | System health, crons, deploys | Server health, deployments, monitoring |
| `security` | 🛡️ Security | Audits, hardening | Security scans, config review, hardening |

### Quality & Intelligence
| ID | Agent | Role | Best For |
|---|---|---|---|
| `prompt-engineer` | 🎯 Prompt Engineer | SOUL optimization, metaprompting | Prompt quality, SOUL.md tuning |
| `devils-advocate` | 😈 Devil's Advocate | Challenges everything, pre-ship review | Critical review, assumption challenging |
| `strategist` | 🧠 Strategist | Big decisions, tradeoff analysis | Decision frameworks, strategic thinking |
| `vault-keeper` | 📚 Vault Keeper | Knowledge org, Trajan's notes/projects/decisions | Vault cleanup, note organization |

### Operations Support
| ID | Agent | Role | Best For |
|---|---|---|---|
| `writer` | 📝 Writer | Long-form content, blog posts, docs, email drafts, proposals | Writing tasks, documentation, drafts |
| `analyst` | 📈 Analyst | Data crunching, metrics, dashboards, trend spotting | Data analysis, metrics, reporting |
| `pm` | 📦 PM | Project lifecycle, sprint planning, milestone tracking | Project management, sprint planning |
| `concierge` | 🛎️ Concierge | Personal requests, recommendations | Errands, lookups, recommendations |
