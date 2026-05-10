--- docs/sprints/SPRINT-LANE2-CODEX/before.md	2026-05-10 02:36:46
+++ docs/sprints/SPRINT-LANE2-CODEX/after.md	2026-05-10 02:48:58
@@ -1,34 +1,26 @@
-# Sprint Lane 2 Codex Adapter Reconnaissance Before
 
-Generated: 2026-05-10T06:36:45Z
+## codex --version
 
-## codex version
+```bash
+$ codex --version
+```
 
-- Invocation: `codex --version`
-- Exit code: `0`
-- Expected shape: yes - reports codex-cli version
+exit code: `0`
 
-Stdout:
-
 ```text
 codex-cli 0.130.0
 
 ```
 
-Stderr:
 
-```text
+## codex exec --help
 
+```bash
+$ codex exec --help
 ```
 
-## codex exec help
+exit code: `0`
 
-- Invocation: `codex exec --help`
-- Exit code: `0`
-- Expected shape: yes - full help lists accepted flags
-
-Stdout:
-
 ```text
 Run Codex non-interactively
 
@@ -127,214 +119,194 @@
 
 ```
 
-Stderr:
 
-```text
+## harness codex argv source
 
+```bash
+$ bash -lc cat\ -n\ apps/cli/src/commands/harness.ts\ \|\ sed\ -n\ \'550\,625p\'
 ```
 
-## codex argv source
+exit code: `0`
 
-- Invocation: `cat -n apps/cli/src/commands/harness.ts | sed -n '550,580p'`
-- Exit code: `0`
-- Expected shape: yes - current source argv site visible
-
-Stdout:
-
 ```text
-   550	
-   551	function codexExecArgv(cwd: string, prompt: string): string[] {
-   552		return [
-   553			"codex",
-   554			// Sprint 2.5 alignment: current Codex exposes --ask-for-approval on
-   555			// the parent command, not on `codex exec`.
-   556			"--ask-for-approval",
-   557			"never",
-   558			"exec",
-   559			"--cd",
-   560			cwd,
-   561			"--sandbox",
-   562			"workspace-write",
-   563			prompt,
-   564		];
-   565	}
-   566	
-   567	async function openCodexDaemonLineage(spec: { org: string; actor: string; provider: string; intent: string; lane: string | null; mode: string }): Promise<
-   568		| { ok: true; dispatch_id: string; execution_id: string; events: { type: string; event_id: string }[] }
-   569		| { ok: false; error: string }
-   570	> {
-   571		let client: Awaited<ReturnType<typeof connect>> | null = null;
-   572		try {
-   573			client = await connect({ surface: "desktop" });
-   574			const start = await client.command("dispatch.start", {
-   575				org_id: spec.org,
-   576				actor_id: spec.actor,
-   577				intent: spec.intent,
-   578				provider: spec.provider,
-   579				lane_id: spec.lane,
-   580			});
+[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
+   550		const canonicalCompleted = useDaemon ? canonicalCloseError === null && eventTypes.includes("execution.completed") : true;
+   551		const recordOk = ok && canonicalCompleted;
+   552		const record = {
+   553			ok: recordOk,
+   554			command: "harness dispatch",
+   555			provider: "codex",
+   556			status: canonicalCloseError ? "canonical_close_failed" : outcome,
+   557			source: useDaemon ? "daemon_canonical" : "local_codex_exec",
+   558			mode,
+   559			actor,
+   560			lane: spec.lane,
+   561			cwd: spec.cwd,
+   562			prompt_summary: intent,
+   563			dispatch: { id: dispatchId, status: canonicalCloseError ? "canonical_close_failed" : outcome },
+   564			execution: { id: executionId, provider: "codex", status: outcome, started_at: started, ended_at: ended },
+   565			stdout,
+   566			stderr,
+   567			error: result.error ? String(result.error) : null,
+   568			canonical_close_error: canonicalCloseError,
+   569			exit_code: exitCode,
+   570			duration_ms: durationMs,
+   571			stdout_bytes: byteLength(stdout),
+   572			stderr_bytes: byteLength(stderr),
+   573			session_file_path: sessionFileRelative,
+   574			prompt_hash: promptHash,
+   575			invocation_flags: codexInvocationFlags(spec.cwd),
+   576			events: daemonEvents,
+   577		};
+   578		if (recordOk && useDaemon) {
+   579			writeCodexRoundtripProof({
+   580				passed_at: ended,
+   581				execution_id: executionId,
+   582				codex_version: codexVersion(),
+   583				invocation_flags: codexInvocationFlags(spec.cwd),
+   584				prompt_hash: promptHash,
+   585				session_file_path: sessionFileRelative,
+   586				events_observed: eventTypes,
+   587				duration_ms: durationMs,
+   588				smoke_version: 1,
+   589			});
+   590		}
+   591		writeRecord(record);
+   592		if (spec.lane) upsertLaneAssignment(spec.lane, record);
+   593		appendEvents([
+   594			{ type: "dispatch.started", dispatch_id: dispatchId, execution_id: executionId, lane_id: spec.lane, provider: "codex", actor_id: actor },
+   595			{ type: "execution.started", dispatch_id: dispatchId, execution_id: executionId, lane_id: spec.lane, provider: "codex", actor_id: actor },
+   596			{ type: outcome === "completed" ? "execution.completed" : outcome === "timeout" ? "execution.timeout" : "execution.failed", dispatch_id: dispatchId, execution_id: executionId, lane_id: spec.lane, provider: "codex", actor_id: actor, outcome },
+   597		]);
+   598		if (json) emitJson(record);
+   599		else emitPretty(`codex execution ${outcome}: ${executionId}`);
+   600		return recordOk ? 0 : 1;
+   601	}
+   602	
+   603	function codexExecArgv(cwd: string, prompt: string): string[] {
+   604		// Validated against codex-cli 0.130.0: JSON read-only exec runs
+   605		// non-interactively in trusted EMA workspaces without approval flags.
+   606		return [
+   607			"codex",
+   608			"exec",
+   609			"--json",
+   610			"--sandbox",
+   611			"read-only",
+   612			"--cd",
+   613			cwd,
+   614			"--ephemeral",
+   615			prompt,
+   616		];
+   617	}
+   618	
+   619	function codexInvocationFlags(cwd: string): string[] {
+   620		return ["exec", "--json", "--sandbox", "read-only", "--cd", cwd, "--ephemeral"];
+   621	}
+   622	
+   623	async function openCodexDaemonLineage(spec: { org: string; actor: string; provider: string; intent: string; lane: string | null; mode: string }): Promise<
+   624		| { ok: true; dispatch_id: string; execution_id: string; events: { type: string; event_id: string }[] }
+   625		| { ok: false; error: string }
 
 ```
 
