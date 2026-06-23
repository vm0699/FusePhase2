/**
 * Fuse design system — single entry point.
 *
 * Usage in components:
 *   import { useTheme } from '../app/theme';
 *   const t = useTheme();
 *   ...color: t.colors.brand, ...t.typography.h1
 *
 * Or, in non-component / StyleSheet contexts:
 *   import { theme } from '../app/theme';
 *
 * Today this always returns the light theme. When dark mode is added, only
 * `useTheme()` needs to branch on a color-scheme — call sites stay unchanged.
 */
import { lightColors, tonePairs, type ColorTokens, type ToneKey } from './colors';
import { typography, fontFamily, type TypographyScale } from './typography';
import { spacing, type SpacingKey } from './spacing';
import { radii, type RadiusKey } from './radii';
import { shadows, type ShadowKey } from './shadows';

export type Theme = {
  colors: ColorTokens;
  typography: TypographyScale;
  fontFamily: typeof fontFamily;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  tonePairs: Record<ToneKey, { bg: string; fg: string }>;
};

export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  fontFamily,
  spacing,
  radii,
  shadows,
  tonePairs,
};

/** Static theme for StyleSheet.create() and other non-hook contexts. */
export const theme = lightTheme;

/** Hook accessor — the future dark-mode swap point. */
export function useTheme(): Theme {
  return lightTheme;
}

export { lightColors, tonePairs, typography, fontFamily, spacing, radii, shadows };
export type { ColorTokens, ToneKey, TypographyScale, SpacingKey, RadiusKey, ShadowKey };
