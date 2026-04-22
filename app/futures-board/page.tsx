import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { FuturesGrid, type FuturesGridItem } from "@/components/futures-grid";
import { parts } from "@/lib/ema-atlas";

type StanceKey = FuturesGridItem["stanceKey"];

const STANCE_KEYS: StanceKey[] = [
  "operator-cathedral",
  "living-workspace",
  "mesh-commonwealth"
];

const STANCE_LABELS: Record<StanceKey, string> = {
  "operator-cathedral": "Operator Cathedral",
  "living-workspace": "Living Workspace",
  "mesh-commonwealth": "Mesh Commonwealth"
};

function deriveStance(visionId: string): StanceKey | null {
  for (const key of STANCE_KEYS) {
    if (visionId.endsWith(`-${key}`)) return key;
  }
  return null;
}

function buildItems(): FuturesGridItem[] {
  const items: FuturesGridItem[] = [];
  for (const part of parts) {
    for (const vision of part.visions) {
      const stanceKey = deriveStance(vision.id);
      if (!stanceKey) continue;
      items.push({
        vision,
        part,
        stanceKey,
        stanceLabel: STANCE_LABELS[stanceKey]
      });
    }
  }
  return items;
}

type SearchParams = Promise<{ stance?: string }>;

export default async function FuturesBoardPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const resolved = (await searchParams) ?? {};
  const stanceParam = resolved.stance;
  const activeStance: StanceKey | "all" =
    stanceParam && (STANCE_KEYS as string[]).includes(stanceParam)
      ? (stanceParam as StanceKey)
      : "all";

  const all = buildItems();
  const filtered =
    activeStance === "all" ? all : all.filter((item) => item.stanceKey === activeStance);

  const tabs: { key: StanceKey | "all"; label: string }[] = [
    { key: "all", label: "All Stances" },
    ...STANCE_KEYS.map((key) => ({ key, label: STANCE_LABELS[key] }))
  ];

  return (
    <SiteShell
      eyebrow="Futures Board"
      title="Twenty-four futures."
      intro="Three universal stances, eight EMA parts, twenty-four specific futures. Filter by stance to see how the same disposition plays out across every part of the system."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Filter / Stance</p>
          <h2 className="panel__title">Group by stance</h2>
          <p className="panel__lede">
            Each EMA part carries three competing futures. Pick a stance to see the parallel
            argument made eight times across the system, or hold all three at once.
          </p>
          <div className="panel__actions">
            {tabs.map((tab) => {
              const href =
                tab.key === "all" ? "/futures-board" : `/futures-board?stance=${tab.key}`;
              const active = activeStance === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={href}
                  className="chip"
                  style={
                    active
                      ? {
                          borderColor: "var(--accent)",
                          color: "var(--text)",
                          background: "var(--accent-soft)"
                        }
                      : undefined
                  }
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <FuturesGrid
          visions={filtered}
          groupBy={activeStance === "all" ? "stance" : "none"}
        />
      </section>
    </SiteShell>
  );
}
