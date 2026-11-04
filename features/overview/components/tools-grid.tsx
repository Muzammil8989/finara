import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useModalActions } from '@/providers/modal-context';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/components/common/pressable';

type Tool = { icon: IoniconsName; label: string; hint: string; wide?: boolean } & (
    | { href: Href }
    | { action: 'export' }
);

/**
 * Everything that used to be three taps deep in Settings → Management,
 * one tap from the home screen.
 */
const TOOLS: Tool[] = [
    { icon: 'repeat-outline', label: 'Bills', hint: 'Recurring payments', href: '/recurring' as Href },
    { icon: 'home-outline', label: 'Household', hint: 'Shared home budget', href: '/household' as Href },
    { icon: 'swap-horizontal-outline', label: 'Loans', hint: 'Money lent and owed', href: '/loans' as Href },
    { icon: 'card-outline', label: 'Accounts', hint: 'Wallets and cards', href: '/payment-methods' as Href },
    { icon: 'pricetags-outline', label: 'Categories', hint: 'Spending categories', href: '/categories' as Href },
    { icon: 'document-text-outline', label: 'Export', hint: 'PDF or Excel report', action: 'export' },
    { icon: 'settings-outline', label: 'Settings', hint: 'Profile, currency, security and backup', href: '/settings' as Href, wide: true },
];

export function ToolsGrid() {
    const colors = useThemeColors();
    const { openModal } = useModalActions();

    return (
        <View className="flex-row flex-wrap -mx-1">
            {TOOLS.map(tool => (
                <View key={tool.label} className={tool.wide ? 'w-full p-1' : 'w-1/3 p-1'}>
                    <Pressable
                        onPress={() => ('href' in tool ? router.push(tool.href) : openModal(tool.action))}
                        accessibilityRole="button"
                        accessibilityLabel={tool.label}
                        accessibilityHint={tool.hint}
                        className={tool.wide
                            ? 'flex-row items-center px-4 py-3.5 rounded-xl border border-divider dark:border-dark-divider min-h-[56px]'
                            : 'items-center justify-center py-4 rounded-xl border border-divider dark:border-dark-divider min-h-[84px]'}
                        style={({ pressed }) => ({ backgroundColor: pressed ? colors.backgroundAlt : colors.surface })}
                    >
                        <Ionicons name={tool.icon} size={22} color={colors.primary} />
                        {tool.wide ? (
                            <>
                                <View className="flex-1 ml-3">
                                    <ThemedText type="label" numberOfLines={1}>{tool.label}</ThemedText>
                                    <ThemedText type="caption" numberOfLines={1}>{tool.hint}</ThemedText>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                            </>
                        ) : (
                            <ThemedText type="label" className="mt-2" numberOfLines={1}>{tool.label}</ThemedText>
                        )}
                    </Pressable>
                </View>
            ))}
        </View>
    );
}
