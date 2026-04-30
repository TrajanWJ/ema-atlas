# agent

Agent events record handoff-friendly progress reports from workspace actors.

### `agent.reported`

payload {
  report_id: agent_report:<ulid>
  actor_id: actor:<ulid>
  lane_id?: lane:<ulid>
  changed?: string
  verified?: string
  risks?: string
  next?: string
}
