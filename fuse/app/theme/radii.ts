/**
 * Fuse border-radius scale. `pill` is fully-rounded.
 * Matches the rounding already used across cards (16-24) and buttons (20-30).
 */
export const radii = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radii;
