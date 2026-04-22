import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  active?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
}

export function GlassCard({ children, className = '', active, onClick, hoverable = false }: GlassCardProps) {
  return (
    <motion.div
      className={`
        bg-card/95 border border-white/[0.07] rounded-xl
        ${active ? 'border-l-[3px] border-l-cyan bg-cyan/[0.04]' : ''}
        ${hoverable ? 'cursor-pointer hover:border-white/[0.15] hover:scale-[1.01]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-150
        ${className}
      `}
      onClick={onClick}
      whileHover={hoverable ? { scale: 1.01 } : undefined}
      layout
    >
      {children}
    </motion.div>
  );
}
