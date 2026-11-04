import { AppButton, EmptyState } from '@/components/common';
import { Stack, router } from 'expo-router';
import { View } from 'react-native';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Not found' }} />
            <View className="flex-1 justify-center px-5 bg-background dark:bg-dark-background">
                <EmptyState
                    icon="compass-outline"
                    title="Page not found"
                    subtitle="This screen doesn't exist or has moved."
                />
                <AppButton label="Back to Overview" onPress={() => router.replace('/(tabs)')} />
            </View>
        </>
    );
}
