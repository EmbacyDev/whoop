/**
 * Shared breakpoint values.
 *
 * The Figma file only provides mobile (375) and desktop (1440) comps.
 * The tablet range below is an inferred midpoint (not present in the
 * design) so layouts move smoothly from mobile stacking to the desktop
 * grid instead of jumping straight from one to the other.
 */
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1200,
  wide: 1920,
} as const;

export const mq = {
  tablet: `(min-width: ${breakpoints.tablet}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px)`,
  wide: `(min-width: ${breakpoints.wide}px)`,
} as const;
