import { darkColors, lightColors } from '../theme/colors';

export const Colors = {
  light: {
    ...lightColors,
    text: lightColors.textPrimary,
    background: lightColors.background,
    tint: lightColors.primary,
    icon: lightColors.gray600,
    tabIconDefault: lightColors.gray400,
    tabIconSelected: lightColors.primary,
  },
  dark: {
    ...darkColors,
    text: darkColors.textPrimary,
    background: darkColors.background,
    tint: darkColors.primary,
    icon: darkColors.gray500,
    tabIconDefault: darkColors.gray600,
    tabIconSelected: darkColors.primary,
  },
};
