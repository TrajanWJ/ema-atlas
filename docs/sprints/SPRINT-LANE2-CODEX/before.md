# Sprint Lane 2 Codex Adapter Reconnaissance Before

Generated: 2026-05-10T06:36:45Z

## codex version

- Invocation: `codex --version`
- Exit code: `0`
- Expected shape: yes - reports codex-cli version

Stdout:

```text
codex-cli 0.130.0

```

Stderr:

```text

```

## codex exec help

- Invocation: `codex exec --help`
- Exit code: `0`
- Expected shape: yes - full help lists accepted flags

Stdout:

```text
Run Codex non-interactively

Usage: codex exec [OPTIONS] [PROMPT]
       codex exec [OPTIONS] <COMMAND> [ARGS]

Commands:
  resume  Resume a previous session by id or pick the most recent with --last
  review  Run a code review against the current repository
  help    Print this message or the help of the given subcommand(s)

Arguments:
  [PROMPT]
          Initial instructions for the agent. If not provided as an argument (or if `-` is used),
          instructions are read from stdin. If stdin is piped and a prompt is also provided, stdin
          is appended as a `<stdin>` block

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.
          
          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE>
          Configuration profile from config.toml to specify default options

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands
          
          [possible values: read-only, workspace-write, danger-full-access]

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

      --skip-git-repo-check
          Allow running Codex outside a Git repository

      --ephemeral
          Run without persisting session files to disk

      --ignore-user-config
          Do not load `$CODEX_HOME/config.toml`; auth still uses `CODEX_HOME`

      --ignore-rules
          Do not load user or project execpolicy `.rules` files

      --output-schema <FILE>
          Path to a JSON Schema file describing the model's final response shape

      --color <COLOR>
          Specifies color settings for use in the output
          
          [default: auto]
          [possible values: always, never, auto]

      --json
          Print events to stdout as JSONL

  -o, --output-last-message <FILE>
          Specifies file where the last message from the agent should be written

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version

```

Stderr:

```text

```

## codex argv source

- Invocation: `cat -n apps/cli/src/commands/harness.ts | sed -n '550,580p'`
- Exit code: `0`
- Expected shape: yes - current source argv site visible

Stdout:

```text
   550	
   551	function codexExecArgv(cwd: string, prompt: string): string[] {
   552		return [
   553			"codex",
   554			// Sprint 2.5 alignment: current Codex exposes --ask-for-approval on
   555			// the parent command, not on `codex exec`.
   556			"--ask-for-approval",
   557			"never",
   558			"exec",
   559			"--cd",
   560			cwd,
   561			"--sandbox",
   562			"workspace-write",
   563			prompt,
   564		];
   565	}
   566	
   567	async function openCodexDaemonLineage(spec: { org: string; actor: string; provider: string; intent: string; lane: string | null; mode: string }): Promise<
   568		| { ok: true; dispatch_id: string; execution_id: string; events: { type: string; event_id: string }[] }
   569		| { ok: false; error: string }
   570	> {
   571		let client: Awaited<ReturnType<typeof connect>> | null = null;
   572		try {
   573			client = await connect({ surface: "desktop" });
   574			const start = await client.command("dispatch.start", {
   575				org_id: spec.org,
   576				actor_id: spec.actor,
   577				intent: spec.intent,
   578				provider: spec.provider,
   579				lane_id: spec.lane,
   580			});

```

Stderr:

```text

```

## provider command source

- Invocation: `cat -n apps/cli/src/commands/harness.ts | sed -n '1075,1095p'`
- Exit code: `0`
- Expected shape: yes - current --full-auto site visible if present

Stdout:

