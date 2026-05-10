// Region 7 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 7".
// Single card: scope summary + agent_instruction + copy-to-clipboard.
// Sprint 4: also exposes a daemon-backed "run agent orient" primary button so
// the prompt block can be paired with a live orient call. Copy stays present
// as a secondary affordance for external Codex / Claude CLI sessions.
import { useCallback, useState } from "react";
import { EMA_SCOPE } from "@/src/app/mock-projections";
import type { AgentWorkspacePanelProps } from "./component-types";

function buildPrompt(agentInstruction: string, missionTitle: string, laneTitle: string) {
  return [
    `You are working inside EMA 0.0.6 scope:`,
    `  Organization: ${EMA_SCOPE.orgName}`,
    `  Space:        ${EMA_SCOPE.spaceName}`,
    `  Project:      ${EMA_SCOPE.projectName}`,
    ``,
    `Mission: ${missionTitle}`,
    `Lane:    ${laneTitle}`,
    ``,
    `Rules:`,
    agentInstruction,
    ``,
    `Source references:`,
    `  - packages/contracts/events/catalog.v0.md (read before emitting event kinds)`,
    `  - packages/contracts/ipc/shell-protocol.md (wire format)`,
    `  - docs/cli/see-agent-work.md (CLI grammar)`,
    `  - docs/agents/see-agent-work-agent-usage.md (runbook)`,
    ``,
    `Write scope (allowed): surface lane files only unless the lane prompt says otherwise.`,
    `Output: report in { Implemented, Verified, Files changed, Decisions, Risks, Next lane } shape.`,
  ].join("\n");
}

type ExecResponse = {
  readonly ok?: boolean;
  readonly status?: string;
  readonly error?: string;
  readonly result?: unknown;
};

async function runAgentOrient(): Promise<string> {
  const response = await fetch("/api/agent-work/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "agent.orient", args: {} }),
  });
  const payload = (await response.json()) as ExecResponse;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? `orient failed (${payload.status ?? `http_${response.status}`})`);
  }
  const record =
    payload.result && typeof payload.result === "object"
      ? (payload.result as Record<string, unknown>)
      : {};
  const scope = (record.workspace_scope as Record<string, unknown> | undefined)?.project;
  return scope ? `oriented in ${String(scope)}` : "oriented";
}

export function AgentInstructionPanel({ projection, sourceLabel }: Omit<AgentWorkspacePanelProps, "isLive">) {
  const { missions, lanes } = projection;
  const primaryMission = missions.find((m) => m.status === "active") ?? missions[0];
  const primaryLane = lanes.find((l) => l.mission_id === primaryMission?.id) ?? lanes[0];
  const promptText = buildPrompt(
    projection.agent_instruction,
    primaryMission?.title ?? "(no active mission)",
    primaryLane?.title ?? "(no active lane)",
  );
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [orientResult, setOrientResult] = useState<string | null>(null);

  const onCopy = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }, [promptText]);

  const onOrient = useCallback(async () => {
    setRunning(true);
    setOrientResult(null);
    try {
      const reply = await runAgentOrient();
      setOrientResult(reply);
    } catch (error) {
      setOrientResult(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <section className="ema-panel ema-saw-region ema-saw-prompt" aria-label="Agent instruction panel">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">agent instruction panel</p>
          <h2>Prompt block for external Codex / Claude CLI</h2>
        </div>
        <span className="ema-pill ema-pill--hot">{sourceLabel}</span>
      </div>
      <dl className="ema-saw-prompt__scope">
        <div>
          <dt>mission</dt>
          <dd>{primaryMission?.title ?? "—"}</dd>
        </div>
        <div>
          <dt>lane</dt>
          <dd>{primaryLane?.title ?? "—"}</dd>
        </div>
        <div>
          <dt>org / space / project</dt>
          <dd>
            {EMA_SCOPE.orgName} / {EMA_SCOPE.spaceName} / {EMA_SCOPE.projectName}
          </dd>
        </div>
      </dl>
      <pre className="ema-saw-prompt__block" tabIndex={0} aria-label="Generated agent prompt">
        {promptText}
      </pre>
      <div className="ema-saw-prompt__actions">
        <button
          type="button"
          className="ema-saw-cmd-btn__action ema-saw-prompt__run"
          data-action="agent.orient"
          onClick={onOrient}
          disabled={running}
        >
          {running ? "running" : "run agent orient"}
        </button>
        <button
          type="button"
          className="ema-saw-cmd-btn__copy ema-saw-prompt__copy"
          onClick={onCopy}
        >
          {copied ? "copied" : "copy prompt"}
        </button>
        <small className="ema-saw-cli-hint">
          ema agent prompt --actor actor:&lt;id&gt; --mission {primaryMission?.id ?? "<id>"}
        </small>
      </div>
      {orientResult ? (
        <p className="ema-saw-cmd-btn__hint" data-result-for="agent.orient">
          {orientResult}
        </p>
      ) : null}
    </section>
  );
}
