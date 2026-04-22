alias Ema.ControlPlane.Persistence

wrap_items = fn value -> %{"items" => value} end
now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

{:ok, _project_state} =
  Persistence.upsert_project_state(%{
    id: "proj_ema",
    project: "ema",
    title: "EMA",
    status: "active",
    current_focus_intent_id: "int_host_cli_integration",
    primary_goal: "Establish EMA as canonical context/session/control spine.",
    active_intent_ids: [
      "int_ema_root",
      "int_host_cli_integration",
      "int_session_normalization",
      "int_mcp_baseline",
      "int_wiki_buildout"
    ],
    blockers:
      wrap_items.([
        "split session truth",
        "duplicated context assembly",
        "vault dependence"
      ]),
    recent_decisions:
      wrap_items.([
        "EMA is the canonical control plane",
        "Wiki is the semantic memory substrate",
        "Vault is deprecated as primary operational memory"
      ]),
    next_actions:
      wrap_items.([
        "verify read-first routes",
        "seed root intents",
        "sync canonical wiki pages"
      ]),
    linked_refs: %{
      wiki_pages: [
        "wiki:projects/EMA",
        "wiki:architecture/Canonical Architecture"
      ]
    },
    metadata: %{
      seeded_by: "repo/seeds.exs",
      bootstrap_mode: "idempotent"
    },
    inserted_at: now,
    updated_at: now
  })

seed_intents = [
  {"int_ema_root", "ema-root", "EMA Root", "project-root",
   "Umbrella coordination intent for EMA normalization."},
  {"int_host_cli_integration", "host-cli-integration", "Host CLI Integration", "project-focus",
   "Normalize EMA/OpenClaw/Claude/Codex architecture and runtime flows."},
  {"int_session_normalization", "session-normalization", "Session Normalization", "migration",
   "Normalize Claude and Codex session truth into EMA."},
  {"int_mcp_baseline", "mcp-baseline", "MCP Baseline", "integration",
   "Make the MCP baseline authoritative and generated."},
  {"int_wiki_buildout", "wiki-buildout", "Wiki Buildout", "integration",
   "Build canonical semantic memory pages and intent mirrors."}
]

Enum.each(seed_intents, fn {id, slug, title, kind, summary} ->
  Persistence.upsert_intent(%{
    id: id,
    project: "ema",
    slug: slug,
    title: title,
    kind: kind,
    status: "active",
    priority: "high",
    current_focus: summary,
    summary: summary,
    objectives: [
      %{id: "obj_#{slug}_01", title: summary, status: "active"}
    ],
    blockers: [
      %{
        id: "blk_split_brain",
        title: "Split-brain truth remains",
        severity: "high",
        status: "open"
      }
    ],
    next_actions: [
      %{id: "act_#{slug}_01", title: "Continue normalization", status: "pending"}
    ],
    linked_refs: %{
      wiki_pages: ["wiki:intents/#{slug}"]
    },
    metadata: %{
      seeded_by: "repo/seeds.exs"
    },
    inserted_at: now,
    updated_at: now
  })
end)

IO.puts("Seeded EMA project state and root intents")
