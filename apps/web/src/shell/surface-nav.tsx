import { NavLink } from "react-router-dom";
import { surfaceLinks } from "../app/mock-projections";

export function SurfaceNav() {
  return (
    <nav className="ema-surface-nav" aria-label="EMA surfaces">
      {surfaceLinks.map((surface) => (
        <NavLink
          key={surface.id}
          to={surface.path}
          end={surface.path === "/"}
          className={({ isActive }) =>
            isActive ? "ema-surface-nav__item is-active" : "ema-surface-nav__item"
          }
        >
          <span>{surface.eyebrow}</span>
          <strong>{surface.label}</strong>
        </NavLink>
      ))}
    </nav>
  );
}
