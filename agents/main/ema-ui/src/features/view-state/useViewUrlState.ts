export type ViewUrlState = {
  viewMode?: string;
  activeTab?: string;
  selectedId?: string;
  timeRange?: string;
  savedViewId?: string;
};

export function useViewUrlState(): {
  state: ViewUrlState;
  setState: (next: Partial<ViewUrlState>) => void;
} {
  return {
    state: {},
    setState: () => undefined,
  };
}
