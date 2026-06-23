/**
 * Fuse color tokens.
 *
 * Semantic, theme-able color palette derived from the values that were
 * previously hardcoded across screens. Light-only today, but the shape
 * (a flat `ColorTokens` object behind `useTheme()`) is intentionally
 * structured so a dark palette can be added later with zero call-site changes.
 *
 * Do NOT add raw hex values in screens anymore — reference these tokens.
 */

export type ColorTokens = {
  // Brand
  brand: string;
  brandPressed: string;
  brandSoft: string;
  brandSofter: string;
  brandBorder: string;
  onBrand: string;

  // Backgrounds / surfaces
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;

  // Decorative orbs (used by Screen wrapper)
  orbOne: string;
  orbTwo: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnBrand: string;

  // Lines
  border: string;
  divider: string;

  // Semantic tone pairs (bg + fg) — kept consistent with FusePopup / GiftStatusBadge
  successBg: string;
  successFg: string;
  errorBg: string;
  errorFg: string;
  infoBg: string;
  infoFg: string;
  warningBg: string;
  warningFg: string;

  // Overlays / scrims
  overlay: string;
  overlaySoft: string;

  // Skeleton shimmer
  skeletonBase: string;
  skeletonHighlight: string;
};

export const lightColors: ColorTokens = {
  // Brand
  brand: '#ff5864',
  brandPressed: '#F5414E',
  brandSoft: '#FFF1F3',
  brandSofter: '#FFF5F5',
  brandBorder: '#FFD8DD',
  onBrand: '#ffffff',

  // Backgrounds / surfaces
  bg: '#FAF8F3',
  surface: '#ffffff',
  surfaceAlt: '#F9FAFB',
  surfaceSunken: '#F3F4F6',

  // Decorative orbs
  orbOne: '#FFF0F2',
  orbTwo: '#FFE4E8',

  // Text
  textPrimary: '#1a1a1a',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnBrand: '#ffffff',

  // Lines
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Semantic
  successBg: '#ECFDF5',
  successFg: '#059669',
  errorBg: '#FEF2F2',
  errorFg: '#DC2626',
  infoBg: '#EFF6FF',
  infoFg: '#2563EB',
  warningBg: '#FEF3C7',
  warningFg: '#B45309',

  // Overlays
  overlay: 'rgba(17,24,39,0.45)',
  overlaySoft: 'rgba(17,24,39,0.25)',

  // Skeleton
  skeletonBase: '#ECEAE4',
  skeletonHighlight: '#F6F4EF',
};

export type ToneKey = 'default' | 'success' | 'error' | 'info' | 'warning';

/** Tone bg/fg pairs — mirrors the existing FusePopup tone map so popups/badges stay in sync. */
export const tonePairs: Record<ToneKey, { bg: string; fg: string }> = {
  default: { bg: lightColors.brandSoft, fg: lightColors.brand },
  success: { bg: lightColors.successBg, fg: lightColors.successFg },
  error: { bg: lightColors.errorBg, fg: lightColors.errorFg },
  info: { bg: lightColors.infoBg, fg: lightColors.infoFg },
  warning: { bg: lightColors.warningBg, fg: lightColors.warningFg },
};
