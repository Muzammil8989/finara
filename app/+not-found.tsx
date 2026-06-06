import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Oops!' }} />
            <View className="flex-1 items-center justify-center p-5 bg-background dark:bg-dark-background">
                <Text className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">
                    This screen doesn&apos;t exist.
                </Text>
                <Link href="/" className="mt-4 p-4">
                    <Text className="text-brand-primary font-medium">Go to home screen!</Text>
                </Link>
            </View>
        </>
    );
}
