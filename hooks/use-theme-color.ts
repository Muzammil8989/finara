import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
): string {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const color = Colors[theme][colorName];
    // If it's an array (gradient), return the first color as a fallback for non-gradient components
    if (Array.isArray(color)) {
      return color[0];
    }
    return color as string;
  }
}
