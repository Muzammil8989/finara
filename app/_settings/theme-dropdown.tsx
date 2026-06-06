import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
    FadeInDown,
    FadeOutUp,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';

type ThemeMode = 'light' | 'dark' | 'system';

const MODES: { id: ThemeMode; title: string; icon: IoniconsName }[] = [
    { id: 'light',  title: 'Light Mode',     icon: 'sunny-outline' },
    { id: 'dark',   title: 'Dark Mode',      icon: 'moon-outline' },
    { id: 'system', title: 'System Default', icon: 'phone-portrait-outline' },
];

interface ThemeDropdownProps {
    currentScheme: string;
    onSelect: (mode: ThemeMode) => void;
}

export function ThemeDropdown({ currentScheme, onSelect }: ThemeDropdownProps) {
    const colors = useThemeColors();
    const [open, setOpen] = React.useState(false);

    const currentMode = MODES.find(m => m.id === currentScheme) ?? MODES[0];

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: withTiming(open ? '180deg' : '0deg', { duration: 350 }) }],
    }));

    const handleSelect = (mode: ThemeMode) => {
        onSelect(mode);
        setOpen(false);
    };

    return (
        <View className="z-20 mb-4">
            <Pressable
                onPress={() => setOpen(v => !v)}
                className="flex-row items-center bg-backgroundAlt dark:bg-dark-backgroundAlt p-5 rounded-3xl"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
                <View className="w-10 h-10 items-center justify-center mr-4">
                    <Ionicons name={currentMode.icon} size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                    <ThemedText className="text-base font-semibold text-textPrimary dark:text-dark-textPrimary">
                        Theme
                    </ThemedText>
                    <ThemedText className="text-sm text-textMuted dark:text-dark-textMuted mt-0.5">
                        {currentMode.title}
                    </ThemedText>
                </View>
                <Animated.View style={chevronStyle}>
                    <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </Animated.View>
            </Pressable>

            {open && (
                <Animated.View
                    entering={FadeInDown.duration(300).springify().damping(22).stiffness(80)}
                    exiting={FadeOutUp.duration(250)}
                    className="mt-2 bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-3xl overflow-hidden"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 8,
                    }}
                >
                    {MODES.map((mode, i) => {
                        const isSelected = mode.id === currentScheme;
                        return (
                            <Pressable
                                key={mode.id}
                                onPress={() => handleSelect(mode.id)}
                                className={`flex-row items-center p-5 ${i < MODES.length - 1 ? 'border-b border-divider dark:border-dark-divider' : ''}`}
                                style={[
                                    { opacity: 1 },
                                    isSelected && { backgroundColor: `${colors.primary}08` },
                                ]}
                            >
                                <View
                                    className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: isSelected ? `${colors.primary}20` : colors.backgroundAlt }}
                                >
                                    <Ionicons name={mode.icon} size={16} color={isSelected ? colors.primary : colors.textMuted} />
                                </View>
                                <ThemedText
                                    className="flex-1 text-base font-semibold"
                                    style={{ color: isSelected ? colors.primary : colors.textPrimary }}
                                >
                                    {mode.title}
                                </ThemedText>
                                {isSelected && (
                                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                                )}
                            </Pressable>
                        );
                    })}
                </Animated.View>
            )}
        </View>
    );
}
