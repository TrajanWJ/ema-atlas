// Region 7 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 7".
// Single card: scope summary + agent_instruction + copy-to-clipboard. The
// prompt block is how external Codex / Claude CLI sessions inherit EMA scope.
import { useCallback, useState } from "react";
import { EMA_SCOPE, MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";

function buildPrompt(missionTitle: string, laneTitle: string) {
  return [
    `You are working inside EMA 0.0.5 scope:`,
    `  Organization: ${EMA_SCOPE.orgName}`,
    `  Space:        ${EMA_SCOPE.spaceName}`,
    `  Project:      ${EMA_SCOPE.projectName}`,
    ``,
    `Mission: ${missionTitle}`,
    `Lane:    ${laneTitle}`,
    ``,
    `Rules:`,
    seeAgentWorkProjection.agent_instruction,
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

export function AgentInstructionPanel() {
  const { missions, lanes } = seeAgentWorkProjection;
  const primaryMission = missions.find((m) => m.status === "active") ?? missions[0];
  const primaryLane = lanes.find((l) => l.mission_id === primaryMission?.id) ?? lanes[0];
  const promptText = buildPrompt(
    primaryMission?.title ?? "(no active mission)",
    primaryLane?.title ?? "(no active lane)",
  );
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }, [promptText]);

  return (
    <section className="ema-panel ema-saw-region ema-saw-prompt" aria-label="Agent instruction panel">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">agent instruction panel</p>
          <h2>Prompt block for external Codex / Claude CLI</h2>
        </div>
        <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
      </div>
      <div className="ema-saw-prompt__scope">
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
      </div>
      <pre className="ema-saw-prompt__block">{promptText}</pre>
      <div className="ema-saw-prompt__actions">
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
    </section>
  );
}
