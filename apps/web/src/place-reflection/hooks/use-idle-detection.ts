/**
 * use-idle-detection — resets a timer on any input event; returns
 * `isIdle = true` when the user has been quiet for `IDLE_THRESHOLD_MS`.
 *
 * Used by the donor Screensaver to dim the desktop during extended
 * inactivity. Pure DOM; no daemon or projection.
 */

import { useEffect, useState } from "react";

const IDLE_THRESHOLD_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "wheel",
];

export function useIdleDetection(): { isIdle: boolean } {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIsIdle(true), IDLE_THRESHOLD_MS);
    };
    const onActivity = () => {
      if (isIdle) setIsIdle(false);
      schedule();
    };

    schedule();
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    return () => {
      if (timer) clearTimeout(timer);
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
    };
  }, [isIdle]);

  return { isIdle };
}