-Stderr:
 
-```text
+## harness provider command source
 
-```
-
-## provider command source
-
-- Invocation: `cat -n apps/cli/src/commands/harness.ts | sed -n '1075,1095p'`
-- Exit code: `0`
-- Expected shape: yes - current --full-auto site visible if present
-
-Stdout:
-
-```text
-  1075			const session = record.execution?.tmux_session;
-  1076			if (session) chunks.push(`\n--- tmux ${session} ---\n${captureTmux(session, 500).output}\n`);
-  1077		}
-  1078		writeFileSync(path, chunks.join(""));
-  1079		return path;
-  1080	}
-  1081	
-  1082	function providerCommand(provider: string, cwd: string, prompt: string): string {
-  1083		const quotedCwd = shellQuote(cwd);
-  1084		const quotedPrompt = shellQuote(prompt);
-  1085		if (provider === "codex") return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && codex exec --full-auto ${quotedPrompt}`;
-  1086		return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && claude`;
-  1087	}
-  1088	
-  1089	function sanitizeSession(input: string): string {
-  1090		return input.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 80);
-  1091	}
-  1092	
-  1093	function sanitizeFile(input: string): string {
-  1094		return input.replace(/[^a-zA-Z0-9_.-]+/g, "_");
-  1095	}
-
+```bash
+$ bash -lc cat\ -n\ apps/cli/src/commands/harness.ts\ \|\ sed\ -n\ \'1218\,1235p\'
 ```
 
-Stderr:
+exit code: `0`
 
 ```text
+[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
+  1218			chunks.push(`\n--- registry ${record.execution?.id ?? "unknown"} ---\n${JSON.stringify(record, null, 2)}\n`);
+  1219			for (const event of readEvents({ execution: record.execution?.id, lane: record.lane })) chunks.push(`event ${JSON.stringify(event)}\n`);
+  1220			const session = record.execution?.tmux_session;
+  1221			if (session) chunks.push(`\n--- tmux ${session} ---\n${captureTmux(session, 500).output}\n`);
+  1222		}
+  1223		writeFileSync(path, chunks.join(""));
+  1224		return path;
+  1225	}
+  1226	
+  1227	function providerCommand(provider: string, cwd: string, prompt: string): string {
+  1228		const quotedCwd = shellQuote(cwd);
+  1229		const quotedPrompt = shellQuote(prompt);
+  1230		if (provider === "codex") return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && codex exec --sandbox workspace-write ${quotedPrompt}`;
+  1231		return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && claude`;
+  1232	}
+  1233	
+  1234	function sanitizeSession(input: string): string {
+  1235		return input.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 80);
 
 ```
 
-## stale flag grep
 
-- Invocation: `rg -n 'ask-for-approval|full-auto' apps/cli/`
-- Exit code: `0`
-- Expected shape: yes - confirms stale flag sites
+## stale flags search
 
-Stdout:
-
-```text
-apps/cli/src/commands/harness.ts:554:		// Sprint 2.5 alignment: current Codex exposes --ask-for-approval on
-apps/cli/src/commands/harness.ts:556:		"--ask-for-approval",
-apps/cli/src/commands/harness.ts:1085:	if (provider === "codex") return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && codex exec --full-auto ${quotedPrompt}`;
-
+```bash
+$ rg -n ask-for-approval\|full-auto apps/cli/
 ```
 
-Stderr:
+exit code: `1`
 
 ```text
 
 ```
 
-## manual sandbox-only codex probe
 
-- Invocation: `codex exec --cd /tmp --sandbox workspace-write 'echo test'`
-- Exit code: `1`
-- Expected shape: yes/no - determines whether --sandbox workspace-write alone proceeds
+## real dispatch
 
-Stdout:
-
-```text
-
+```bash
+$ node apps/cli/dist/bin.js harness dispatch --provider codex --prompt echo\ hello --json
 ```
 
