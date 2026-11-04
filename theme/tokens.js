/**
 * Raw colour tokens — the single source of truth for the palette.
 *
 * Plain CommonJS so both `tailwind.config.js` (Node) and `theme/colors.ts`
 * (app code) can read it. Add or change colours here, nowhere else.
 *
 * Direction: editorial "warm paper" — ink on paper, hairline rules,
 * one deep-teal accent. Every text/background pair is ≥ 4.5:1.
 */

const brand = {
    primary: '#0D5C63',       // deep teal accent (7.2:1 on paper)
    primaryDark: '#0A474D',
    primaryLight: '#2B7A80',
    secondary: '#2F4A55',     // slate ink
    secondaryDark: '#22363F',
    secondaryLight: '#4C6773',
};

const light = {
    background: '#FBF7F0',    // paper
    backgroundAlt: '#F3ECE0',
    surface: '#FFFDF9',
    surfaceAlt: '#F7F1E7',

    textPrimary: '#1A1714',   // ink
    textSecondary: '#4A433B',
    textMuted: '#6B6359',

    borderSoft: '#E9E1D4',
    borderStrong: '#D8CDBC',
    divider: '#E4DCCF',       // hairline rule

    accent: brand.primary,
    income: '#1F7A4D',
    expense: '#B23A3A',
    warning: '#9A6412',

    successBg: '#EAF3EC',
    successBorder: '#BCD8C4',
    successText: '#1A5C3A',

    warningBg: '#F7EEDB',
    warningBorder: '#E6CF9C',
    warningText: '#6E4A0E',

    errorBg: '#F8E9E6',
    errorBorder: '#E8BDB6',
    errorText: '#7F2626',

    infoBg: '#E6F0F0',
    infoBorder: '#B5D1D3',
    infoText: '#0A474D',
};

const dark = {
    background: '#14120F',
    backgroundAlt: '#0E0C0A',
    surface: '#1C1A16',
    surfaceAlt: '#24211C',

    textPrimary: '#F2EDE4',
    textSecondary: '#C9C0B2',
    textMuted: '#A39A8C',

    borderSoft: '#2E2A24',
    borderStrong: '#3D382F',
    divider: '#2A2620',

    accent: '#5FB3B3',
    income: '#5BBF8A',
    expense: '#E07A6F',
    warning: '#E0A84A',

    successBg: '#16271D',
    successBorder: '#2D5A3F',
    successText: '#A8DDBC',

    warningBg: '#2B2112',
    warningBorder: '#6B5124',
    warningText: '#F0D29A',

    errorBg: '#2C1715',
    errorBorder: '#6E302B',
    errorText: '#F2B8B0',

    infoBg: '#142526',
    infoBorder: '#2C5759',
    infoText: '#A9DADA',
};

/**
 * Categorical palette for charts and category swatches — muted, print-like,
 * distinguishable in light and dark. Max 6 series; anything beyond is "Other".
 */
const chartCategorical = ['#0D5C63', '#C0713A', '#5B6C8F', '#8A9A3B', '#A34E6E', '#8C7A5B'];
const chartCategoricalDark = ['#5FB3B3', '#E39A62', '#93A5CB', '#B8C56A', '#D987A6', '#C2B08E'];

/**
 * User-pickable colours for categories, accounts and goals. Mid-tones, each
 * ≥ 3:1 against both light paper and dark surface, so an icon tinted with
 * one stays visible whichever theme is on.
 */
const swatches = [
    '#2E7F84', '#2F8A5B', '#C0713A', '#C2504A', '#5B76A8', '#A8587A',
    '#8C7A5B', '#7E8C34', '#B07D1E', '#7A62A8', '#3C82A6', '#9A6B4F',
];

module.exports = { brand, light, dark, chartCategorical, chartCategoricalDark, swatches };
