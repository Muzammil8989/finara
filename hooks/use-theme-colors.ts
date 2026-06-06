import { darkColors, lightColors } from '../theme/colors';
import { useColorScheme } from './use-color-scheme';

/**
 * Returns the full color palette for the current theme.
 * Use this whenever you need a raw color value (icon color props,
 * placeholderTextColor, inline styles, etc.)
 */
export function useThemeColors() {
    const colorScheme = useColorScheme();
    return colorScheme === 'dark' ? darkColors : lightColors;
}
