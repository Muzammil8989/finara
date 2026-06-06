/**
 * Spacing scale — mirrors the Tailwind spacing tokens used in NativeWind.
 * Use these values in StyleSheet objects where className is not available.
 */
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
} as const;

export type Spacing = typeof spacing;
