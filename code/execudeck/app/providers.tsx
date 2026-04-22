'use client';

import { TooltipProvider } from '@/src/components/ui/tooltip';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      {children}
    </TooltipProvider>
  );
}
