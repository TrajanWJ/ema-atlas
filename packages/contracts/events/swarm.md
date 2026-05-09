# swarm

Owner: `ema_swarm_coordination`.

A swarm is a coordinated bundle of work — typically one or more missions,
lanes, and queue items — running under a single execution-management
container. Swarms are the executive-function unit `ema agent` recognizes
when answering "what work am I orchestrating right now?"

See `docs/cli/see-agent-work.md` § Swarm Commands for CLI grammar.

## Kinds

### `swarm.created`
```
payload {
  swarm_id:    swarm:<ulid>
  name:        string
  project_id?: project:<ulid>
  mission_id?: mission:<ulid>
  campaign_id?: campaign:<ulid>
  created_by:  actor:<ulid>
  status:      "created"
}
```

### `swarm.started`
```
payload {
  swarm_id:    swarm:<ulid>
  started_by:  actor:<ulid>
}
```

### `swarm.paused`
```
payload {
  swarm_id:    swarm:<ulid>
  paused_by:   actor:<ulid>
  reason?:     string
}
```

### `swarm.stopped`
```
payload {
  swarm_id:    swarm:<ulid>
  stopped_by:  actor:<ulid>
  reason?:     string
}
```

### `swarm.report_generated`
```
payload {
  swarm_id:     swarm:<ulid>
  report_id:    swarm_report:<ulid>
  generated_by: actor:<ulid>
  summary?:     string
}
```
