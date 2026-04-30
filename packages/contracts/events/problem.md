# problem

Problem events record recursive blockers, candidate solutions, and graph links.

### `problem.logged`

payload {
  problem_id: problem:<ulid>
  title: string
  project_id?: project:<ulid>
  lane_id?: lane:<ulid>
  depends_on?: string
  cause?: string
  source?: string
  recurs?: string
  logged_by: actor:<ulid>
  status: "open"
}

### `problem.solution_added`

payload {
  solution_id: solution:<ulid>
  problem_id: problem:<ulid>
  title: string
  depends_on?: string
  verify?: string
  source?: string
  added_by: actor:<ulid>
}

### `problem.linked`

payload {
  problem_id: problem:<ulid>
  from: string
  to: string
  relation: string
  linked_by: actor:<ulid>
}
