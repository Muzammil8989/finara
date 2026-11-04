import { ThemedText } from '@/components/common/themed-text';
import { IconSymbol } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Pressable, View } from 'react-native';

interface ErrorRetryProps {
    message?: string;
    onRetry: () => void;
}

export function ErrorRetry({ message = 'Something went wrong', onRetry }: ErrorRetryProps) {
    const colors = useThemeColors();

    return (
        <View className="py-16 items-center justify-center px-6">
            <IconSymbol name="exclamationmark.triangle.fill" color={colors.expense} size={40} />
            <ThemedText className="mt-4 text-center text-textSecondary dark:text-dark-textSecondary">
                {message}
            </ThemedText>
            <Pressable
                onPress={onRetry}
                className="mt-4 px-6 py-3 bg-brand-primary rounded-xl active:opacity-80"
                accessibilityLabel="Retry loading"
                accessibilityRole="button"
            >
                <ThemedText className="text-white font-semibold">Try Again</ThemedText>
            </Pressable>
        </View>
    );
}
