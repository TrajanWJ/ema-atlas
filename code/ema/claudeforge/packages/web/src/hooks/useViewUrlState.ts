"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface ViewUrlState {
  view: string;
  focus: string | null;
}

interface UseViewUrlStateOptions {
  defaultView: string;
}

export function useViewUrlState(options: UseViewUrlStateOptions) {
  const { defaultView } = options;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo<ViewUrlState>(() => {
    const view = searchParams.get("view") ?? defaultView;
    const focus = searchParams.get("focus");
    return { view, focus };
  }, [defaultView, searchParams]);

  const update = useCallback(
    (next: Partial<ViewUrlState>) => {
      const params = new URLSearchParams(searchParams.toString());
      const view = next.view ?? state.view;
      const focus = next.focus === undefined ? state.focus : next.focus;

      if (view && view !== defaultView) params.set("view", view);
      else params.delete("view");

      if (focus) params.set("focus", focus);
      else params.delete("focus");

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [defaultView, pathname, router, searchParams, state.focus, state.view]
  );

  return {
    state,
    setView: (view: string) => update({ view }),
    setFocus: (focus: string | null) => update({ focus }),
  };
}
