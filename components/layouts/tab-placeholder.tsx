import { ThemedText } from '@/components/common';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabPlaceholder({ name }: { name: string }) {
    const insets = useSafeAreaInsets();

    return (
        <View
            className="flex-1 items-center justify-center bg-background dark:bg-dark-background px-6"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <View className="bg-surface dark:bg-dark-surface p-10 rounded-[40px] border border-borderSoft dark:border-dark-borderSoft items-center justify-center shadow-xl w-full">
                <View className="w-20 h-20 bg-brand-primary/10 rounded-full items-center justify-center mb-6">
                    <View className="w-10 h-10 bg-brand-primary rounded-full animate-pulse" />
                </View>
                <ThemedText type="title" className="text-3xl text-center mb-4">
                    {name}
                </ThemedText>
                <ThemedText className="text-center text-lg opacity-60 dark:opacity-40 mb-8">
                    Coming Soon
                </ThemedText>

                <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-6 py-3 rounded-2xl">
                    <View className="w-3 h-3 rounded-full bg-brand-primary mr-3" />
                    <ThemedText type="small" className="font-bold uppercase tracking-widest">
                        {name === "Overview" ? "Theme Ready" : "Building..."}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
}

export function OverviewScreen() { return <TabPlaceholder name="Overview" />; }
export function TransactionsScreen() { return <TabPlaceholder name="Transactions" />; }
export function ReportsScreen() { return <TabPlaceholder name="Reports" />; }
export function BudgetScreen() { return <TabPlaceholder name="Budget" />; }
export function SettingsScreen() { return <TabPlaceholder name="Settings" />; }
