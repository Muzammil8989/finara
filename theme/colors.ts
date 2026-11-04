import tokens from './tokens';

export type ColorScheme = 'light' | 'dark';
export type AppColorTheme = typeof lightColors;

const { brand, light, dark } = tokens;

// Base neutrals (warm greys) for both themes
const neutral = {
    black: '#0E0C0A',
    white: '#FFFFFF',

    gray900: '#1A1714',
    gray800: '#2A2620',
    gray700: '#3D382F',
    gray600: '#6B6359',
    gray500: '#8C8478',
    gray400: '#B3AA9C',
    gray300: '#D8CDBC',
    gray200: '#E9E1D4',
    gray100: '#F3ECE0',
};

// --------- LIGHT THEME ---------

export const lightColors = {
    scheme: 'light' as ColorScheme,

    ...brand,
    ...neutral,

    // Editorial aliases
    paper: light.background,
    ink: light.textPrimary,
    inkMuted: light.textMuted,
    rule: light.divider,
    accent: light.accent,
    income: light.income,
    expense: light.expense,

    // App backgrounds
    background: light.background,
    backgroundAlt: light.backgroundAlt,
    surface: light.surface,
    surfaceAlt: light.surfaceAlt,

    // Text
    textPrimary: light.textPrimary,
    textSecondary: light.textSecondary,
    textMuted: light.textMuted,
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textOnDanger: '#FFFFFF',

    // Borders / dividers
    borderSoft: light.borderSoft,
    borderStrong: light.borderStrong,
    divider: light.divider,

    // Status colors (semantic)
    success: light.income,
    successBg: light.successBg,
    successBorder: light.successBorder,
    successText: light.successText,

    warning: light.warning,
    warningBg: light.warningBg,
    warningBorder: light.warningBorder,
    warningText: light.warningText,

    error: light.expense,
    errorBg: light.errorBg,
    errorBorder: light.errorBorder,
    errorText: light.errorText,

    info: brand.primary,
    infoBg: light.infoBg,
    infoBorder: light.infoBorder,
    infoText: light.infoText,

    // Buttons
    btnPrimaryBg: brand.primary,
    btnPrimaryBgPressed: brand.primaryDark,
    btnPrimaryText: '#FFFFFF',

    btnSecondaryBg: brand.secondary,
    btnSecondaryBgPressed: brand.secondaryDark,
    btnSecondaryText: '#FFFFFF',

    btnGhostBg: 'transparent',
    btnGhostBgPressed: 'rgba(13, 92, 99, 0.08)',
    btnGhostText: brand.primary,

    btnDisabledBg: light.borderSoft,
    btnDisabledText: light.textMuted,

    // Inputs
    inputBg: light.surface,
    inputBorder: light.borderStrong,
    inputBorderFocused: brand.primary,
    inputText: light.textPrimary,
    inputPlaceholder: light.textMuted,

    // Chips / pills / tags
    tagDefaultBg: light.backgroundAlt,
    tagDefaultText: light.textSecondary,
    tagIncomeBg: light.successBg,
    tagIncomeText: light.successText,
    tagExpenseBg: light.errorBg,
    tagExpenseText: light.errorText,

    // Charts
    chartIncome: light.income,
    chartExpense: light.expense,
    chartSavings: brand.primary,
    chartGrid: light.divider,
    chartAxis: light.textMuted,
    chartCategorical: tokens.chartCategorical,

    // Overlays
    overlay: 'rgba(26, 23, 20, 0.45)',
};

// --------- DARK THEME ---------

export const darkColors: AppColorTheme = {
    ...lightColors,
    scheme: 'dark',

    // Mid teal: white labels on it stay AA (4.7:1) and it still reads as an
    // icon on dark paper (3.9:1). Use `accent` for small teal text.
    primary: '#2E7F84',
    primaryDark: '#256A6E',
    primaryLight: dark.accent,

    paper: dark.background,
    ink: dark.textPrimary,
    inkMuted: dark.textMuted,
    rule: dark.divider,
    accent: dark.accent,
    income: dark.income,
    expense: dark.expense,

    background: dark.background,
    backgroundAlt: dark.backgroundAlt,
    surface: dark.surface,
    surfaceAlt: dark.surfaceAlt,

    textPrimary: dark.textPrimary,
    textSecondary: dark.textSecondary,
    textMuted: dark.textMuted,

    borderSoft: dark.borderSoft,
    borderStrong: dark.borderStrong,
    divider: dark.divider,

    success: dark.income,
    successBg: dark.successBg,
    successBorder: dark.successBorder,
    successText: dark.successText,

    warning: dark.warning,
    warningBg: dark.warningBg,
    warningBorder: dark.warningBorder,
    warningText: dark.warningText,

    error: dark.expense,
    errorBg: dark.errorBg,
    errorBorder: dark.errorBorder,
    errorText: dark.errorText,

    info: dark.accent,
    infoBg: dark.infoBg,
    infoBorder: dark.infoBorder,
    infoText: dark.infoText,

    btnPrimaryBg: '#2E7F84',
    btnPrimaryBgPressed: '#256A6E',

    btnGhostBgPressed: 'rgba(255, 255, 255, 0.06)',
    btnGhostText: dark.textPrimary,

    btnDisabledBg: dark.surfaceAlt,
    btnDisabledText: dark.textMuted,

    inputBg: dark.surface,
    inputBorder: dark.borderStrong,
    inputBorderFocused: dark.accent,
    inputText: dark.textPrimary,
    inputPlaceholder: dark.textMuted,

    tagDefaultBg: dark.surfaceAlt,
    tagDefaultText: dark.textPrimary,
    tagIncomeBg: dark.successBg,
    tagIncomeText: dark.successText,
    tagExpenseBg: dark.errorBg,
    tagExpenseText: dark.errorText,

    chartIncome: dark.income,
    chartExpense: dark.expense,
    chartSavings: dark.accent,
    chartGrid: dark.divider,
    chartAxis: dark.textMuted,
    chartCategorical: tokens.chartCategoricalDark,

    overlay: 'rgba(0, 0, 0, 0.6)',
};
