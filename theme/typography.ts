/**
 * Typography tokens — font sizes, weights and families.
 * Use these values in StyleSheet objects where className is not available.
 *
 * Editorial system:
 *   serif  (Playfair Display)   — mastheads, screen titles, section heads
 *   sans   (Plus Jakarta Sans)  — UI text, labels, body
 *   figure (Space Grotesk)      — money and numbers, always tabular
 */
export const fonts = {
    serif: 'PlayfairDisplay_600SemiBold',
    serifBold: 'PlayfairDisplay_700Bold',
    serifItalic: 'PlayfairDisplay_400Regular_Italic',
    sans: 'PlusJakartaSans_400Regular',
    sansMedium: 'PlusJakartaSans_500Medium',
    sansSemiBold: 'PlusJakartaSans_600SemiBold',
    sansBold: 'PlusJakartaSans_700Bold',
    figure: 'SpaceGrotesk_500Medium',
    figureSemiBold: 'SpaceGrotesk_600SemiBold',
    figureBold: 'SpaceGrotesk_700Bold',
} as const;

export const typography = {
    fonts,
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

/** Spread into a Text style for aligned columns of money. */
export const tabularNums = { fontVariant: ['tabular-nums' as const] };

export type Typography = typeof typography;
