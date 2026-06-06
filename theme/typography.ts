/**
 * Typography tokens — font sizes and weights.
 * Use these values in StyleSheet objects where className is not available.
 */
export const typography = {
    fontSizes: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },
    fontWeights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
} as const;

export type Typography = typeof typography;
