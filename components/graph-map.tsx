import Link from "next/link";

import { parts } from "@/lib/ema-atlas";

const positions = [
  { left: "8%", top: "12%" },
  { left: "34%", top: "8%" },
  { left: "62%", top: "10%" },
  { left: "76%", top: "30%" },
  { left: "58%", top: "54%" },
  { left: "30%", top: "58%" },
  { left: "10%", top: "46%" },
  { left: "40%", top: "32%" }
];

export function GraphMap() {
  return (
    <div className="graph">
      <svg aria-hidden className="graph__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M12 18 C25 10, 32 12, 38 18" />
        <path d="M40 18 C52 14, 60 14, 66 18" />
        <path d="M68 18 C80 18, 84 24, 82 34" />
        <path d="M82 36 C78 50, 70 58, 62 60" />
        <path d="M60 60 C48 66, 34 68, 22 58" />
        <path d="M20 56 C14 48, 12 38, 14 28" />
        <path d="M22 50 C30 40, 34 36, 44 34" />
        <path d="M44 34 C52 34, 58 40, 60 50" />
      </svg>
      {parts.map((part, index) => (
        <Link
          key={part.slug}
          href={`/parts/${part.slug}`}
          className="graph__node"
          style={positions[index]}
        >
          <span>{part.title}</span>
        </Link>
      ))}
    </div>
  );
}
