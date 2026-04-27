export type SurfaceId = 'marketing' | 'client' | 'talent' | 'admin';

export type ProductSurfaceId = Exclude<SurfaceId, 'marketing'>;

export type SurfaceDefinition = {
  id: SurfaceId;
  label: string;
  shortLabel: string;
  description: string;
  kicker: string;
};

export const DEFAULT_SURFACE: SurfaceId = 'marketing';

export const SURFACES: readonly SurfaceDefinition[] = [
  {
    id: 'marketing',
    label: 'Marketing',
    shortLabel: 'Marketing',
    description: 'Editorial landing experience and demand capture.',
    kicker: 'Narrative',
  },
  {
    id: 'client',
    label: 'Client App',
    shortLabel: 'Client',
    description: 'Hiring-side workspace for requests, matches, and approvals.',
    kicker: 'Demand',
  },
  {
    id: 'talent',
    label: 'Talent App',
    shortLabel: 'Talent',
    description: 'Worker-side workspace for profiles, work, and payouts.',
    kicker: 'Supply',
  },
  {
    id: 'admin',
    label: 'Admin',
    shortLabel: 'Admin',
    description: 'Operational control plane for review and compliance.',
    kicker: 'Ops',
  },
] as const;

const SURFACE_MAP: Record<SurfaceId, SurfaceDefinition> = SURFACES.reduce(
  (acc, surface) => {
    acc[surface.id] = surface;
    return acc;
  },
  {} as Record<SurfaceId, SurfaceDefinition>,
);

export function isSurfaceId(value: string): value is SurfaceId {
  return value in SURFACE_MAP;
}

export function getSurfaceDefinition(surface: SurfaceId): SurfaceDefinition {
  return SURFACE_MAP[surface];
}

