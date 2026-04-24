import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Region 7 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 7".
// Single card: scope summary + agent_instruction + copy-to-clipboard. The
// prompt block is how external Codex / Claude CLI sessions inherit EMA scope.
import { useCallback, useState } from "react";
import { EMA_SCOPE, MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";
function buildPrompt(missionTitle, laneTitle) {
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
    const promptText = buildPrompt(primaryMission?.title ?? "(no active mission)", primaryLane?.title ?? "(no active lane)");
    const [copied, setCopied] = useState(false);
    const onCopy = useCallback(() => {
        if (typeof navigator === "undefined" || !navigator.clipboard)
            return;
        navigator.clipboard.writeText(promptText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        });
    }, [promptText]);
    return (_jsxs("section", { className: "ema-panel ema-saw-region ema-saw-prompt", "aria-label": "Agent instruction panel", children: [_jsxs("div", { className: "ema-panel__heading", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "agent instruction panel" }), _jsx("h2", { children: "Prompt block for external Codex / Claude CLI" })] }), _jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL })] }), _jsxs("div", { className: "ema-saw-prompt__scope", children: [_jsxs("div", { children: [_jsx("dt", { children: "mission" }), _jsx("dd", { children: primaryMission?.title ?? "—" })] }), _jsxs("div", { children: [_jsx("dt", { children: "lane" }), _jsx("dd", { children: primaryLane?.title ?? "—" })] }), _jsxs("div", { children: [_jsx("dt", { children: "org / space / project" }), _jsxs("dd", { children: [EMA_SCOPE.orgName, " / ", EMA_SCOPE.spaceName, " / ", EMA_SCOPE.projectName] })] })] }), _jsx("pre", { className: "ema-saw-prompt__block", children: promptText }), _jsxs("div", { className: "ema-saw-prompt__actions", children: [_jsx("button", { type: "button", className: "ema-saw-cmd-btn__copy ema-saw-prompt__copy", onClick: onCopy, children: copied ? "copied" : "copy prompt" }), _jsxs("small", { className: "ema-saw-cli-hint", children: ["ema agent prompt --actor actor:<id> --mission ", primaryMission?.id ?? "<id>"] })] })] }));
}
