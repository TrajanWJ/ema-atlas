import { Outlet } from "react-router-dom";
import { SurfaceNav } from "./surface-nav";
import { Topbar } from "./topbar";

/**
 * ShellLayout — the frame every route renders inside.
 *
 * Topbar carries org/space/project selectors; body is the current
 * route's element.
 */
export function ShellLayout() {
  return (
    <div className="ema-shell">
      <Topbar />
      <div className="ema-shell__grid">
        <SurfaceNav />
        <main className="ema-shell__body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
