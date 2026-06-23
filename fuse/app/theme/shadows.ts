/**
 * Fuse elevation presets (cross-platform).
 *
 * Three tiers matching the shadow patterns already used across the app:
 *   subtle  -> list cards / pills
 *   medium  -> floating elements / raised cards
 *   strong  -> modals / popups
 *
 * Each preset is a ready-to-spread style fragment. A `brand`-tinted variant
 * is provided for accent surfaces (e.g. active nav bubble, primary CTA).
 */
import type { ViewStyle } from 'react-native';

type Shadow = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const shadows: Record<'none' | 'subtle' | 'medium' | 'strong' | 'brand', Shadow> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  brand: {
    shadowColor: '#ff5864',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
};

export type ShadowKey = keyof typeof shadows;
