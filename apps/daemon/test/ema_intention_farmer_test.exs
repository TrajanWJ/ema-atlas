defmodule EmaIntentionFarmerTest do
  use ExUnit.Case, async: false

  setup do
    EmaIntentionFarmer.__reset__()

    tmp =
      Path.join(System.tmp_dir!(), "ema-intention-farmer-#{System.unique_integer([:positive])}")

    File.mkdir_p!(tmp)
    on_exit(fn -> File.rm_rf!(tmp) end)
    {:ok, tmp: tmp}
  end

  test "discovers codex, claude, history, and markdown sources", %{tmp: tmp} do
    home = Path.join(tmp, "home")
    File.mkdir_p!(Path.join(home, ".claude/projects/app"))
    File.mkdir_p!(Path.join(home, ".codex/sessions/2026/05/09"))
    File.mkdir_p!(Path.join(home, "Desktop/Projects/demo"))

    File.write!(
      Path.join(home, ".claude/projects/app/session.jsonl"),
      ~s({"text":"build the app"}\n)
    )

    File.write!(
      Path.join(home, ".codex/sessions/2026/05/09/session.jsonl"),
      ~s({"content":"fix tests"}\n)
    )

    File.write!(Path.join(home, ".codex/history.jsonl"), ~s({"prompt":"audit launchpad hq"}\n))
    File.write!(Path.join(home, "Desktop/Projects/demo/CLAUDE.md"), "Demo instructions")

    sources = EmaIntentionFarmer.discover_sources(home: home)

    assert Enum.any?(sources, &(&1.source_type == :claude_project))
    assert Enum.any?(sources, &(&1.source_type == :codex_session))
    assert Enum.any?(sources, &(&1.source_type == :codex_history))
    assert Enum.any?(sources, &(&1.source_type == :donor_project))
    assert Enum.all?(sources, &Map.has_key?(&1, :source_family))
  end

  test "harvest parses, cleans, deduplicates, and loads intents", %{tmp: tmp} do
    codex = Path.join(tmp, "codex.jsonl")
    claude = Path.join(tmp, "claude.jsonl")
    markdown = Path.join(tmp, "AGENTS.md")

    File.write!(
      codex,
      ~s({"prompt":"Build Dispatch Board for Launchpad HQ"}\n{"prompt":"Build Dispatch Board for Launchpad HQ"}\n)
    )

    File.write!(claude, ~s({"content":"Fix the broken daemon compile error before continuing"}\n))
    File.write!(markdown, "Project rules for EMA agents and launchpad context")

    sources = [
      %{path: codex, source_type: :codex_history, source_family: :ema},
      %{path: claude, source_type: :claude_project, source_family: :ema},
      %{path: markdown, source_type: :ema_doc, project_hint: "EMA", source_family: :ema}
    ]

    assert {:ok, result} = EmaIntentionFarmer.harvest(sources: sources)
    assert result.sources_seen == 3
    assert result.records_parsed == 4
    assert result.records_loaded == 3
    assert result.duplicates_skipped == 1

    intents = EmaIntentionFarmer.intents()
    assert length(intents) == 3
    assert Enum.any?(intents, &(&1.intent_type == :task))
    assert Enum.any?(intents, &(&1.intent_type == :fix))
    assert Enum.any?(intents, &(&1.intent_type == :context_note))

    stats = EmaIntentionFarmer.stats()
    assert stats.intents == 3
    assert stats.sessions == 3
    assert stats.candidate_intents == 3
  end

  test "projection_json returns parseable JSON for IPC bridging", %{tmp: tmp} do
    codex = Path.join(tmp, "codex.jsonl")
    File.write!(codex, ~s({"prompt":"Build Proslync Brand HQ farmer projection with EMA queue backfeed"}\n))

    {:ok, _} =
      EmaIntentionFarmer.harvest(
        sources: [%{path: codex, source_type: :codex_history, source_family: :proslync}]
      )

    projection = EmaIntentionFarmer.projection(limit: 1)
    assert projection.source == "ema_intention_farmer"
    assert length(projection.intents) == 1
    assert Enum.any?(projection.top_tags, &(&1.tag == "proslync_product_intent"))
    assert length(projection.recommended_queue) == 1

    json = EmaIntentionFarmer.projection_json(limit: 1)
    decoded = :json.decode(json)
    assert decoded["source"] == "ema_intention_farmer"
    assert length(decoded["intents"]) == 1
    assert length(decoded["recommended_queue"]) == 1
  end

  test "harvest can bound large source sets", %{tmp: tmp} do
    first = Path.join(tmp, "first.jsonl")
    second = Path.join(tmp, "second.jsonl")

    File.write!(
      first,
      ~s({"prompt":"Build one useful bounded farmer record"}\n{"prompt":"Build another useful bounded farmer record"}\n)
    )

    File.write!(
      second,
      ~s({"prompt":"This source should not be reached when max_sources is one"}\n)
    )

    assert {:ok, result} =
             EmaIntentionFarmer.harvest(
               sources: [
                 %{path: first, source_type: :codex_history, source_family: :ema},
                 %{path: second, source_type: :codex_history, source_family: :ema}
               ],
               max_sources: 1,
               max_records_per_source: 1
             )

    assert result.sources_seen == 1
    assert result.records_parsed == 1
    assert result.records_loaded == 1
  end

  test "classifies Proslync and session-manager intentions with evidence refs", %{tmp: tmp} do
    codex = Path.join(tmp, "proslync.jsonl")

    File.write!(
      codex,
      ~s({"role":"user","timestamp":"2026-05-10T00:00:00Z","prompt":"I want Proslync AD cockpit work linked to cmux session manager history and EMA queue follow up"}\n)
    )

    {:ok, result} =
      EmaIntentionFarmer.harvest(
        sources: [
          %{
            path: codex,
            source_type: :codex_session,
            source_family: :proslync,
            project_hint: "proslync-app-ios-final"
          }
        ]
      )

    assert result.proslync_relevant == 1
    assert result.ema_relevant == 1
    assert result.lost_followups == 1

    [intent] = EmaIntentionFarmer.intents()
    assert "proslync_product_intent" in intent.tags
    assert "session_manager_pattern" in intent.tags
    assert "lost_followup" in intent.tags
    assert intent.recommended_destination == :proslync_queue
    assert intent.evidence_ref == "jsonl:#{codex}#1"
    assert intent.role == "user"
    assert intent.occurred_at == "2026-05-10T00:00:00Z"
  end
end
