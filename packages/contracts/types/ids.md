# Identifiers

Every entity uses a **ULID** under a **typed prefix**.

Format: `<prefix>:<ulid-26chars>`, lowercase prefix, ASCII colon.
Example: `project:01JFYV6W2H7K9Z8XR3BDQG4T5P`.

## Registered prefixes

| Prefix            | Entity                                    |
| ----------------- | ----------------------------------------- |
| `user`            | user account                              |
| `actor`           | human, agent, personal AI, or service actor |
| `agent`           | agent identity                            |
| `personal_ai`     | personal AI identity                      |
| `device`          | a registered device for a user            |
| `org`             | organization                              |
| `space`           | space inside an org                       |
| `project`         | project inside a space                    |
| `invite`          | invite                                    |
| `event`           | any event in the log                      |
| `dispatch`        | Hermes dispatch                           |
| `execution`       | Hermes execution                          |
| `lease`           | lease record                              |
| `lane`            | coordination lane                         |
| `handoff`         | handoff                                   |
| `proposal`        | proposal                                  |
| `incident`        | incident                                  |
| `attachment`      | attachment                                |
| `artifact`        | generated or imported workspace artifact  |
| `source_ref`      | canonical source reference                |
| `codebase`        | codebase/source record owned by git-ema   |
| `connector`       | external-source connector                 |
| `blueprint_doc`   | blueprint document                        |
| `blueprint_sec`   | blueprint section                         |
| `blueprint_cmt`   | blueprint comment                         |
| `swarm`           | swarm control group                       |
| `mission`         | mission inside a campaign or project      |
| `campaign`        | long-running initiative                   |
| `vcalendar`       | virtual calendar                          |
| `calendar_block`  | virtual calendar block                    |
| `checkup`         | scheduled review/checkup                  |
| `queue_item`      | proposal or work queue item               |

Adding a new prefix requires an entry in this table and a contract
review.

## Registry keys

The daemon registry (see `docs/architecture/02-daemon-supervision.md`)
uses the same `<prefix>:<ulid>` form as its key. No path form, no
hyphenated composite keys. Path-style addressing (`org/space/project`)
is a query layer on top.

## Why ULID

- time-ordered (useful for event log indexes and projections);
- lexicographically sortable;
- URL-safe;
- 128-bit, collision-free in practice.