```text
  1075			const session = record.execution?.tmux_session;
  1076			if (session) chunks.push(`\n--- tmux ${session} ---\n${captureTmux(session, 500).output}\n`);
  1077		}
  1078		writeFileSync(path, chunks.join(""));
  1079		return path;
  1080	}
  1081	
  1082	function providerCommand(provider: string, cwd: string, prompt: string): string {
  1083		const quotedCwd = shellQuote(cwd);
  1084		const quotedPrompt = shellQuote(prompt);
  1085		if (provider === "codex") return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && codex exec --full-auto ${quotedPrompt}`;
  1086		return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && claude`;
  1087	}
  1088	
  1089	function sanitizeSession(input: string): string {
  1090		return input.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 80);
  1091	}
  1092	
  1093	function sanitizeFile(input: string): string {
  1094		return input.replace(/[^a-zA-Z0-9_.-]+/g, "_");
  1095	}

```

Stderr:

```text

```

## stale flag grep

- Invocation: `rg -n 'ask-for-approval|full-auto' apps/cli/`
- Exit code: `0`
- Expected shape: yes - confirms stale flag sites

Stdout:

```text
apps/cli/src/commands/harness.ts:554:		// Sprint 2.5 alignment: current Codex exposes --ask-for-approval on
apps/cli/src/commands/harness.ts:556:		"--ask-for-approval",
apps/cli/src/commands/harness.ts:1085:	if (provider === "codex") return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && codex exec --full-auto ${quotedPrompt}`;

```

Stderr:

```text

```

## manual sandbox-only codex probe

- Invocation: `codex exec --cd /tmp --sandbox workspace-write 'echo test'`
- Exit code: `1`
- Expected shape: yes/no - determines whether --sandbox workspace-write alone proceeds

Stdout:

```text

```

Stderr:

```text
Reading additional input from stdin...
Not inside a trusted directory and --skip-git-repo-check was not specified.

```

## real dispatch before

- Invocation: `node apps/cli/dist/bin.js harness dispatch --provider codex --prompt 'echo hello' --json`
- Exit code: `1`
- Expected shape: expected fail before fix; captures dist behavior

Stdout:

```text
{"ok":false,"command":"harness dispatch","provider":"codex","status":"daemon_lineage_failed","error":"daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh","remediation":"Retry with --no-daemon for local-only dry inspection, or restart the EMA daemon."}

```

Stderr:

```text

```

## capability-check dispatch before

- Invocation: `node apps/cli/dist/bin.js harness dispatch --provider codex --mode capability-check --prompt 'ping' --timeout-ms 12000 --json`
- Exit code: `1`
- Expected shape: expected fail before fix; captures dist behavior

Stdout:

```text
{"ok":false,"command":"harness dispatch","provider":"codex","status":"daemon_lineage_failed","error":"daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh","remediation":"Retry with --no-daemon for local-only dry inspection, or restart the EMA daemon."}

```

Stderr:

```text