-Stderr:
+exit code: `0`
 
 ```text
-Reading additional input from stdin...
-Not inside a trusted directory and --skip-git-repo-check was not specified.
+{"ok":true,"command":"harness dispatch","provider":"codex","status":"completed","source":"daemon_canonical","mode":"plan","actor":"actor:codex","lane":null,"cwd":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","prompt_summary":"echo hello","dispatch":{"id":"dispatch:01KR8AABHP00ASXWKHPKWQ8V6M","status":"completed"},"execution":{"id":"execution:01KR8AABHQ00BVV9KR616QSWVG","provider":"codex","status":"completed","started_at":"2026-05-10T06:48:41.264Z","ended_at":"2026-05-10T06:48:50.371Z"},"stdout":"{\"type\":\"thread.started\",\"thread_id\":\"019e10a5-2f66-7443-8cf5-145e8f5bdb99\"}\n{\"type\":\"turn.started\"}\n{\"type\":\"item.started\",\"item\":{\"id\":\"item_0\",\"type\":\"command_execution\",\"command\":\"/bin/zsh -lc 'echo hello'\",\"aggregated_output\":\"\",\"exit_code\":null,\"status\":\"in_progress\"}}\n{\"type\":\"item.completed\",\"item\":{\"id\":\"item_0\",\"type\":\"command_execution\",\"command\":\"/bin/zsh -lc 'echo hello'\",\"aggregated_output\":\"hello\\n\",\"exit_code\":0,\"status\":\"completed\"}}\n{\"type\":\"item.completed\",\"item\":{\"id\":\"item_1\",\"type\":\"agent_message\",\"text\":\"hello\"}}\n{\"type\":\"turn.completed\",\"usage\":{\"input_tokens\":57134,\"cached_input_tokens\":31488,\"output_tokens\":159,\"reasoning_output_tokens\":96}}\n","stderr":"Reading additional input from stdin...\n2026-05-10T06:48:41.468098Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:41.470763Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:41.658189Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.682376Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.706295Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.730100Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.748924Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: prompt must be at most 128 characters path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/build-ios-apps/.codex-plugin/plugin.json\n2026-05-10T06:48:41.749587Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/plugin-eval/.codex-plugin/plugin.json\n2026-05-10T06:48:41.752096Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/twilio-developer-kit/.codex-plugin/plugin.json\n2026-05-10T06:48:41.752137Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/openai-developers/.codex-plugin/plugin.json\n2026-05-10T06:48:41.752704Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.776021Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.800756Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.825841Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.849020Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.872048Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.897165Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.920104Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.944941Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.969871Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:41.993079Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.015684Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.041031Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.063934Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.088941Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.113872Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.138917Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.188040Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.210150Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.233525Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.303243Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.327921Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:42.352778Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:43.003760Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:43.006271Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:43.036618Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: prompt must be at most 128 characters path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/build-ios-apps/.codex-plugin/plugin.json\n2026-05-10T06:48:43.036830Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/plugin-eval/.codex-plugin/plugin.json\n2026-05-10T06:48:43.038347Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/twilio-developer-kit/.codex-plugin/plugin.json\n2026-05-10T06:48:43.038376Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/openai-developers/.codex-plugin/plugin.json\n2026-05-10T06:48:43.042792Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:43.042795Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:43.043027Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:43.043029Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:43.043253Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:43.043255Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:43.043475Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:43.043477Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:43.043702Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:43.043705Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:43.044276Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:43.044278Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:44.430706Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:44.433846Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:44.474933Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: prompt must be at most 128 characters path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/build-ios-apps/.codex-plugin/plugin.json\n2026-05-10T06:48:44.475209Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/plugin-eval/.codex-plugin/plugin.json\n2026-05-10T06:48:44.477336Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/twilio-developer-kit/.codex-plugin/plugin.json\n2026-05-10T06:48:44.477369Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/openai-developers/.codex-plugin/plugin.json\n2026-05-10T06:48:44.483232Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:44.483239Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:44.483626Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:44.483631Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:44.483960Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:44.483965Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:44.484286Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:44.484289Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:44.484621Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:44.484624Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:44.485323Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:44.485325Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:48.553235Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:48.555721Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:48.589351Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: prompt must be at most 128 characters path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/build-ios-apps/.codex-plugin/plugin.json\n2026-05-10T06:48:48.589621Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/plugin-eval/.codex-plugin/plugin.json\n2026-05-10T06:48:48.591499Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/twilio-developer-kit/.codex-plugin/plugin.json\n2026-05-10T06:48:48.591532Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/openai-developers/.codex-plugin/plugin.json\n2026-05-10T06:48:48.596573Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:48.596581Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:48.596880Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:48.596884Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:48.597189Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:48.597192Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:48.597493Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:48.597496Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:48.597795Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:48.597798Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:48.598459Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:48.598462Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n","error":null,"canonical_close_error":null,"exit_code":0,"duration_ms":9107,"stdout_bytes":676,"stderr_bytes":13721,"session_file_path":".ema-dev/harness-glue/codex/execution_01KR8AABHQ00BVV9KR616QSWVG.jsonl","prompt_hash":"584a331fd6b02dcb1ecbe2eba731f609a2e1e3dac0bb73ae998dfad14c309a77","invocation_flags":["exec","--json","--sandbox","read-only","--cd","/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","--ephemeral"],"events":[{"type":"dispatch.started","event_id":"event:01KR8AABHP00BBCH9VKVB6C5ZP"},{"type":"execution.started","event_id":"event:01KR8AABHQ00C1AMR9KYRK2DJZ"},{"type":"tool.invoked","event_id":"event:01KR8AABHQ00CG04PDTGFPY1XD"},{"type":"tool.returned","event_id":"event:01KR8AAME800D2RPYT5N7WSQ4T"},{"type":"execution.completed","event_id":"event:01KR8AAME900DWYNHC9PPW6XSN"},{"type":"dispatch.ended","event_id":"event:01KR8AAME900E0XX7Z5T1PSX5B"}]}
 
 ```
 
