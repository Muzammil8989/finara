
export type AppColorTheme = typeof lightColors;

// Shared brand + status palette (base colors)
const brand = {
    primary: "#246BFD",       // Blue Primary
    primaryDark: "#1E56D8",
    primaryLight: "#4D84FF",

    secondary: "#3B82F6",     // Blue Secondary
    secondaryDark: "#2563EB",
    secondaryLight: "#60A5FA",
};

const status = {
    success: "#10B981",       // New Emerald
    successDark: "#059669",
    successLight: "#ECFDF5",

    warning: "#F59E0B",
    warningDark: "#D97706",
    warningLight: "#FEF3C7",

    error: "#EF4444",         // New Red
    errorDark: "#DC2626",
    errorLight: "#FEF2F2",

    info: "#3B82F6",
    infoDark: "#2563EB",
    infoLight: "#EFF6FF",
};

// Base neutrals for both themes
const neutral = {
    black: "#0A0A0A",
    white: "#FFFFFF",

    gray900: "#111418",
    gray800: "#1C1F26",
    gray700: "#3A3F48",
    gray600: "#6C737F",
    gray500: "#8D96A5",
    gray400: "#B4BCC6",
    gray300: "#D3D9E1",
    gray200: "#E6ECF1",
    gray100: "#F4F7FA",
};

// --------- LIGHT THEME ---------

export const lightColors = {
    scheme: "light" as const,

    // Brand
    ...brand,

    // Neutrals
    ...neutral,

    // App backgrounds
    background: "#F4F7FA",      // main screen background
    backgroundAlt: "#EDEFF5",   // secondary background
    surface: "#FFFFFF",         // cards, panels
    surfaceAlt: "#FAFCFE",

    // Text
    textPrimary: "#1C1C1C",
    textSecondary: "#6C737F",
    textMuted: "#9AA5B1",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#FFFFFF",
    textOnDanger: "#FFFFFF",

    // Borders / dividers
    borderSoft: "#E6ECF1",
    borderStrong: "#D3D9E1",
    divider: "#E0E4EB",

    // Status colors (semantic)
    success: status.success,
    successBg: status.successLight,
    successBorder: "#B2E3C4",
    successText: "#165B37",

    warning: status.warning,
    warningBg: status.warningLight,
    warningBorder: "#F0D98C",
    warningText: "#725413",

    error: status.error,
    errorBg: status.errorLight,
    errorBorder: "#F3B3B3",
    errorText: "#7D2525",

    info: status.info,
    infoBg: status.infoLight,
    infoBorder: "#B8DAF5",
    infoText: "#13456B",

    // Buttons
    btnPrimaryBg: brand.primary,
    btnPrimaryBgPressed: brand.primaryDark,
    btnPrimaryText: "#FFFFFF",

    btnSecondaryBg: brand.secondary,
    btnSecondaryBgPressed: brand.secondaryDark,
    btnSecondaryText: "#FFFFFF",

    btnGhostBg: "transparent",
    btnGhostBgPressed: "rgba(36, 107, 253, 0.08)",
    btnGhostText: brand.primary,

    btnDisabledBg: "#E6ECF1",
    btnDisabledText: "#9AA5B1",

    // Inputs
    inputBg: "#FFFFFF",
    inputBorder: "#D3D9E1",
    inputBorderFocused: brand.primary,
    inputText: "#1C1C1C",
    inputPlaceholder: "#9AA5B1",

    // Chips / pills / tags
    tagDefaultBg: "#E6ECF1",
    tagDefaultText: "#3A3F48",
    tagIncomeBg: "#E6F6EC",
    tagIncomeText: "#165B37",
    tagExpenseBg: "#FDECEC",
    tagExpenseText: "#7D2525",

    // Charts
    chartIncome: "#00BFA6",
    chartExpense: "#246BFD",
    chartSavings: "#F2C94C",

    // Overlays
    overlay: "rgba(0, 0, 0, 0.4)",

    // Gradients for use with expo-linear-gradient (as arrays)
    gradientPrimary: ["#246BFD", "#00BFA6"],
    gradientCard: ["#FFFFFF", "#F4F7FA"],
    gradientHero: ["#246BFD", "#2D9CDB"],
};

// --------- DARK THEME ---------

export const darkColors = {
    scheme: "dark" as const,

    // Brand (same brand hues, they pop nicely on dark)
    ...brand,

    // Neutrals reused (for utility)
    ...neutral,

    // App backgrounds
    background: "#0E1117",
    backgroundAlt: "#05070A",
    surface: "#151A21",
    surfaceAlt: "#1C212A",

    // Text
    textPrimary: "#DDE7F0",
    textSecondary: "#9AA5B1",
    textMuted: "#6C737F",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#FFFFFF",
    textOnDanger: "#FFFFFF",

    // Borders / dividers
    borderSoft: "#2A2F38",
    borderStrong: "#3A3F48",
    divider: "#232832",

    // Status colors (semantic)
    success: status.success,
    successBg: "#123524",
    successBorder: "#1E6F41",
    successText: "#A3E8BC",

    warning: status.warning,
    warningBg: "#3A300F",
    warningBorder: "#8E7122",
    warningText: "#FFE595",

    error: status.error,
    errorBg: "#3A1515",
    errorBorder: "#8E3333",
    errorText: "#F9C0C0",

    info: status.info,
    infoBg: "#102535",
    infoBorder: "#1D5B86",
    infoText: "#B9E1FF",

    // Buttons
    btnPrimaryBg: brand.primary,
    btnPrimaryBgPressed: brand.primaryDark,
    btnPrimaryText: "#FFFFFF",

    btnSecondaryBg: brand.secondary,
    btnSecondaryBgPressed: brand.secondaryDark,
    btnSecondaryText: "#FFFFFF",

    btnGhostBg: "transparent",
    btnGhostBgPressed: "rgba(255, 255, 255, 0.06)",
    btnGhostText: "#DDE7F0",

    btnDisabledBg: "#1F242C",
    btnDisabledText: "#6C737F",

    // Inputs
    inputBg: "#151A21",
    inputBorder: "#2A2F38",
    inputBorderFocused: brand.primaryLight,
    inputText: "#DDE7F0",
    inputPlaceholder: "#6C737F",

    // Chips / pills / tags
    tagDefaultBg: "#232832",
    tagDefaultText: "#DDE7F0",
    tagIncomeBg: "#123524",
    tagIncomeText: "#A3E8BC",
    tagExpenseBg: "#3A1515",
    tagExpenseText: "#F9C0C0",

    // Charts
    chartIncome: "#00BFA6",
    chartExpense: "#5C8FFE",
    chartSavings: "#F2C94C",

    // Overlays
    overlay: "rgba(0, 0, 0, 0.6)",

    // Gradients
    gradientPrimary: ["#246BFD", "#00BFA6"],
    gradientCard: ["#151A21", "#1C212A"],
    gradientHero: ["#151A21", "#246BFD"],
};
