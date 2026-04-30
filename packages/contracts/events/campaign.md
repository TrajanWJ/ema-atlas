# campaign

Campaign events group long-running workspace initiatives.

### `campaign.created`

payload {
  campaign_id: campaign:<ulid>
  title: string
  project_id?: project:<ulid>
  depends_on?: string
  done_when?: string
  created_by: actor:<ulid>
  status: "active"
}

### `campaign.archived`

payload {
  campaign_id: campaign:<ulid>
  reason?: string
  archived_by: actor:<ulid>
}
