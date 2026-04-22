'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  useVariantStore,
  VARIANT_GROUPS,
  VARIANTS,
  type VariantGroup,
  type VariantId,
} from '../../lib/variantStore';

const GROUP_LABELS: Record<VariantGroup, string> = {
  light: 'LIGHT',
  dark: 'DARK',
  experimental: 'EXPERIMENTAL',
};

const GROUPS: VariantGroup[] = ['light', 'dark', 'experimental'];

function VariantButton({
  id,
  isActive,
  onSelect,
}: {
  id: VariantId;
  isActive: boolean;
  onSelect: (id: VariantId) => void;
}) {
  const variant = VARIANTS[id];

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="variant-nav-item"
      data-active={isActive || undefined}
    >
      <span
        className="variant-nav-dot"
        style={{ backgroundColor: variant.accent }}
      />
      <span className="variant-nav-label">{variant.label}</span>
    </button>
  );
}

export function VariantNav() {
  const activeVariantId = useVariantStore((s) => s.activeVariantId);
  const setVariant = useVariantStore((s) => s.setVariant);
  const [expanded, setExpanded] = useState(false);
  const [activeGroup, setActiveGroup] = useState<VariantGroup>(() => {
    const current = VARIANTS[activeVariantId];
    return current.group;
  });

  const handleGroupClick = useCallback(
    (group: VariantGroup) => {
      if (expanded && activeGroup === group) {
        setExpanded(false);
      } else {
        setActiveGroup(group);
        setExpanded(true);
      }
    },
    [expanded, activeGroup],
  );

  const handleVariantSelect = useCallback(
    (id: VariantId) => {
      setVariant(id);
    },
    [setVariant],
  );

  return (
    <motion.div
      className="variant-nav"
      drag
      dragMomentum={false}
      dragElastic={0.1}
      whileDrag={{ scale: 1.02 }}
    >
      {/* Group tabs */}
      <div className="variant-nav-tabs">
        {GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => handleGroupClick(group)}
            className="variant-nav-tab"
            data-active={
              expanded && activeGroup === group ? '' : undefined
            }
          >
            {GROUP_LABELS[group]}
          </button>
        ))}
      </div>

      {/* Expanded variant list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="variant-nav-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {VARIANT_GROUPS[activeGroup].map((id) => (
              <VariantButton
                key={id}
                id={id}
                isActive={activeVariantId === id}
                onSelect={handleVariantSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
