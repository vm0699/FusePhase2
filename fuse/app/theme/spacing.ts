/**
 * Fuse spacing scale — 4-point grid.
 * Use these instead of arbitrary margin/padding numbers for vertical rhythm
 * and consistent gutters. `screenX` is the standard horizontal screen gutter.
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  // Common layout constants
  screenX: 24, // default horizontal screen padding
  gutter: 16, // list / card gutter
  bottomNavSafe: 92, // bottom padding so content clears the floating BottomNav
} as const;

export type SpacingKey = keyof typeof spacing;
