import { useThemeColors } from '@/hooks/use-theme-colors';
import { fonts, tabularNums } from '@/theme/typography';
import { Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'small'
    // Editorial variants
    | 'display'   // serif masthead, 34px
    | 'headline'  // serif screen/section title, 24px
    | 'kicker'    // small uppercase label above a headline, muted
    | 'label'     // UI label, 13px semibold
    | 'caption'   // 12px muted helper text
    | 'figure'    // tabular number, 16px
    | 'figureLg'; // tabular hero number, 34px
  className?: string;
};

// Standard text size/alignment utilities (not color-related)
const NON_COLOR_TEXT_CLASSES = new Set([
  'text-xs', 'text-sm', 'text-base', 'text-lg',
  'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
  'text-5xl', 'text-6xl',
  'text-center', 'text-left', 'text-right', 'text-justify',
]);

// Our custom semantic theme text classes — treat as non-explicit color
// (the inline theme color is the same value, so it's a safe fallback)
const THEME_TEXT_CLASSES = new Set([
  'text-textPrimary', 'text-textSecondary', 'text-textMuted',
  'text-dark-textPrimary', 'text-dark-textSecondary', 'text-dark-textMuted',
]);

/**
 * Check if className has a standard NativeWind color class
 * (e.g. text-white, text-red-500, text-emerald-500/60).
 * Returns false for our custom theme classes and non-color utilities.
 */
function hasStandardColorClass(className: string | undefined): boolean {
  if (!className) return false;
  const tokens = className.split(/\s+/);
  for (const token of tokens) {
    const base = token.startsWith('dark:') ? token.substring(5) : token;
    if (!base.startsWith('text-')) continue;
    if (NON_COLOR_TEXT_CLASSES.has(base)) continue;
    if (THEME_TEXT_CLASSES.has(base)) continue;
    // Arbitrary size values like text-[11px] — not a color
    if (base.startsWith('text-[') && !base.match(/text-\[#[0-9A-Fa-f]/)) continue;
    // Anything else starting with text- is a color class
    return true;
  }
  return false;
}

// Maps ThemedText type → font file (weight embedded in name)
const TYPE_FONT: Record<string, string> = {
  title:          fonts.serif,
  subtitle:       fonts.sansSemiBold,
  defaultSemiBold:fonts.sansSemiBold,
  link:           fonts.sansSemiBold,
  small:          fonts.sans,
  default:        fonts.sans,
  display:        fonts.serif,
  headline:       fonts.serif,
  kicker:         fonts.sansBold,
  label:          fonts.sansSemiBold,
  caption:        fonts.sans,
  figure:         fonts.figure,
  figureLg:       fonts.figureSemiBold,
};

const MUTED_TYPES = new Set(['kicker', 'caption']);
const FIGURE_TYPES = new Set(['figure', 'figureLg']);
const SERIF_TYPES = new Set(['title', 'display', 'headline']);

/**
 * Custom fonts ship one file per weight. A `font-bold` class would set
 * fontWeight on top of e.g. PlusJakartaSans_400Regular, which Android renders
 * as faux-bold or the system font. So weight classes pick the matching file
 * instead and are removed from the className.
 */
const WEIGHT_RE = /^font-(thin|light|normal|medium|semibold|bold|extrabold|black)$/;
const FAMILY_BY_WEIGHT: Record<'sans' | 'serif' | 'figure', Record<string, string>> = {
  sans: { thin: fonts.sans, light: fonts.sans, normal: fonts.sans, medium: fonts.sansMedium, semibold: fonts.sansSemiBold, bold: fonts.sansBold, extrabold: fonts.sansBold, black: fonts.sansBold },
  serif: { thin: fonts.serif, light: fonts.serif, normal: fonts.serif, medium: fonts.serif, semibold: fonts.serif, bold: fonts.serifBold, extrabold: fonts.serifBold, black: fonts.serifBold },
  figure: { thin: fonts.figure, light: fonts.figure, normal: fonts.figure, medium: fonts.figure, semibold: fonts.figureSemiBold, bold: fonts.figureBold, extrabold: fonts.figureBold, black: fonts.figureBold },
};

function resolveWeight(classes: string, type: string): { className: string; fontFamily: string } {
  let weight: string | null = null;
  const kept: string[] = [];
  for (const token of classes.split(/\s+/)) {
    if (!token) continue;
    const m = token.match(WEIGHT_RE);
    if (m) weight = m[1]; else kept.push(token);
  }
  const base = TYPE_FONT[type] ?? fonts.sans;
  if (!weight) return { className: kept.join(' '), fontFamily: base };
  const family = SERIF_TYPES.has(type) ? 'serif' : FIGURE_TYPES.has(type) ? 'figure' : 'sans';
  return { className: kept.join(' '), fontFamily: FAMILY_BY_WEIGHT[family][weight] };
}


export function ThemedText({
  style,
  type = 'default',
  className,
  ...rest
}: ThemedTextProps) {
  const colors = useThemeColors();
  const defaultColor = MUTED_TYPES.has(type) ? colors.textMuted : colors.textPrimary;
  const hasExplicitColor = hasStandardColorClass(className);

  let typeClasses = '';
  switch (type) {
    case 'title':
      typeClasses = 'text-3xl leading-tight';
      break;
    case 'subtitle':
      typeClasses = 'text-xl';
      break;
    case 'defaultSemiBold':
      typeClasses = 'text-base leading-6';
      break;
    case 'link':
      typeClasses = 'text-base leading-relaxed text-brand-primary';
      break;
    case 'small':
      typeClasses = 'text-sm';
      break;
    case 'display':
      typeClasses = 'text-[34px] leading-[40px]';
      break;
    case 'headline':
      typeClasses = 'text-2xl leading-8';
      break;
    case 'kicker':
      typeClasses = 'text-[11px] uppercase tracking-[1.4px]';
      break;
    case 'label':
      typeClasses = 'text-[13px]';
      break;
    case 'caption':
      typeClasses = 'text-xs leading-4';
      break;
    case 'figure':
      typeClasses = 'text-base';
      break;
    case 'figureLg':
      typeClasses = 'text-[34px] leading-[40px] tracking-[-0.5px]';
      break;
    default:
      typeClasses = 'text-base leading-relaxed';
  }

  const resolved = resolveWeight(`${typeClasses} ${className || ''}`, type);

  return (
    <Text
      // Respect the system text size, capped so layouts don't break.
      maxFontSizeMultiplier={1.3}
      {...rest}
      className={resolved.className}
      style={[
        { fontFamily: resolved.fontFamily },
        FIGURE_TYPES.has(type) ? tabularNums : null,
        !hasExplicitColor ? { color: defaultColor } : null,
        style,
      ]}
    />
  );
}
