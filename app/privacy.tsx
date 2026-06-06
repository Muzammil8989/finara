import { ScreenHeader, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LAST_UPDATED = 'May 2026';
const APP_NAME = 'Finara';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    const colors = useThemeColors();
    return (
        <View className="mb-7">
            <ThemedText
                className="text-sm font-black uppercase tracking-widest mb-3"
                style={{ color: colors.primary }}
            >
                {title}
            </ThemedText>
            {children}
        </View>
    );
}

function Para({ children }: { children: React.ReactNode }) {
    return (
        <ThemedText className="text-sm leading-6 text-textPrimary dark:text-dark-textPrimary mb-3">
            {children}
        </ThemedText>
    );
}

function BulletItem({ title, description }: { title: string; description: string }) {
    const colors = useThemeColors();
    return (
        <View className="flex-row mb-3 pr-2">
            <View className="w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: colors.primary }} />
            <View className="flex-1">
                <ThemedText className="text-sm font-bold text-textPrimary dark:text-dark-textPrimary">
                    {title}
                </ThemedText>
                <ThemedText className="text-sm leading-5 text-textMuted dark:text-dark-textMuted mt-0.5">
                    {description}
                </ThemedText>
            </View>
        </View>
    );
}

function Pill({ label, icon }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
    const colors = useThemeColors();
    return (
        <View className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl mr-2 mb-2" style={{ backgroundColor: `${colors.success}12` }}>
            <Ionicons name={icon} size={13} color={colors.success} />
            <ThemedText className="text-xs font-bold" style={{ color: colors.success }}>{label}</ThemedText>
        </View>
    );
}

function Divider() {
    const colors = useThemeColors();
    return <View className="h-px mb-7" style={{ backgroundColor: colors.divider }} />;
}

