# incident

Owner: (future) `ema_swarm_coordination`.

## Kinds

### `incident.opened`
```
payload {
  incident_id: incident:<ulid>
  project_id:  project:<ulid>
  title:       string
  severity:    "info" | "warn" | "error" | "critical"
  opened_by:   user:<ulid> | system:<component>
}
```

### `incident.noted`
```
payload {
  incident_id: incident:<ulid>
  note:        string
  by:          user:<ulid> | system:<component>
}
```

### `incident.resolved`
```
payload { incident_id, resolved_by: user:<ulid>, resolution: string }
```
