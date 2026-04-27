"use client";

/**
 * useDockAutohide — hot-zone-reveal for the dock when a window is
 * maximized AND autohide is enabled. Direct-rip from donor with relative
 * imports to our bridges.
 *
 * RIP: place.org src/hooks/use-dock-autohide.ts
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useWindowStore } from "../shell-state/window-store-bridge";
import { useDesktopStore } from "../shell-state/desktop-store-bridge";

const HOT_ZONE_PX = 8;
const HIDE_DELAY_MS = 1000;
const DRAG_NEAR_BOTTOM_PX = 60;

export function useDockAutohide(): { isHidden: boolean } {
  const [isHidden, setIsHidden] = useState(false);
  const windows = useWindowStore((s) => s.windows);
  const autohideEnabled = useDesktopStore((s) => s.dockAutohideEnabled);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasMaximizedWindow = Array.from(windows.values()).some(
    (w) => w.maximized,
  );

  const shouldAutohide = autohideEnabled && hasMaximizedWindow;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showDock = useCallback(() => {
    clearHideTimer();
    setIsHidden(false);
  }, [clearHideTimer]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsHidden(true);
    }, HIDE_DELAY_MS);
  }, [clearHideTimer]);

  useEffect(() => {
    if (!shouldAutohide) {
      setIsHidden(false);
      clearHideTimer();
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      const distFromBottom = window.innerHeight - event.clientY;
      const isButtonHeld = (event.buttons & 1) !== 0;
      const threshold = isButtonHeld ? DRAG_NEAR_BOTTOM_PX : HOT_ZONE_PX;

      if (distFromBottom <= threshold) {
        showDock();
      } else if (hideTimerRef.current === null) {
        scheduleHide();
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    scheduleHide();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearHideTimer();
    };
  }, [shouldAutohide, showDock, scheduleHide, clearHideTimer]);

  if (!shouldAutohide) return { isHidden: false };
  return { isHidden };
}