export default function PrivacyScreen() {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <ScreenHeader
                title="Privacy Policy"
                subtitle={`Last updated ${LAST_UPDATED}`}
                withInsets
                border
                right={
                    <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: `${colors.success}15` }}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
                    </View>
                }
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary banner */}
                <View
                    className="rounded-2xl p-4 mb-6"
                    style={{ backgroundColor: `${colors.success}0D`, borderWidth: 1, borderColor: `${colors.success}25` }}
                >
                    <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                        <ThemedText className="text-sm font-black" style={{ color: colors.success }}>
                            The Short Version
                        </ThemedText>
                    </View>
                    <ThemedText className="text-sm leading-6 text-textPrimary dark:text-dark-textPrimary">
                        {APP_NAME} does not collect, store remotely, or transmit any of your personal or financial data. Everything you enter stays on your device. We have no servers, no analytics, and no access to your information — ever.
                    </ThemedText>
                </View>

                {/* At-a-glance pills */}
                <View className="flex-row flex-wrap mb-8">
                    <Pill label="No data collection" icon="cloud-offline-outline" />
                    <Pill label="Offline only" icon="wifi-outline" />
                    <Pill label="No account needed" icon="person-remove-outline" />
                    <Pill label="No ads" icon="megaphone-outline" />
                    <Pill label="No third-party SDKs" icon="analytics-outline" />
                </View>

                <Section title="1. Data We Collect">
                    <Para>
                        We collect nothing. {APP_NAME} has no backend, no user accounts, and no telemetry.
                    </Para>
                    <Para>
                        More specifically, {APP_NAME} does not collect:
                    </Para>
                    <BulletItem
                        title="Personal identifiers"
                        description="No name, email address, phone number, or device ID is ever requested or stored by us."
                    />
                    <BulletItem
                        title="Financial data"
                        description="Your transactions, balances, and budgets are stored locally on your device only. We cannot see them."
                    />
                    <BulletItem
                        title="Usage analytics"
                        description="We do not track which screens you visit, how long you use the app, or what features you tap."
                    />
                    <BulletItem
                        title="Crash reports"
                        description="The app does not send crash or error reports to any external service."
                    />
                    <BulletItem
                        title="Location data"
                        description="Finara does not request or use your location at any time."
                    />
                </Section>

                <Divider />

                <Section title="2. What Is Stored on Your Device">
                    <Para>
                        When you use {APP_NAME}, the following information is saved in a private storage area on your phone:
                    </Para>
                    <BulletItem
                        title="Transactions"
                        description="The income and expense records you add manually, including amounts, dates, categories, and notes."
                    />
                    <BulletItem
                        title="Accounts & Wallets"
                        description="Names, icons, and balances of the accounts you create inside the app."
                    />
                    <BulletItem
                        title="Budgets and Savings Goals"
                        description="Budget limits and savings targets you set."
                    />
                    <BulletItem
                        title="App Preferences"
                        description="Your currency setting, display name, theme preference, and profile photo — saved locally on your phone."
                    />
                    <Para>
                        This storage is private to the app. Other apps on your phone cannot read it. {APP_NAME} does not sync it to any cloud service — though your phone's own backup system (such as iCloud or Google Backup) may include it depending on your phone's settings.
                    </Para>
                </Section>

                <Divider />

                <Section title="3. Device Permissions">
                    <Para>
                        {APP_NAME} requests the following permissions, and only for the stated purpose:
                    </Para>
                    <BulletItem
                        title="Photo Library (optional)"
                        description="Only requested if you choose to set a profile photo. The photo stays on your phone — it is never uploaded anywhere."
                    />
                    <BulletItem
                        title="Face ID / Fingerprint (optional)"
                        description="Used to unlock the app lock screen if you enable that feature. Your face or fingerprint data is handled entirely by your phone's operating system. Finara never sees or stores it directly."
                    />
                    <Para>
                        {APP_NAME} does not request access to your contacts, microphone, camera, calendar, or any other device capability beyond those listed above.
                    </Para>
                </Section>

                <Divider />

                <Section title="4. Security">
                    <Para>
                        Your PIN, if you set one, is kept in your phone's built-in secure storage — a protected area that other apps cannot access. On most phones this area is backed by dedicated security hardware.
                    </Para>
                    <Para>
                        Because {APP_NAME} works entirely offline, there is no server that could be hacked to expose your financial records. The security of your information depends on the security of your phone — we recommend using a strong screen lock and keeping your phone's software up to date.
                    </Para>
                </Section>

                <Divider />

                <Section title="5. Third-Party Services">
                    <Para>
                        {APP_NAME} does not use any third-party analytics, advertising, or data-sharing services. The tools used to build this app run entirely on your phone and do not send any information to the internet.
                    </Para>
                    <Para>
                        If you download {APP_NAME} through the Apple App Store or Google Play Store, those stores have their own privacy policies that cover what they collect when you download or install an app — that is separate from this policy.
                    </Para>
                </Section>

                <Divider />

                <Section title="6. Deleting Your Data">
                    <Para>
                        You are in full control of your data at all times:
                    </Para>
                    <BulletItem
                        title="Factory Reset"
                        description='Go to Settings → Danger Zone → Factory Reset. This permanently deletes your entire local database, all security settings, and your profile. This cannot be undone.'
                    />
                    <BulletItem
                        title="Uninstalling the App"
                        description="Uninstalling Finara from your phone removes all locally stored app data, including all your transactions, accounts, and settings."
                    />
                    <BulletItem
                        title="Individual Records"
                        description="You can delete individual transactions, accounts, budgets, or goals at any time from within the app."
                    />
                    <Para>
                        Because we do not hold your data, there is nothing for us to delete on our end. Your data starts and ends on your device.
                    </Para>
                </Section>

                <Divider />

                <Section title="7. Children's Privacy">
                    <Para>
                        {APP_NAME} is intended for users aged 13 and over. We do not knowingly collect personal information from children under 13. Because the app collects no data at all, this risk is minimal — but if you are a parent and have concerns, please contact us.
                    </Para>
                </Section>

                <Divider />

                <Section title="8. Changes to This Policy">
                    <Para>
                        If we change our data practices in a future version of {APP_NAME}, we will update this Privacy Policy and revise the "Last updated" date at the top. We encourage you to review this policy periodically.
                    </Para>
                    <Para>
                        Material changes — such as adding network connectivity, analytics, or accounts — would represent a significant shift in the app's design and would be clearly communicated in release notes.
                    </Para>
                </Section>

                <Divider />

                <Section title="9. Contact">
                    <Para>
                        Questions about this Privacy Policy or how {APP_NAME} handles your data? You can reach out to us through the app's support channel.
                    </Para>
                </Section>
            </ScrollView>
        </View>
    );
}
