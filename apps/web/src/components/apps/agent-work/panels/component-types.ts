import type {
  AgentWorkspaceProjection,
  AgentWorkspaceSource,
  EventTrailProjection,
} from "../projection";

export type AgentWorkspacePanelProps = {
  projection: AgentWorkspaceProjection;
  sourceLabel: AgentWorkspaceSource;
  isLive?: boolean;
  tick?: VcalendarTickView;
};

export type ChroniclePanelProps = AgentWorkspacePanelProps & {
  eventTrail: EventTrailProjection | null;
};

export type VcalendarTickView = {
  phase: string;
  mode: "planning" | "execution" | "review" | "handoff" | "maintenance";
  nextTick: string;
  instructions: string[];
};

export function sourcePillClass(isLive?: boolean): string {
  return isLive ? "ema-pill" : "ema-pill ema-pill--hot";
}
