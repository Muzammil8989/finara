import { useAuth } from '@/features/auth/context/auth-context';
import { useUser } from '@/features/user/context/user-context';
import { clearDatabase } from '@/lib/db/migrations';
import { SecurityService } from '@/features/auth/services/security-service';
import { logger } from '@/lib/logger';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useColorScheme as useNWColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataBackupSection } from './_settings/data-backup-section';
import { DangerZone } from './_settings/danger-zone';
import { LegalSection } from './_settings/legal-section';
import { EditProfileSheet } from './_settings/edit-profile-sheet';
import { ManagementSection } from './_settings/management-section';
import { PreferencesSection } from './_settings/preferences-section';
import { ProfileCard } from './_settings/profile-card';
import { SecuritySection } from './_settings/security-section';
import { SettingsHeader } from './_settings/settings-header';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useNWColorScheme();
    const { isSecurityEnabled } = useAuth();
    const { profile, updateProfile } = useUser();
    const db = useSQLiteContext();

    const { enabled: notifEnabled, toggle: toggleNotifications } = useNotifications();

    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    const [bioEnabled, setBioEnabled] = useState(false);
    const [bioAvailable, setBioAvailable] = useState(false);
    const [isPinSet, setIsPinSet] = useState(false);

    const [editName, setEditName] = useState(profile.name);
    const [editAvatar, setEditAvatar] = useState(profile.avatar);

    useEffect(() => {
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
    }, [isSecurityEnabled]);

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
        await SecurityService.setBiometricPreference(newVal);
        setBioEnabled(newVal);
    };

    const handleSecurityPin = () => {
        router.push({
            pathname: '/security-setup',
            params: { mode: isSecurityEnabled ? 'remove' : 'set' },
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
            logger.error('Auth failed', e);
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
                        await clearDatabase(db);
                        await SecurityService.clearSecurity();
                        await updateProfile({ name: '', avatar: null, currency: 'USD', isOnboarded: false });
                        Alert.alert('Success', 'Application reset complete. Returning to setup.', [
                            { text: 'OK', onPress: () => router.replace('/onboarding') },
                        ]);
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
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-6">
                    <ProfileCard
                        name={profile.name}
                        avatar={profile.avatar}
                        onPress={openProfileModal}
                    />

                    <ManagementSection />

                    <PreferencesSection
                        colorScheme={colorScheme ?? 'light'}
                        currency={profile.currency}
                        notifEnabled={notifEnabled}
                        onThemeSelect={(mode) => updateProfile({ theme: mode })}
                        onCurrencySelect={(code) => updateProfile({ currency: code })}
                        onNotifToggle={toggleNotifications}
                    />

                    <SecuritySection
                        isSecurityEnabled={isSecurityEnabled}
                        isPinSet={isPinSet}
                        bioAvailable={bioAvailable}
                        bioEnabled={bioEnabled}
                        onPinPress={handleSecurityPin}
                        onBioToggle={toggleBio}
                    />

                    <DataBackupSection
                        onRestoreComplete={() => router.replace('/(tabs)')}
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
