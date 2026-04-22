# Proslync page cleanliness pass — 2026-04-14

## Cleaned now

### Shared presentation
- Tightened `PortalHero` spacing and visual hierarchy.
- Added a more product-like logo tile / eyebrow treatment.
- Made hero action rows and stat tiles wrap more gracefully on narrower screens.
- Standardized stat labels to read more like dashboard metadata than placeholder copy.

### Brand portal
- `DiscoverScreen`
  - Pulled search + filters into a cleaner control card.
  - Added clearer helper copy and a visible “clear filters” affordance.
  - Improved empty-state presentation so it feels intentional instead of skeletal.
- `CampaignsScreen`
  - Added a proper hero summary at the top so the page has context before raw lists.
  - Changed cramped metrics row into a more flexible wrapped layout.
  - Cleaned the AI command CTA card and empty-state copy.
  - Reworked campaign cards so budget / spend / athlete count read as cleaner metric pills.

## Still rough
- Some portal pages still mix prototype phrasing with finished-product phrasing.
- A few older screens likely still rely on denser legacy layouts rather than the new hero/control-card rhythm.
- Cross-screen spacing tokens are still mostly implicit inline styles rather than shared constants.
- Empty states, list headers, and CTA hierarchy are not yet fully standardized across athlete / fan / admin surfaces.

## Best next move
- Do one more pass focused on **screen-level consistency**:
  1. normalize top spacing + headers across every portal home/index page,
  2. standardize empty-state components,
  3. standardize metrics grids/card density,
  4. then polish copy tone so every screen sounds like the same product.
