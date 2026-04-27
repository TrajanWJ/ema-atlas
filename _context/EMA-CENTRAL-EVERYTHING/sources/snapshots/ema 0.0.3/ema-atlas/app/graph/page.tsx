import { SiteShell } from "@/components/site-shell";
import { GraphMap } from "@/components/graph-map";

export default function GraphPage() {
  return (
    <SiteShell
      eyebrow="System Graph"
      title="EMA Constellation"
      intro="A quick visual map of the major EMA parts in this deliverables phase. It is intentionally more relational than hierarchical so the tensions stay visible."
    >
      <GraphMap />
    </SiteShell>
  );
}