-## real dispatch before
 
-- Invocation: `node apps/cli/dist/bin.js harness dispatch --provider codex --prompt 'echo hello' --json`
-- Exit code: `1`
-- Expected shape: expected fail before fix; captures dist behavior
+## capability-check dispatch
 
-Stdout:
-
-```text
-{"ok":false,"command":"harness dispatch","provider":"codex","status":"daemon_lineage_failed","error":"daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh","remediation":"Retry with --no-daemon for local-only dry inspection, or restart the EMA daemon."}
-
+```bash
+$ node apps/cli/dist/bin.js harness dispatch --provider codex --mode capability-check --prompt ping --timeout-ms 12000 --json
 ```
 
-Stderr:
+exit code: `0`
 
 ```text
+{"ok":true,"command":"harness dispatch","provider":"codex","status":"completed","source":"daemon_canonical","mode":"capability-check","actor":"actor:codex","lane":null,"cwd":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","prompt_summary":"ping","dispatch":{"id":"dispatch:01KR8AAMKE00ESG16ZFMH3GZPW","status":"completed"},"execution":{"id":"execution:01KR8AAMKF00FVFM9S9QJ7MTCP","provider":"codex","status":"completed","started_at":"2026-05-10T06:48:50.535Z","ended_at":"2026-05-10T06:48:57.779Z"},"stdout":"{\"type\":\"thread.started\",\"thread_id\":\"019e10a5-5343-7de2-a91c-c7cb4c97b3a6\"}\n{\"type\":\"turn.started\"}\n{\"type\":\"item.completed\",\"item\":{\"id\":\"item_0\",\"type\":\"agent_message\",\"text\":\"pong\"}}\n{\"type\":\"turn.completed\",\"usage\":{\"input_tokens\":28465,\"cached_input_tokens\":28032,\"output_tokens\":147,\"reasoning_output_tokens\":140}}\n","stderr":"Reading additional input from stdin...\n2026-05-10T06:48:50.648444Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:50.650946Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:50.782385Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:50.806382Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:50.828146Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:50.842435Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:50.866618Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:50.890816Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:50.914356Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:50.933887Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: prompt must be at most 128 characters path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/build-ios-apps/.codex-plugin/plugin.json\n2026-05-10T06:48:50.934163Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/plugin-eval/.codex-plugin/plugin.json\n2026-05-10T06:48:50.936238Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/twilio-developer-kit/.codex-plugin/plugin.json\n2026-05-10T06:48:50.936277Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/openai-developers/.codex-plugin/plugin.json\n2026-05-10T06:48:50.939338Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:50.963867Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:50.987346Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.012378Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.037383Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.061899Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.086886Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.112010Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.137047Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.161837Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.186815Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.211803Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.236745Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.261719Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.286673Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.311705Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.336666Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.359489Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.383386Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:51.408393Z  WARN codex_rollout::list: state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back\n2026-05-10T06:48:52.260434Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:52.263016Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:52.299687Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: prompt must be at most 128 characters path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/build-ios-apps/.codex-plugin/plugin.json\n2026-05-10T06:48:52.300135Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/plugin-eval/.codex-plugin/plugin.json\n2026-05-10T06:48:52.302250Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/twilio-developer-kit/.codex-plugin/plugin.json\n2026-05-10T06:48:52.302326Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/openai-developers/.codex-plugin/plugin.json\n2026-05-10T06:48:52.308342Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:52.308354Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:52.308711Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:52.308716Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:52.309004Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:52.309008Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:52.309314Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:52.309317Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:52.309616Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:52.309619Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:52.310262Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:52.310265Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:53.571730Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:53.574696Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/plugins/cache/openai-curated/openai-developers/63976030/.codex-plugin/plugin.json\n2026-05-10T06:48:53.609826Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: prompt must be at most 128 characters path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/build-ios-apps/.codex-plugin/plugin.json\n2026-05-10T06:48:53.610091Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/plugin-eval/.codex-plugin/plugin.json\n2026-05-10T06:48:53.611999Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/twilio-developer-kit/.codex-plugin/plugin.json\n2026-05-10T06:48:53.612029Z  WARN codex_core_plugins::manifest: ignoring interface.defaultPrompt: maximum of 3 prompts is supported path=/Users/trajanm4air/.codex/.tmp/plugins/plugins/openai-developers/.codex-plugin/plugin.json\n2026-05-10T06:48:53.616784Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:53.616792Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:53.617122Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:53.617126Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:53.617515Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:53.617518Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:53.617799Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:53.617802Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:53.618066Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:53.618070Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n2026-05-10T06:48:53.618687Z  WARN codex_core_skills::loader: ignoring interface.icon_small: icon path must not contain '..'\n2026-05-10T06:48:53.618690Z  WARN codex_core_skills::loader: ignoring interface.icon_large: icon path must not contain '..'\n","error":null,"canonical_close_error":null,"exit_code":0,"duration_ms":7244,"stdout_bytes":322,"stderr_bytes":10833,"session_file_path":".ema-dev/harness-glue/codex/execution_01KR8AAMKF00FVFM9S9QJ7MTCP.jsonl","prompt_hash":"758d61f26a44448384e5c4468a0dcb7a2abe456067b0f7b505bc28b9411fe931","invocation_flags":["exec","--json","--sandbox","read-only","--cd","/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","--ephemeral"],"events":[{"type":"dispatch.started","event_id":"event:01KR8AAMKE00F3FSY1NVK5KMQJ"},{"type":"execution.started","event_id":"event:01KR8AAMKF00G6G7PK3N7K0H8B"},{"type":"tool.invoked","event_id":"event:01KR8AAMKF00GHZA34VADPW36W"},{"type":"tool.returned","event_id":"event:01KR8AAVNP00H45BE6Z10PM10H"},{"type":"execution.completed","event_id":"event:01KR8AAVNQ00HX5S0EEC3KVQNH"},{"type":"dispatch.ended","event_id":"event:01KR8AAVNR00JAGZXYN01HJF0C"}]}
 
 ```
 
-## capability-check dispatch before
 
-- Invocation: `node apps/cli/dist/bin.js harness dispatch --provider codex --mode capability-check --prompt 'ping' --timeout-ms 12000 --json`
-- Exit code: `1`
-- Expected shape: expected fail before fix; captures dist behavior
+## capability assert
 
-Stdout:
-
-```text
-{"ok":false,"command":"harness dispatch","provider":"codex","status":"daemon_lineage_failed","error":"daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh","remediation":"Retry with --no-daemon for local-only dry inspection, or restart the EMA daemon."}
-
+```bash
+$ node apps/cli/dist/bin.js capability assert --required codex --json
 ```
 
-Stderr:
+exit code: `0`
 
 ```text
+{"ok":true,"command":"capability.assert","required":["codex"],"cached":true,"failures":[],"report":{"ok":true,"command":"capability.list","source":"cli_static_checks_plus_daemon_ping","daemon":{"ok":true,"url":"ws://127.0.0.1:49555","rtt_ms":1,"daemon_version":"0.0.6-dev"},"database":{"ok":true,"path":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/canonical.db","exists":true,"wal_exists":true,"shm_exists":true,"size_bytes":745472,"user_version":1,"tables":["access_session_challenges","access_sessions","authenticator_enrollments","collab_documents","collab_peer_cursors","collab_update_frames","devices","events","google_identities","install","intents","invites","memberships","orgs","peer_trust","projects","proposals","spaces","users"],"table_counts":{"access_session_challenges":0,"access_sessions":0,"authenticator_enrollments":0,"collab_documents":1,"collab_peer_cursors":0,"collab_update_frames":0,"devices":1,"events":1181,"google_identities":0,"install":1,"intents":9,"invites":0,"memberships":2,"orgs":2,"peer_trust":0,"projects":13,"proposals":2,"spaces":3,"users":1},"recent_event_kinds":[{"kind":"dispatch.started","count":166},{"kind":"execution.started","count":135},{"kind":"tool.invoked","count":134},{"kind":"tool.returned","count":125},{"kind":"queue_item.added","count":111},{"kind":"execution.interrupted_by_restart","count":77},{"kind":"dispatch.ended","count":71},{"kind":"lane.opened","count":69},{"kind":"execution.ended","count":47},{"kind":"lane.claimed","count":45},{"kind":"queue_item.closed","count":30},{"kind":"checkup.scheduled","count":22},{"kind":"lane.closed","count":21},{"kind":"project.created","count":13},{"kind":"project.materialized","count":12},{"kind":"execution.completed","count":11},{"kind":"agent.reported","count":10},{"kind":"intent.created","count":10},{"kind":"lane.released","count":9},{"kind":"handoff.requested","count":6},{"kind":"actor.created","count":5},{"kind":"lane.moved","count":5},{"kind":"problem.logged","count":4},{"kind":"intent.updated","count":3},{"kind":"space.created","count":3},{"kind":"blueprint.section.added","count":2},{"kind":"campaign.created","count":2},{"kind":"membership.role_granted","count":2},{"kind":"mission.created","count":2},{"kind":"mission.started","count":2},{"kind":"org.created","count":2},{"kind":"problem.solution_added","count":2},{"kind":"proposal.approved","count":2},{"kind":"proposal.created","count":2},{"kind":"attachment.created","count":1},{"kind":"attachment.linked","count":1},{"kind":"blueprint.attachment.linked","count":1},{"kind":"blueprint.document.created","count":1},{"kind":"blueprint.document.renamed","count":1},{"kind":"campaign.archived","count":1},{"kind":"device.registered","count":1},{"kind":"execution.timeout","count":1},{"kind":"handoff.accepted","count":1},{"kind":"identity.user_upserted","count":1},{"kind":"install.initialized","count":1},{"kind":"lane.blocked","count":1},{"kind":"problem.linked","count":1},{"kind":"queue_item.blocked","count":1},{"kind":"swarm.created","count":1},{"kind":"swarm.paused","count":1},{"kind":"swarm.report_generated","count":1},{"kind":"swarm.started","count":1},{"kind":"swarm.stopped","count":1}],"duplicate_artifacts":["/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/canonical 2.db-shm","/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/canonical 2.db-wal"]},"cli":{"source":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/bin.ts","dist":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/dist/bin.js","dist_exists":true,"dist_older_than_source":false},"workspace_scope":{"org_id":"org:01J00000000000000000000012","space_id":"space:01J00000000000000000000013","project_id":"project:01KQD8D0G9000XHA2KS36VYXX3","project_name":"EMA","project_record":"/Users/trajanm4air/Desktop/Projects/EMA","active_build":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","build_version":null,"build_record":null,"resolution_source":"cwd-active-build","cwd":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","note":null},"stale_docs":[{"path":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/WORKSPACE-ENTRYPOINT.md","exists":true,"stale_marker":false},{"path":"/Users/trajanm4air/Desktop/Projects/EMA/atlas/canon/current/ema-0-0-5-current-canon.md","exists":false,"stale_marker":false},{"path":"/Users/trajanm4air/Desktop/Projects/EMA/atlas/workspace/README.md","exists":true,"stale_marker":true}],"capabilities":[{"id":"lane","state":"daemon-backed","commands":["ema lane open/list/show/claim/block/move/release/close"],"evidence":"daemon lane registry and lifecycle writers exist","blocks_proslync_swarm":false},{"id":"queue","state":"daemon-backed","commands":["ema queue add/list/show/ready/block/close"],"evidence":"daemon queue registry and lifecycle writers exist","blocks_proslync_swarm":false},{"id":"campaign","state":"daemon-backed","commands":["ema campaign create/list/show/archive"],"evidence":"daemon campaign registry exists","blocks_proslync_swarm":false},{"id":"mission","state":"daemon-backed","commands":["ema mission create/list/show/start/pause/complete"],"evidence":"daemon mission registry exists","blocks_proslync_swarm":false},{"id":"handoff","state":"daemon-backed","commands":["ema handoff request/list/accept/reject/complete"],"evidence":"daemon handoff registry exists","blocks_proslync_swarm":false},{"id":"problem","state":"daemon-backed","commands":["ema problem log/list/show/solution/link"],"evidence":"daemon problem graph exists","blocks_proslync_swarm":false},{"id":"agent","state":"daemon-backed","commands":["ema agent orient/report/meta-progress"],"evidence":"agent report writes and orientation projections exist","blocks_proslync_swarm":false},{"id":"checkup","state":"daemon-backed","commands":["ema checkup schedule/complete/runtime"],"evidence":"daemon checkup writers exist; periodic actor still future","blocks_proslync_swarm":false},{"id":"vcalendar","state":"file-backed","commands":["ema vcalendar show/week/tick/block/phase"],"evidence":"writes are daemon-backed; show/week still event-trail/fallback","blocks_proslync_swarm":false},{"id":"cockpit","state":"file-backed","commands":["ema cockpit workpack/projection"],"evidence":"composite of daemon projections, git facts, and file-backed intentions","blocks_proslync_swarm":false},{"id":"intention","state":"file-backed","commands":["ema intention list/review/backfeed"],"evidence":"review projection is file-backed; accepted backfeed can create queue/artifact","blocks_proslync_swarm":false},{"id":"harness","state":"simulated-only","commands":["ema harness dispatch --provider simulated"],"evidence":"simulated dispatch writes canonical events; real providers guarded","blocks_proslync_swarm":false},{"id":"db","state":"daemon-backed","commands":["ema db status/events/snapshot"],"evidence":"canonical SQLite events are readable","blocks_proslync_swarm":true},{"id":"artifact","state":"file-backed","commands":["ema workspace artifact add/list/show/link"],"evidence":"hybrid markdown + project-local SQLite index","blocks_proslync_swarm":true},{"id":"execution","state":"daemon-backed","commands":["ema execution list/show/timeline","ema dispatch list"],"evidence":"canonical dispatch/execution/tool event reads","blocks_proslync_swarm":true},{"id":"codex","state":"daemon-backed","commands":["ema harness dispatch --provider codex --prompt <internal capability check> --json"],"evidence":"recent successful Codex roundtrip at 2026-05-10T06:48:57.779Z (0s old): proof execution:01KR8AAMKF00FVFM9S9QJ7MTCP via .ema-dev/harness-glue/codex/execution_01KR8AAMKF00FVFM9S9QJ7MTCP.jsonl","blocks_proslync_swarm":false},{"id":"claude","state":"unsupported-provider-adapter","commands":["ema harness dispatch --provider claude-code"],"evidence":"future adapter; do not present as ready","blocks_proslync_swarm":false},{"id":"hermes","state":"unsupported-provider-adapter","commands":["ema harness dispatch --provider hermes"],"evidence":"future adapter; do not present as ready","blocks_proslync_swarm":false}]}}
 
 ```
 
-## capability assert before
 
-- Invocation: `node apps/cli/dist/bin.js capability assert --required codex --json`
-- Exit code: `1`
-- Expected shape: expected fail before fix with codex_roundtrip blocker
+## readiness
 
-Stdout:
-
-```text
-{"ok":false,"command":"capability.assert","required":["codex"],"failures":[{"id":"codex","state":"roundtrip-failed","commands":["ema harness dispatch --provider codex --prompt <internal capability check> --json"],"evidence":"Codex capability smoke failed via ema harness dispatch --provider codex --mode capability-check (exit 1): daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh","blocks_proslync_swarm":true}],"report":{"ok":false,"command":"capability.list","source":"cli_static_checks_plus_daemon_ping","daemon":{"ok":false,"url":"ws://127.0.0.1:49555","error":"daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh"},"database":{"ok":true,"path":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/canonical.db","exists":true,"wal_exists":true,"shm_exists":true,"size_bytes":745472,"user_version":1,"tables":["access_session_challenges","access_sessions","authenticator_enrollments","collab_documents","collab_peer_cursors","collab_update_frames","devices","events","google_identities","install","intents","invites","memberships","orgs","peer_trust","projects","proposals","spaces","users"],"table_counts":{"access_session_challenges":0,"access_sessions":0,"authenticator_enrollments":0,"collab_documents":1,"collab_peer_cursors":0,"collab_update_frames":0,"devices":1,"events":953,"google_identities":0,"install":1,"intents":0,"invites":0,"memberships":2,"orgs":2,"peer_trust":0,"projects":13,"proposals":0,"spaces":3,"users":1},"recent_event_kinds":[{"kind":"dispatch.started","count":124},{"kind":"queue_item.added","count":111},{"kind":"execution.started","count":99},{"kind":"tool.invoked","count":98},{"kind":"tool.returned","count":91},{"kind":"execution.interrupted_by_restart","count":74},{"kind":"lane.opened","count":69},{"kind":"dispatch.ended","count":47},{"kind":"lane.claimed","count":45},{"kind":"queue_item.closed","count":30},{"kind":"execution.ended","count":25},{"kind":"checkup.scheduled","count":22},{"kind":"lane.closed","count":21},{"kind":"project.created","count":13},{"kind":"project.materialized","count":12},{"kind":"agent.reported","count":10},{"kind":"lane.released","count":9},{"kind":"handoff.requested","count":6},{"kind":"lane.moved","count":5},{"kind":"problem.logged","count":4},{"kind":"actor.created","count":3},{"kind":"space.created","count":3},{"kind":"blueprint.section.added","count":2},{"kind":"campaign.created","count":2},{"kind":"membership.role_granted","count":2},{"kind":"mission.created","count":2},{"kind":"mission.started","count":2},{"kind":"org.created","count":2},{"kind":"problem.solution_added","count":2},{"kind":"attachment.created","count":1},{"kind":"attachment.linked","count":1},{"kind":"blueprint.attachment.linked","count":1},{"kind":"blueprint.document.created","count":1},{"kind":"blueprint.document.renamed","count":1},{"kind":"campaign.archived","count":1},{"kind":"device.registered","count":1},{"kind":"handoff.accepted","count":1},{"kind":"identity.user_upserted","count":1},{"kind":"install.initialized","count":1},{"kind":"lane.blocked","count":1},{"kind":"problem.linked","count":1},{"kind":"queue_item.blocked","count":1},{"kind":"swarm.created","count":1},{"kind":"swarm.paused","count":1},{"kind":"swarm.report_generated","count":1},{"kind":"swarm.started","count":1},{"kind":"swarm.stopped","count":1}],"duplicate_artifacts":["/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/canonical 2.db-shm","/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/canonical 2.db-wal"]},"cli":{"source":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/bin.ts","dist":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/dist/bin.js","dist_exists":true,"dist_older_than_source":false},"workspace_scope":{"org_id":"org:01J00000000000000000000012","space_id":"space:01J00000000000000000000013","project_id":"project:01KQD8D0G9000XHA2KS36VYXX3","project_name":"EMA","project_record":"/Users/trajanm4air/Desktop/Projects/EMA","active_build":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","build_version":null,"build_record":null,"resolution_source":"cwd-active-build","cwd":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6","note":null},"stale_docs":[{"path":"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/WORKSPACE-ENTRYPOINT.md","exists":true,"stale_marker":false},{"path":"/Users/trajanm4air/Desktop/Projects/EMA/atlas/canon/current/ema-0-0-5-current-canon.md","exists":false,"stale_marker":false},{"path":"/Users/trajanm4air/Desktop/Projects/EMA/atlas/workspace/README.md","exists":true,"stale_marker":true}],"capabilities":[{"id":"lane","state":"daemon-backed","commands":["ema lane open/list/show/claim/block/move/release/close"],"evidence":"daemon lane registry and lifecycle writers exist","blocks_proslync_swarm":false},{"id":"queue","state":"daemon-backed","commands":["ema queue add/list/show/ready/block/close"],"evidence":"daemon queue registry and lifecycle writers exist","blocks_proslync_swarm":false},{"id":"campaign","state":"daemon-backed","commands":["ema campaign create/list/show/archive"],"evidence":"daemon campaign registry exists","blocks_proslync_swarm":false},{"id":"mission","state":"daemon-backed","commands":["ema mission create/list/show/start/pause/complete"],"evidence":"daemon mission registry exists","blocks_proslync_swarm":false},{"id":"handoff","state":"daemon-backed","commands":["ema handoff request/list/accept/reject/complete"],"evidence":"daemon handoff registry exists","blocks_proslync_swarm":false},{"id":"problem","state":"daemon-backed","commands":["ema problem log/list/show/solution/link"],"evidence":"daemon problem graph exists","blocks_proslync_swarm":false},{"id":"agent","state":"daemon-backed","commands":["ema agent orient/report/meta-progress"],"evidence":"agent report writes and orientation projections exist","blocks_proslync_swarm":false},{"id":"checkup","state":"daemon-backed","commands":["ema checkup schedule/complete/runtime"],"evidence":"daemon checkup writers exist; periodic actor still future","blocks_proslync_swarm":false},{"id":"vcalendar","state":"file-backed","commands":["ema vcalendar show/week/tick/block/phase"],"evidence":"writes are daemon-backed; show/week still event-trail/fallback","blocks_proslync_swarm":false},{"id":"cockpit","state":"file-backed","commands":["ema cockpit workpack/projection"],"evidence":"composite of daemon projections, git facts, and file-backed intentions","blocks_proslync_swarm":false},{"id":"intention","state":"file-backed","commands":["ema intention list/review/backfeed"],"evidence":"review projection is file-backed; accepted backfeed can create queue/artifact","blocks_proslync_swarm":false},{"id":"harness","state":"simulated-only","commands":["ema harness dispatch --provider simulated"],"evidence":"simulated dispatch writes canonical events; real providers guarded","blocks_proslync_swarm":false},{"id":"db","state":"daemon-backed","commands":["ema db status/events/snapshot"],"evidence":"canonical SQLite events are readable","blocks_proslync_swarm":true},{"id":"artifact","state":"file-backed","commands":["ema workspace artifact add/list/show/link"],"evidence":"hybrid markdown + project-local SQLite index","blocks_proslync_swarm":true},{"id":"execution","state":"daemon-backed","commands":["ema execution list/show/timeline","ema dispatch list"],"evidence":"canonical dispatch/execution/tool event reads","blocks_proslync_swarm":true},{"id":"codex","state":"roundtrip-failed","commands":["ema harness dispatch --provider codex --prompt <internal capability check> --json"],"evidence":"Codex capability smoke failed via ema harness dispatch --provider codex --mode capability-check (exit 1): daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh","blocks_proslync_swarm":true},{"id":"claude","state":"unsupported-provider-adapter","commands":["ema harness dispatch --provider claude-code"],"evidence":"future adapter; do not present as ready","blocks_proslync_swarm":false},{"id":"hermes","state":"unsupported-provider-adapter","commands":["ema harness dispatch --provider hermes"],"evidence":"future adapter; do not present as ready","blocks_proslync_swarm":false}]}}
-
+```bash
+$ node apps/cli/dist/bin.js readiness --json
 ```
 
-Stderr:
+exit code: `1`
 
 ```text
+{"ok":false,"command":"readiness","substrate_translated":{"summary":"partial","components":{"daemon_runtime":"beam","intent_writer":"beam","lane_writer":"beam","queue_writer":"beam","execution_writer":"beam","dispatch_writer":"beam","artifact_writer":"hybrid","event_log_writer":"beam"}},"coordination_ready":true,"proslync_execution_ready":false,"blockers":[{"id":"artifact_context_writeback","severity":"blocking","reason":"Proslync execution readiness requires artifact/context writeback to be daemon-owned end-to-end; current artifact writer is hybrid."}]}
 
 ```
 
-## readiness before
-
-- Invocation: `node apps/cli/dist/bin.js readiness --json`
-- Exit code: `1`
-- Expected shape: expected full layer-aware shape with codex_roundtrip blocker
-
-Stdout:
-
-```text
-{"ok":false,"command":"readiness","substrate_translated":{"summary":"partial","components":{"daemon_runtime":"beam","intent_writer":"absent","lane_writer":"beam","queue_writer":"beam","execution_writer":"beam","dispatch_writer":"beam","artifact_writer":"hybrid","event_log_writer":"beam"}},"coordination_ready":false,"proslync_execution_ready":false,"blockers":[{"id":"codex_roundtrip","severity":"blocking","reason":"Codex capability requires a completed executable roundtrip; current adapter evidence: Codex capability smoke failed via ema harness dispatch --provider codex --mode capability-check (exit 1): daemon not reachable at ws://127.0.0.1:49555 (ECONNREFUSED). Start it with: bash scripts/dev-daemon.sh"},{"id":"artifact_context_writeback","severity":"blocking","reason":"Proslync execution readiness requires artifact/context writeback to be daemon-owned end-to-end; current artifact writer is hybrid."}]}
-
-```
-
-Stderr:
-
-```text
-
-```
-
