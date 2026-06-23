/**
 * Fuse typography tokens.
 *
 * Encodes the Poppins type rhythm already used across the app into a named,
 * reusable scale. Each entry is a ready-to-spread RN text style fragment
 * (fontFamily + fontSize + lineHeight + letterSpacing).
 *
 * Font families are loaded in AppNav.js via @expo-google-fonts/poppins:
 *   'Poppins'           -> 400
 *   'Poppins-SemiBold'  -> 600
 *   'Poppins-Bold'      -> 700
 */
import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Poppins',
  semibold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
} as const;

export type TypeToken = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'
>;

export type TypographyScale = {
  display: TypeToken; // hero / onboarding question
  h1: TypeToken; // screen titles
  h2: TypeToken; // section titles
  title: TypeToken; // card titles / modal titles
  body: TypeToken; // default body
  bodySm: TypeToken; // secondary body
  label: TypeToken; // semibold labels / list item names
  caption: TypeToken; // hints / metadata
  overline: TypeToken; // uppercase eyebrow
  button: TypeToken; // button text
};

export const typography: TypographyScale = {
  display: {
    fontFamily: fontFamily.regular,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 0.2,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.2,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
  },
  button: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    lineHeight: 22,
  },
};
