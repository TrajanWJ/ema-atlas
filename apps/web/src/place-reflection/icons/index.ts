/**
 * Bridge — re-export donor icons. The donor icons folder is pure SVG
 * chrome (Category A classification: no state wiring needed). Re-export
 * keeps donor files verbatim while giving our tsconfig.path mapping
 * `@/src/components/icons` a target inside place-reflection.
 *
 * RIP: place.org
 */

export * from "../../place-donor/place-org/components/icons";
