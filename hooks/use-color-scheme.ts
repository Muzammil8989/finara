import { useColorScheme as useNWColorScheme } from "nativewind";
import { useColorScheme as useRNColorScheme } from "react-native";

export function useColorScheme() {
    const { colorScheme } = useNWColorScheme();
    const systemColorScheme = useRNColorScheme();

    // If user selected 'system', use the device's system theme
    if ((colorScheme as string) === 'system') {
        return systemColorScheme ?? 'light';
    }

    // Return current scheme or default to light
    return colorScheme ?? 'light';
}