```

## capability assert before

- Invocation: `node apps/cli/dist/bin.js capability assert --required codex --json`
- Exit code: `1`
- Expected shape: expected fail before fix with codex_roundtrip blocker

Stdout:

```text
{"ok":false,"command":"capability.assert","required":["codex"],"failures":[{"id":"codex","state":"roundtrip-failed","commands":["ema harness dispatch --provider codex --prompt <internal capability check> --json"],"evidence":"Codex capability smoke failed via ema harness dispatch --provider codex --mode capability-check (exit 1): daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh","blocks_proslync_swarm":true}],"report":{"ok":false,"command":"capability.list","source":"cli_static_checks_plus_daemon_ping","daemon":{"ok":false,"url":"ws://127.0.0.1:49555","error":"daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh"},"database":{"ok":true,"path":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/canonical.db","exists":true,"wal_exists":true,"shm_exists":true,"size_bytes":745472,"user_version":1,"tables":["access_session_challenges","access_sessions","authenticator_enrollments","collab_documents","collab_peer_cursors","collab_update_frames","devices","events","google_identities","install","intents","invites","memberships","orgs","peer_trust","projects","proposals","spaces","users"],"table_counts":{"access_session_challenges":0,"access_sessions":0,"authenticator_enrollments":0,"collab_documents":1,"collab_peer_cursors":0,"collab_update_frames":0,"devices":1,"events":953,"google_identities":0,"install":1,"intents":0,"invites":0,"memberships":2,"orgs":2,"peer_trust":0,"projects":13,"proposals":0,"spaces":3,"users":1},"recent_event_kinds":[{"kind":"dispatch.started","count":124},{"kind":"queue_item.added","count":111},{"kind":"execution.started","count":99},{"kind":"tool.invoked","count":98},{"kind":"tool.returned","count":91},{"kind":"execution.interrupted_by_restart","count":74},{"kind":"lane.opened","count":69},{"kind":"dispatch.ended","count":47},{"kind":"lane.claimed","count":45},{"kind":"queue_item.closed","count":30},{"kind":"execution.ended","count":25},{"kind":"checkup.scheduled","count":22},{"kind":"lane.closed","count":21},{"kind":"project.created","count":13},{"kind":"project.materialized","count":12},{"kind":"agent.reported","count":10},{"kind":"lane.released","count":9},{"kind":"handoff.requested","count":6},{"kind":"lane.moved","count":5},{"kind":"problem.logged","count":4},{"kind":"actor.created","count":3},{"kind":"space.created","count":3},{"kind":"blueprint.section.added","count":2},{"kind":"campaign.created","count":2},{"kind":"membership.role_granted","count":2},{"kind":"mission.created","count":2},{"kind":"mission.started","count":2},{"kind":"org.created","count":2},{"kind":"problem.solution_added","count":2},{"kind":"attachment.created","count":1},{"kind":"attachment.linked","count":1},{"kind":"blueprint.attachment.linked","count":1},{"kind":"blueprint.document.created","count":1},{"kind":"blueprint.document.renamed","count":1},{"kind":"campaign.archived","count":1},{"kind":"device.registered","count":1},{"kind":"handoff.accepted","count":1},{"kind":"identity.user_upserted","count":1},{"kind":"install.initialized","count":1},{"kind":"lane.blocked","count":1},{"kind":"problem.linked","count":1},{"kind":"queue_item.blocked","count":1},{"kind":"swarm.created","count":1},{"kind":"swarm.paused","count":1},{"kind":"swarm.report_generated","count":1},{"kind":"swarm.started","count":1},{"kind":"swarm.stopped","count":1}],"duplicate_artifacts":["/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/canonical 2.db-shm","/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/canonical 2.db-wal"]},"cli":{"source":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/bin.ts","dist":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/dist/bin.js","dist_exists":true,"dist_older_than_source":false},"workspace_scope":{"org_id":"org:01J00000000000000000000012","space_id":"space:01J00000000000000000000013","project_id":"project:01KQD8D0G9000XHA2KS36VYXX3","project_name":"EMA","project_record":"/Users/trajanm4air/Desktop/Projects/EMA","active_build":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","build_version":null,"build_record":null,"resolution_source":"cwd-active-build","cwd":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","note":null},"stale_docs":[{"path":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/WORKSPACE-ENTRYPOINT.md","exists":true,"stale_marker":false},{"path":"/Users/trajanm4air/Desktop/Projects/EMA/atlas/canon/current/ema-0-0-5-current-canon.md","exists":false,"stale_marker":false},{"path":"/Users/trajanm4air/Desktop/Projects/EMA/atlas/workspace/README.md","exists":true,"stale_marker":true}],"capabilities":[{"id":"lane","state":"daemon-backed","commands":["ema lane open/list/show/claim/block/move/release/close"],"evidence":"daemon lane registry and lifecycle writers exist","blocks_proslync_swarm":false},{"id":"queue","state":"daemon-backed","commands":["ema queue add/list/show/ready/block/close"],"evidence":"daemon queue registry and lifecycle writers exist","blocks_proslync_swarm":false},{"id":"campaign","state":"daemon-backed","commands":["ema campaign create/list/show/archive"],"evidence":"daemon campaign registry exists","blocks_proslync_swarm":false},{"id":"mission","state":"daemon-backed","commands":["ema mission create/list/show/start/pause/complete"],"evidence":"daemon mission registry exists","blocks_proslync_swarm":false},{"id":"handoff","state":"daemon-backed","commands":["ema handoff request/list/accept/reject/complete"],"evidence":"daemon handoff registry exists","blocks_proslync_swarm":false},{"id":"problem","state":"daemon-backed","commands":["ema problem log/list/show/solution/link"],"evidence":"daemon problem graph exists","blocks_proslync_swarm":false},{"id":"agent","state":"daemon-backed","commands":["ema agent orient/report/meta-progress"],"evidence":"agent report writes and orientation projections exist","blocks_proslync_swarm":false},{"id":"checkup","state":"daemon-backed","commands":["ema checkup schedule/complete/runtime"],"evidence":"daemon checkup writers exist; periodic actor still future","blocks_proslync_swarm":false},{"id":"vcalendar","state":"file-backed","commands":["ema vcalendar show/week/tick/block/phase"],"evidence":"writes are daemon-backed; show/week still event-trail/fallback","blocks_proslync_swarm":false},{"id":"cockpit","state":"file-backed","commands":["ema cockpit workpack/projection"],"evidence":"composite of daemon projections, git facts, and file-backed intentions","blocks_proslync_swarm":false},{"id":"intention","state":"file-backed","commands":["ema intention list/review/backfeed"],"evidence":"review projection is file-backed; accepted backfeed can create queue/artifact","blocks_proslync_swarm":false},{"id":"harness","state":"simulated-only","commands":["ema harness dispatch --provider simulated"],"evidence":"simulated dispatch writes canonical events; real providers guarded","blocks_proslync_swarm":false},{"id":"db","state":"daemon-backed","commands":["ema db status/events/snapshot"],"evidence":"canonical SQLite events are readable","blocks_proslync_swarm":true},{"id":"artifact","state":"file-backed","commands":["ema workspace artifact add/list/show/link"],"evidence":"hybrid markdown + project-local SQLite index","blocks_proslync_swarm":true},{"id":"execution","state":"daemon-backed","commands":["ema execution list/show/timeline","ema dispatch list"],"evidence":"canonical dispatch/execution/tool event reads","blocks_proslync_swarm":true},{"id":"codex","state":"roundtrip-failed","commands":["ema harness dispatch --provider codex --prompt <internal capability check> --json"],"evidence":"Codex capability smoke failed via ema harness dispatch --provider codex --mode capability-check (exit 1): daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh","blocks_proslync_swarm":true},{"id":"claude","state":"unsupported-provider-adapter","commands":["ema harness dispatch --provider claude-code"],"evidence":"future adapter; do not present as ready","blocks_proslync_swarm":false},{"id":"hermes","state":"unsupported-provider-adapter","commands":["ema harness dispatch --provider hermes"],"evidence":"future adapter; do not present as ready","blocks_proslync_swarm":false}]}}

```

Stderr:

```text

```

## readiness before

- Invocation: `node apps/cli/dist/bin.js readiness --json`
- Exit code: `1`
- Expected shape: expected full layer-aware shape with codex_roundtrip blocker

Stdout:

```text
{"ok":false,"command":"readiness","substrate_translated":{"summary":"partial","components":{"daemon_runtime":"beam","intent_writer":"absent","lane_writer":"beam","queue_writer":"beam","execution_writer":"beam","dispatch_writer":"beam","artifact_writer":"hybrid","event_log_writer":"beam"}},"coordination_ready":false,"proslync_execution_ready":false,"blockers":[{"id":"codex_roundtrip","severity":"blocking","reason":"Codex capability requires a completed executable roundtrip; current adapter evidence: Codex capability smoke failed via ema harness dispatch --provider codex --mode capability-check (exit 1): daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh"},{"id":"artifact_context_writeback","severity":"blocking","reason":"Proslync execution readiness requires artifact/context writeback to be daemon-owned end-to-end; current artifact writer is hybrid."}]}

```

Stderr:

```text

```

