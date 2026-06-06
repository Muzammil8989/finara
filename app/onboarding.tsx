import { useUser } from '@/features/user/context/user-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { logger } from '@/lib/logger';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPicker } from './_onboarding/avatar-picker';
import { ContinueButton } from './_onboarding/continue-button';
import { OnboardingHeader } from './_onboarding/onboarding-header';
import { ProfileForm } from './_onboarding/profile-form';

export default function OnboardingScreen() {
    const { profile, updateProfile } = useUser();
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();

    // Hydrate from persisted profile so partial progress survives remounts
    // (lock/unlock, app backgrounding, screen replace).
    const [name, setName] = useState(profile.name ?? '');
    const [avatar, setAvatar] = useState<string | null>(profile.avatar ?? null);
    const [currency, setCurrency] = useState(profile.currency ?? 'USD');
    const [isLoading, setIsLoading] = useState(false);

    // Track whether the local form has diverged from the profile yet — once
    // the user types anything, stop pulling fresh values from context.
    const hasUserEditedRef = useRef(false);

    useEffect(() => {
        if (hasUserEditedRef.current) return;
        setName(profile.name ?? '');
        setAvatar(profile.avatar ?? null);
        setCurrency(profile.currency ?? 'USD');
    }, [profile.name, profile.avatar, profile.currency]);

    // Persist drafts to SecureStore so they survive app restart.
    // We deliberately do NOT set isOnboarded:true here — that only happens on Continue.
    const persistDraft = useCallback(
        (patch: { name?: string; avatar?: string | null; currency?: string }) => {
            updateProfile(patch).catch((e) => logger.error('Failed to persist onboarding draft', e));
        },
        [updateProfile],
    );

    const handleNameChange = useCallback(
        (value: string) => {
            hasUserEditedRef.current = true;
            setName(value);
            persistDraft({ name: value });
        },
        [persistDraft],
    );

    const handleCurrencyChange = useCallback(
        (value: string) => {
            hasUserEditedRef.current = true;
            setCurrency(value);
            persistDraft({ currency: value });
        },
        [persistDraft],
    );

    const pickImage = useCallback(async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled) {
                const uri = result.assets[0].uri;
                hasUserEditedRef.current = true;
                setAvatar(uri);
                persistDraft({ avatar: uri });
            }
        } catch (error) {
            logger.error('Failed to pick image', error);
            Alert.alert('Error', 'Could not access photo library. Please check permissions.');
        }
    }, [persistDraft]);

    const handleContinue = useCallback(async () => {
        if (isLoading) return;
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your name to continue.');
            return;
        }
        setIsLoading(true);
        try {
            await updateProfile({ name: name.trim(), avatar, currency, isOnboarded: true });
            router.replace('/(tabs)');
        } catch (error) {
            logger.error('Failed to save profile', error);
            Alert.alert('Error', 'Something went wrong saving your profile.');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, name, avatar, currency, updateProfile]);

    return (
        <LinearGradient
            colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <OnboardingHeader safeAreaTop={insets.top} />

                    {/* Card — rounded top creates the wave break */}
                    <View
                        className="flex-1 rounded-t-[40px] px-6 pt-5"
                        style={{ backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }}
                    >
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <AvatarPicker avatar={avatar} name={name} onPress={pickImage} />
                            <ProfileForm
                                name={name}
                                onNameChange={handleNameChange}
                                currency={currency}
                                onCurrencyChange={handleCurrencyChange}
                            />
                        </View>
                        <ContinueButton onPress={handleContinue} isLoading={isLoading} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
