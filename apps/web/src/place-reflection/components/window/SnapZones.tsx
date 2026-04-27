"use client";

/**
 * SnapZones — drag-preview overlay showing the half/quarter the window
 * will snap to on release.
 *
 * RIP: place.org src/components/window-manager/SnapZones.tsx (direct-rip
 * with provenance; imports rewritten to place-reflection paths).
 */

import { motion, AnimatePresence } from "motion/react";
import { useSnapZones, type SnapZoneDetectionInput } from "../../hooks/use-snap-zones";
import type { SnapZoneType } from "../../types/snap-zones";

interface SnapZonesProps {
  readonly dragPosition: SnapZoneDetectionInput | null;
}

const SNAP_ZONE_STYLES: Record<
  SnapZoneType,
  { borderClass: string; highlightClass: string }
> = {
  "left-half": { borderClass: "border-l-2", highlightClass: "left-0" },
  "right-half": { borderClass: "border-r-2", highlightClass: "right-0" },
  "top-half": { borderClass: "border-t-2", highlightClass: "top-0" },
  "bottom-half": { borderClass: "border-b-2", highlightClass: "bottom-0" },
  "top-left-quarter": { borderClass: "border-t-2 border-l-2", highlightClass: "top-0 left-0" },
  "top-right-quarter": { borderClass: "border-t-2 border-r-2", highlightClass: "top-0 right-0" },
  "bottom-left-quarter": {
    borderClass: "border-b-2 border-l-2",
    highlightClass: "bottom-0 left-0",
  },
  "bottom-right-quarter": {
    borderClass: "border-b-2 border-r-2",
    highlightClass: "bottom-0 right-0",
  },
};

export function SnapZones({ dragPosition }: SnapZonesProps) {
  const detected = useSnapZones(dragPosition ?? { x: -1, y: -1 });
  const zone = dragPosition ? detected.zone : null;
  const bounds = dragPosition ? detected.bounds : null;

  if (!zone || !bounds) {
    return null;
  }

  const styles = SNAP_ZONE_STYLES[zone];

  return (
    <AnimatePresence>
      <motion.div
        key={`snap-zone-${zone}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className={`pointer-events-none fixed ${styles.borderClass} border-dashed`}
        style={{
          left: `${bounds.x}px`,
          top: `${bounds.y}px`,
          width: `${bounds.width}px`,
          height: `${bounds.height}px`,
          borderColor: "var(--place-secondary-400, rgba(45, 212, 168, 0.7))",
          backgroundColor:
            "color-mix(in srgb, var(--place-secondary-400, rgba(45, 212, 168, 0.7)) 8%, transparent)",
          zIndex: 40,
        }}
      />
    </AnimatePresence>
  );
}
