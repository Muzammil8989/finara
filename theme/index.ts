/**
 * Theme — single barrel export for all design tokens.
 *
 * Usage:
 *   import { lightColors, darkColors, spacing, typography, shadows } from '@/theme';
 */

export { lightColors, darkColors } from './colors';
export type { AppColorTheme, ColorScheme } from './colors';

export { spacing } from './spacing';
export type { Spacing } from './spacing';

export { fonts, tabularNums, typography } from './typography';
export type { Typography } from './typography';

export { shadows } from './shadows';
export type { Shadows } from './shadows';

export { borderRadius } from './border-radius';
export type { BorderRadius } from './border-radius';
