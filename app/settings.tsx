import { useModalActions } from '@/providers/modal-context';
import { useAuth } from '@/features/auth/context/auth-context';
import { useUser } from '@/features/user/context/user-context';
import { useFactoryReset } from '@/features/auth/hooks/use-factory-reset';
import { SecurityService } from '@/features/auth/services/security-service';
import { logger } from '@/lib/logger';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataBackupSection } from '@/features/settings/components/data-backup-section';
import { DangerZone } from '@/features/settings/components/danger-zone';
import { LegalSection } from '@/features/settings/components/legal-section';
import { EditProfileSheet } from '@/features/settings/components/edit-profile-sheet';
import { ManagementSection } from '@/features/settings/components/management-section';
import { PreferencesSection } from '@/features/settings/components/preferences-section';
import { ProfileCard } from '@/features/settings/components/profile-card';
import { SecuritySection } from '@/features/settings/components/security-section';
import { SettingsHeader } from '@/features/settings/components/settings-header';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { recheckSecurity } = useAuth();
    const factoryReset = useFactoryReset();
    const { triggerRefresh } = useModalActions();
    const { profile, updateProfile } = useUser();

    const { enabled: notifEnabled, toggle: toggleNotifications } = useNotifications();

    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    const [bioEnabled, setBioEnabled] = useState(false);
    const [bioAvailable, setBioAvailable] = useState(false);
    const [isPinSet, setIsPinSet] = useState(false);

    const [editName, setEditName] = useState(profile.name);
    const [editAvatar, setEditAvatar] = useState(profile.avatar);

    // Reload on focus too: coming back from security-setup may have added a
    // PIN without changing "security enabled" (biometric-only → PIN).
    useFocusEffect(useCallback(() => {
        let mounted = true;
        Promise.all([
            SecurityService.getBiometricStatus(),
            SecurityService.getBiometricPreference(),
            SecurityService.hasPinConfigured(),
        ]).then(([bio, bioEnabled, pinSet]) => {
            if (!mounted) return;
            setBioAvailable(bio.available);
            setBioEnabled(bioEnabled);
            setIsPinSet(pinSet);
        }).catch(e => {
            logger.error('Failed to load security status', e);
        });
        return () => { mounted = false; };
    }, []));

const openProfileModal = () => {
        setEditName(profile.name);
        setEditAvatar(profile.avatar);
        setIsProfileModalVisible(true);
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled) setEditAvatar(result.assets[0].uri);
        } catch (error) {
            logger.error('Failed to pick image', error);
            Alert.alert('Error', 'Could not access photo library. Please check permissions.');
        }
    };

    const saveProfile = async () => {
        if (!editName.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return; }
        if (editName.trim().length > 50) { Alert.alert('Error', 'Name must be 50 characters or less.'); return; }
        await updateProfile({ name: editName.trim(), avatar: editAvatar });
        setIsProfileModalVisible(false);
    };

    const toggleBio = async () => {
        const newVal = !bioEnabled;
        // Changing an unlock method needs the owner present: turning it on
        // proves biometrics work, turning it off can't be done by whoever
        // picks up the unlocked phone.
        if (!(await SecurityService.authenticateBio())) return;
        await SecurityService.setBiometricPreference(newVal);
        setBioEnabled(newVal);
        await recheckSecurity();
    };

    const handleSecurityPin = () => {
        // Go by the PIN itself, not "security enabled": in biometric-only mode
        // there is no PIN to verify, so "remove" could never succeed.
        router.push({
            pathname: '/security-setup',
            params: { mode: isPinSet ? 'remove' : 'set' },
        });
    };

    const handleFactoryReset = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (hasHardware && isEnrolled) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate to confirm Factory Reset',
                    fallbackLabel: 'Use Device Passcode',
                    disableDeviceFallback: false,
                    cancelLabel: 'Cancel',
                });
                if (!result.success) return;
            }
        } catch (e) {
            // Never fall through to a destructive reset when auth errors.
            logger.error('Auth failed', e);
            Alert.alert('Authentication failed', 'Factory reset was cancelled.');
            return;
        }

        Alert.alert(
            'Factory Reset',
            'This will delete all transactions, your profile, and security settings. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset Everything',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await factoryReset();
                            Alert.alert('Success', 'Application reset complete. Returning to setup.', [
                                { text: 'OK', onPress: () => router.replace('/onboarding') },
                            ]);
                        } catch (e) {
                            logger.error('Factory reset failed', e);
                            Alert.alert('Reset failed', 'Something went wrong while resetting. Please try again.');
                        }
                    },
                },
            ],
        );
    };

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <SettingsHeader insets={insets} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-5">
                    <ProfileCard
                        name={profile.name}
                        avatar={profile.avatar}
                        onPress={openProfileModal}
                    />

                    <ManagementSection />

                    <PreferencesSection
                        theme={profile.theme}
                        currency={profile.currency}
                        notifEnabled={notifEnabled}
                        onThemeSelect={(mode) => updateProfile({ theme: mode })}
                        onCurrencySelect={(code) => updateProfile({ currency: code })}
                        onNotifToggle={toggleNotifications}
                    />

                    <SecuritySection
                        isPinSet={isPinSet}
                        bioAvailable={bioAvailable}
                        bioEnabled={bioEnabled}
                        onPinPress={handleSecurityPin}
                        onBioToggle={toggleBio}
                    />

                    <DataBackupSection
                        onRestoreComplete={() => {
                            // Mounted tab screens hold the pre-restore data.
                            triggerRefresh();
                            router.replace('/(tabs)');
                        }}
                    />

                    <LegalSection />

                    <DangerZone onFactoryReset={handleFactoryReset} />
                </View>
            </ScrollView>

            <EditProfileSheet
                visible={isProfileModalVisible}
                name={editName}
                avatar={editAvatar}
                onNameChange={setEditName}
                onAvatarPress={pickImage}
                onSave={saveProfile}
                onClose={() => setIsProfileModalVisible(false)}
            />
        </View>
    );
}
