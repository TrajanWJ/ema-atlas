# mission

Mission events group goal-oriented workspace bundles under a campaign.

### `mission.created`

payload {
  mission_id: mission:<ulid>
  campaign_id?: campaign:<ulid>
  title: string
  project_id?: project:<ulid>
  depends_on?: string
  done_when?: string
  created_by: actor:<ulid>
  status: "ready"
}

### `mission.started`

payload { mission_id, started_by: actor:<ulid> }

### `mission.paused`

payload { mission_id, reason?: string, paused_by: actor:<ulid> }

### `mission.completed`

payload {
  mission_id: mission:<ulid>
  result?: string
  verify?: string
  completed_by: actor:<ulid>
}
