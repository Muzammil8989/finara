/** @type {import('tailwindcss').Config} */
// Colours come from theme/tokens.js — the same file theme/colors.ts reads.
const { brand, light, dark } = require('./theme/tokens');

const semantic = (t) => ({
  background: t.background,
  backgroundAlt: t.backgroundAlt,
  surface: t.surface,
  surfaceAlt: t.surfaceAlt,
  textPrimary: t.textPrimary,
  textSecondary: t.textSecondary,
  textMuted: t.textMuted,
  borderSoft: t.borderSoft,
  borderStrong: t.borderStrong,
  divider: t.divider,
  accent: t.accent,
  income: t.income,
  expense: t.expense,
  warning: t.warning,
  successBg: t.successBg,
  successBorder: t.successBorder,
  successText: t.successText,
  warningBg: t.warningBg,
  warningBorder: t.warningBorder,
  warningText: t.warningText,
  errorBg: t.errorBg,
  errorBorder: t.errorBorder,
  errorText: t.errorText,
  infoBg: t.infoBg,
  infoBorder: t.infoBorder,
  infoText: t.infoText,
});

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Editorial display serif — headlines, mastheads
        'serif':      ['PlayfairDisplay_600SemiBold'],
        'serif-bd':   ['PlayfairDisplay_700Bold'],
        'serif-it':   ['PlayfairDisplay_400Regular_Italic'],
        // UI / body
        'jakarta':    ['PlusJakartaSans_400Regular'],
        'jakarta-md': ['PlusJakartaSans_500Medium'],
        'jakarta-sb': ['PlusJakartaSans_600SemiBold'],
        'jakarta-bd': ['PlusJakartaSans_700Bold'],
        // Figures (tabular numerals)
        'grotesk':    ['SpaceGrotesk_400Regular'],
        'grotesk-md': ['SpaceGrotesk_500Medium'],
        'grotesk-sb': ['SpaceGrotesk_600SemiBold'],
        'grotesk-bd': ['SpaceGrotesk_700Bold'],
      },
      colors: {
        brand,
        primary: brand.primary,
        ...semantic(light),
        dark: semantic(dark),
      },
    },
  },
  plugins: [],
}
