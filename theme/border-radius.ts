/**
 * Border radius tokens — mirrors common Tailwind rounded-* values.
 */
export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
} as const;

export type BorderRadius = typeof borderRadius;
