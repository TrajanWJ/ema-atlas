# actor

Owner: `ema_identity`.

Actors are first-class workspace participants. A user, agent, personal AI,
device-mediated service, or system service can be represented as an actor when
it performs work in EMA.

## Kinds

### `actor.created`
```
payload {
  actor_id: actor:<ulid>
  kind: "human" | "agent" | "personal_ai" | "service"
  display_name: string
  role: string
  user_id?: user:<ulid>
}
```

### `actor.assigned_to_project`
```
payload {
  actor_id: actor:<ulid>
  project_id: project:<ulid>
  role: string
  assigned_by: actor:<ulid>
}
```

The assignment event grants project-level visibility and a role label. It is
not a tool permission grant; tool and execution scope still belong to dispatch,
approval, and Hermes-facing events.
