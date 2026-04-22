import { SiteShell } from "@/components/site-shell";
import { ShowroomWall } from "@/components/showroom-wall";

export default function ShowroomPage() {
  return (
    <SiteShell
      eyebrow="Deliverables Showroom"
      title="EMA Showroom"
      intro="A polished route for walking the current EMA phase as a gallery of deliverables: briefs, slides, canvases, graph views, desktop demos, mockups, and the implementation tracks that hold them together."
    >
      <ShowroomWall />
    </SiteShell>
  );
}
