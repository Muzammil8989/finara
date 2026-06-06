/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'jakarta':    ['PlusJakartaSans_400Regular'],
        'jakarta-md': ['PlusJakartaSans_500Medium'],
        'jakarta-sb': ['PlusJakartaSans_600SemiBold'],
        'jakarta-bd': ['PlusJakartaSans_700Bold'],
        'grotesk':    ['SpaceGrotesk_400Regular'],
        'grotesk-md': ['SpaceGrotesk_500Medium'],
        'grotesk-sb': ['SpaceGrotesk_600SemiBold'],
        'grotesk-bd': ['SpaceGrotesk_700Bold'],
      },
      colors: {
        brand: {
          primary: "#246BFD",
          primaryDark: "#1E56D8",
          primaryLight: "#4D84FF",
          secondary: "#3B82F6",
          secondaryDark: "#2563EB",
          secondaryLight: "#60A5FA",
        },
        // Semantic shorthand aliases (match colors.ts exactly)
        primary: "#246BFD",
        income: "#10B981",
        expense: "#EF4444",

        // Light Theme Semantic Colors (source of truth: theme/colors.ts lightColors)
        background: "#F4F7FA",
        backgroundAlt: "#EDEFF5",
        surface: "#FFFFFF",
        surfaceAlt: "#FAFCFE",
        textPrimary: "#1C1C1C",
        textSecondary: "#6C737F",
        textMuted: "#9AA5B1",
        borderSoft: "#E6ECF1",
        borderStrong: "#D3D9E1",
        divider: "#E0E4EB",

        successBg: "#ECFDF5",
        successBorder: "#B2E3C4",
        successText: "#165B37",

        warningBg: "#FEF3C7",
        warningBorder: "#F0D98C",
        warningText: "#725413",

        errorBg: "#FEF2F2",
        errorBorder: "#F3B3B3",
        errorText: "#7D2525",

        infoBg: "#EFF6FF",
        infoBorder: "#B8DAF5",
        infoText: "#13456B",

        // Dark Theme Semantic Colors (source of truth: theme/colors.ts darkColors)
        dark: {
          background: "#0E1117",
          backgroundAlt: "#05070A",
          surface: "#151A21",
          surfaceAlt: "#1C212A",
          textPrimary: "#DDE7F0",
          textSecondary: "#9AA5B1",
          textMuted: "#6C737F",
          borderSoft: "#2A2F38",
          borderStrong: "#3A3F48",
          divider: "#232832",

          successBg: "#123524",
          successBorder: "#1E6F41",
          successText: "#A3E8BC",

          warningBg: "#3A300F",
          warningBorder: "#8E7122",
          warningText: "#FFE595",

          errorBg: "#3A1515",
          errorBorder: "#8E3333",
          errorText: "#F9C0C0",

          infoBg: "#102535",
          infoBorder: "#1D5B86",
          infoText: "#B9E1FF",
        }
      },
    },
  },
  plugins: [],
}
