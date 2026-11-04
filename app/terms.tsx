import { ScreenHeader, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LAST_UPDATED = 'May 2026';
const APP_NAME = 'Folio';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View className="mb-7">
            <ThemedText type="headline" className="text-xl leading-7 mb-3" accessibilityRole="header">
                {title}
            </ThemedText>
            {children}
        </View>
    );
}

function Para({ children }: { children: React.ReactNode }) {
    return (
        <ThemedText className="text-[15px] leading-6 text-textPrimary dark:text-dark-textPrimary mb-3">
            {children}
        </ThemedText>
    );
}

function BulletItem({ children }: { children: React.ReactNode }) {
    const colors = useThemeColors();
    return (
        <View className="flex-row mb-2.5 pr-2">
            <View className="w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: colors.primary }} />
            <ThemedText className="text-[15px] leading-6 flex-1 text-textPrimary dark:text-dark-textPrimary">
                {children}
            </ThemedText>
        </View>
    );
}

function Divider() {
    const colors = useThemeColors();
    return <View className="h-px mb-7" style={{ backgroundColor: colors.divider }} />;
}

export default function TermsScreen() {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <ScreenHeader
                title="Terms of Use"
                subtitle={`Last updated ${LAST_UPDATED}`}
                withInsets
                border
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Intro */}
                <View className="mb-7">
                    <ThemedText className="text-[17px] leading-[26px]" style={{ color: colors.textSecondary }}>
                        By using {APP_NAME}, you agree to these terms. We have written them in plain language so you know exactly what this app is, what it is not, and what your responsibilities are.
                    </ThemedText>
                </View>

                <Section title="1. What Folio Is">
                    <Para>
                        {APP_NAME} is a personal budgeting tool. You use it to write down your income and expenses, set spending limits, and keep track of savings. That is all it does.
                    </Para>
                    <Para>
                        {APP_NAME} is not a bank. It cannot move or hold your money. It is not connected to your bank account unless you manually type in your numbers yourself. It is not a financial advisor.
                    </Para>
                </Section>

                <Divider />

                <Section title="2. This Is Not Financial Advice">
                    <Para>
                        Nothing you see in {APP_NAME} — budgets, charts, totals, reports — is financial advice. The app simply shows you what you have typed in. It does not tell you how to invest, what to buy, or how to manage debt.
                    </Para>
                    <Para>
                        If you need real financial guidance, please speak with a qualified financial professional. Do not rely on this app to make major money decisions.
                    </Para>
                </Section>

                <Divider />

                <Section title="3. Your Information Stays on Your Phone">
                    <Para>
                        Everything you add to {APP_NAME} — every transaction, account, budget, and goal — is saved only on your phone. We do not receive it, see it, or store it anywhere else.
                    </Para>
                    <Para>
                        Because of this, if you delete the app, switch phones without taking a backup, or lose your phone, your data is gone permanently. We cannot get it back for you.
                    </Para>
                    <Para>
                        We strongly recommend using the export feature inside the app to save a copy of your records regularly.
                    </Para>
                </Section>

                <Divider />

                <Section title="4. The Numbers Are Only as Good as What You Enter">
                    <Para>
                        {APP_NAME} does not check your figures against your real bank balance. It only knows what you have typed. If you enter something wrong, the totals will be wrong too.
                    </Para>
                    <Para>
                        Do not use {APP_NAME} as your official financial record for tax purposes or legal matters.
                    </Para>
                </Section>

                <Divider />

                <Section title="5. How You May Use This App">
                    <BulletItem>
                        You may use {APP_NAME} for your own personal, non-business use.
                    </BulletItem>
                    <BulletItem>
                        You may not try to copy, break apart, or reverse-engineer the app.
                    </BulletItem>
                    <BulletItem>
                        You may not use the app to do anything illegal.
                    </BulletItem>
                </Section>

                <Divider />

                <Section title="6. No Guarantees">
                    <Para>
                        We do our best to make {APP_NAME} work correctly, but we cannot promise it will always be perfect or error-free. The app is provided as-is.
                    </Para>
                    <Para>
                        You use it at your own risk.
                    </Para>
                </Section>

                <Divider />

                <Section title="7. We Are Not Responsible for Losses">
                    <Para>
                        If something goes wrong — a calculation error, a lost record, a bug — we are not legally responsible for any money you lose or any decision you made based on what the app showed you.
                    </Para>
                    <Para>
                        Your financial choices are always your own responsibility.
                    </Para>
                </Section>

                <Divider />

                <Section title="8. Updates to These Terms">
                    <Para>
                        We may update these terms from time to time. If we do, the date at the top of this page will change. Continuing to use {APP_NAME} after an update means you are okay with the new terms.
                    </Para>
                </Section>

                <Divider />

                <Section title="9. Stopping Use">
                    <Para>
                        You can stop using {APP_NAME} at any time simply by deleting it from your phone. We may also stop offering the app at any time.
                    </Para>
                </Section>

                <Divider />

                <Section title="10. Questions">
                    <Para>
                        If you have any questions about these terms, you can reach out to us through the app’s support channel.
                    </Para>
                </Section>
            </ScrollView>
        </View>
    );
}
