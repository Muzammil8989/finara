import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { BackupService } from '@/services/backup-service';
import { logger } from '@/lib/logger';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, InteractionManager, Modal, Pressable, Text, View } from 'react-native';

import { ToggleRow } from './toggle-row';

// ─── Reusable backup action card ────────────────────────────────────────────

interface BackupCardProps {
    icon: IoniconsName;
    iconColor: string;
    title: string;
    subtitle: string;
    badgeLabel: string;
    badgeColor: string;
    onPress: () => void;
    disabled?: boolean;
    noBorder?: boolean;
}

function BackupCard({
    icon, iconColor, title, subtitle, badgeLabel, badgeColor, onPress, disabled, noBorder,
}: BackupCardProps) {
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            className={`flex-row items-center p-5 ${!noBorder ? 'border-b border-divider dark:border-dark-divider' : ''}`}
            style={({ pressed }) => ({ opacity: disabled || pressed ? 0.55 : 1 })}
        >
            <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-4"
            >
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>

            <View className="flex-1 mr-3">
                <ThemedText className="text-base font-semibold text-textPrimary dark:text-dark-textPrimary">
                    {title}
                </ThemedText>
                <ThemedText className="text-xs text-textMuted dark:text-dark-textMuted mt-0.5" numberOfLines={1}>
                    {subtitle}
                </ThemedText>
            </View>

            <View
                className="rounded-xl px-3 py-1.5"
                style={{ backgroundColor: `${badgeColor}1A` }}
            >
                <ThemedText className="text-xs font-bold" style={{ color: badgeColor }}>
                    {badgeLabel}
                </ThemedText>
            </View>
        </Pressable>
    );
}

// ─── Main section ────────────────────────────────────────────────────────────

export function DataBackupSection({ onRestoreComplete }: { onRestoreComplete?: () => void }) {
    const colors = useThemeColors();
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
    const [lastExportTime, setLastExportTime] = useState<Date | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    // Always read from SecureStore — this is the single source of truth
    const loadPrefs = useCallback(async () => {
        const [enabled, last] = await Promise.all([
            BackupService.getAutoBackupEnabled(),
            BackupService.getLastBackupTime(),
        ]);
        setAutoBackupEnabled(enabled);
        setLastExportTime(last);
    }, []);

    useEffect(() => { loadPrefs(); }, [loadPrefs]);

    // ── Export ──────────────────────────────────────────────────────────────

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const result = await BackupService.saveToDevice({ allowPrompt: true });
            if (!result) return; // skipped (no folder) — only happens for silent auto-backup
            const { fileName, location } = result;
            await loadPrefs(); // re-read SecureStore so display is always accurate
            Alert.alert('Backup Saved', `"${fileName}" has been saved to ${location}.`);
        } catch (error) {
            logger.error('Export failed', error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Export Failed', msg);
        } finally {
            setIsExporting(false);
        }
    };

    // ── Restore ─────────────────────────────────────────────────────────────

    // Open the picker WITHOUT closing the modal first.
    // The system file picker appears on top of the modal; if the user
    // cancels it they land back on the warning sheet and can try again.
    const handleSelectFile = async () => {
        if (isImporting) return;
        setIsImporting(true);
        try {
            const result = await BackupService.pickAndRestoreBackup();
            // File was selected and restore succeeded — now close the sheet
            setShowRestoreModal(false);
            await loadPrefs();
            InteractionManager.runAfterInteractions(() => {
                Alert.alert('Restore Complete', result.message, [
                    { text: 'OK', onPress: () => onRestoreComplete?.() },
                ]);
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            if (msg === 'No file selected') {
                // User cancelled picker — leave modal open so they can retry
                return;
            }
            logger.error('Restore failed', error);
            setShowRestoreModal(false);
            InteractionManager.runAfterInteractions(() => {
                Alert.alert('Restore Failed', msg);
            });
        } finally {
            setIsImporting(false);
        }
    };

    // ── Auto-backup toggle ───────────────────────────────────────────────────

    const handleAutoBackupToggle = async () => {
        const next = !autoBackupEnabled;
        setAutoBackupEnabled(next);
        await BackupService.setAutoBackupEnabled(next);
    };

    // ── Helpers ──────────────────────────────────────────────────────────────

    const formatLastExport = (): string => {
        if (!lastExportTime) return 'No export yet — tap Save to create one';
        const diff = Date.now() - lastExportTime.getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);
        if (mins < 1) return 'Last export: just now';
        if (mins < 60) return `Last export: ${mins}m ago`;
        if (hrs < 24) return `Last export: ${hrs}h ago`;
        if (days === 1) return 'Last export: yesterday';
        if (days < 7) return `Last export: ${days} days ago`;
        return `Last export: ${lastExportTime.toLocaleDateString()}`;
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <View className="mb-8">
            <ThemedText className="mb-4 text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted">
                Data & Backup
            </ThemedText>

            <View className="bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-3xl overflow-hidden">
                <BackupCard
                    icon={isExporting ? 'hourglass-outline' : 'download-outline'}
                    iconColor={colors.success}
                    title={isExporting ? 'Saving backup…' : 'Download Backup'}
                    subtitle={formatLastExport()}
                    badgeLabel={isExporting ? '…' : 'Save'}
                    badgeColor={colors.success}
                    onPress={handleExport}
                    disabled={isExporting}
                />

                <BackupCard
                    icon={isImporting ? 'hourglass-outline' : 'cloud-upload-outline'}
                    iconColor={colors.primary}
                    title={isImporting ? 'Restoring…' : 'Restore Backup'}
                    subtitle="Recover all data from a backup file"
                    badgeLabel={isImporting ? '…' : 'Restore'}
                    badgeColor={colors.primary}
                    onPress={() => setShowRestoreModal(true)}
                    disabled={isImporting}
                />

                <ToggleRow
                    icon="timer-outline"
                    iconBgColor={`${colors.warning}1A`}
                    iconColor={colors.warning}
                    title="Auto-Backup"
                    subtitle={
                        autoBackupEnabled
                            ? 'Saves automatically every 12 hours'
                            : 'Off — enable to auto-save every 12 hours'
                    }
                    enabled={autoBackupEnabled}
                    onToggle={handleAutoBackupToggle}
                    noBorder
                />
            </View>

            <ThemedText className="mt-2 mx-1 text-[11px] text-textMuted dark:text-dark-textMuted leading-4">
                Back up regularly. If you forget your PIN or switch devices, restore from a backup to recover all your data.
            </ThemedText>

            {/* ── Restore bottom-sheet modal ─────────────────────────────── */}
            {/* All styles inside Modal use explicit style props — NativeWind
                className does not reliably apply inside a native Modal layer */}
            <Modal
                visible={showRestoreModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowRestoreModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
                    {/* Backdrop — tap to dismiss */}
                    <Pressable style={{ flex: 1 }} onPress={() => setShowRestoreModal(false)} />

                    {/* Sheet */}
                    <View style={{
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        paddingHorizontal: 24,
                        paddingTop: 16,
                        paddingBottom: 40,
                    }}>
                        {/* Handle bar */}
                        <View style={{
                            width: 40, height: 4, borderRadius: 2,
                            backgroundColor: colors.borderStrong,
                            alignSelf: 'center', marginBottom: 24,
                        }} />

                        {/* Icon + heading */}
                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <View style={{
                                width: 64, height: 64, borderRadius: 18,
                                backgroundColor: colors.warningBg,
                                alignItems: 'center', justifyContent: 'center',
                                marginBottom: 16,
                            }}>
                                <Ionicons name="cloud-upload-outline" size={30} color={colors.warning} />
                            </View>

                            <Text style={{
                                fontSize: 20, fontWeight: '700',
                                color: colors.textPrimary, textAlign: 'center',
                            }}>
                                Restore from Backup
                            </Text>
                            <Text style={{
                                fontSize: 13, color: colors.textMuted,
                                textAlign: 'center', marginTop: 6,
                                lineHeight: 18, paddingHorizontal: 16,
                            }}>
                                Select a Finara backup file (.json) to recover your data
                            </Text>
                        </View>

                        {/* Warning list */}
                        <View style={{
                            backgroundColor: colors.warningBg,
                            borderRadius: 16, padding: 16, marginBottom: 24,
                        }}>
                            {[
                                'All existing transactions will be deleted',
                                'Accounts, budgets & categories will be overwritten',
                                'This action cannot be undone',
                            ].map((item, i, arr) => (
                                <View key={i} style={{
                                    flexDirection: 'row', alignItems: 'flex-start',
                                    marginBottom: i < arr.length - 1 ? 12 : 0,
                                }}>
                                    <Ionicons
                                        name="alert-circle"
                                        size={15}
                                        color={colors.warning}
                                        style={{ marginTop: 2, marginRight: 8 }}
                                    />
                                    <Text style={{
                                        fontSize: 13, flex: 1, lineHeight: 20,
                                        color: colors.warningText,
                                    }}>
                                        {item}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Primary button */}
                        <Pressable
                            onPress={handleSelectFile}
                            disabled={isImporting}
                            style={{
                                backgroundColor: isImporting ? colors.btnDisabledBg : colors.primary,
                                borderRadius: 16,
                                paddingVertical: 16,
                                alignItems: 'center',
                                marginBottom: 12,
                                opacity: isImporting ? 0.6 : 1,
                            }}
                        >
                            <Text style={{
                                fontSize: 16, fontWeight: '700',
                                color: isImporting ? colors.btnDisabledText : colors.textOnPrimary,
                            }}>
                                {isImporting ? 'Restoring…' : 'Choose Backup File'}
                            </Text>
                        </Pressable>

                        {/* Cancel button */}
                        <Pressable
                            onPress={() => setShowRestoreModal(false)}
                            style={{
                                backgroundColor: 'transparent',
                                borderRadius: 16,
                                paddingVertical: 16,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: colors.borderStrong,
                            }}
                        >
                            <Text style={{
                                fontSize: 16, fontWeight: '600',
                                color: colors.textSecondary,
                            }}>
                                Cancel
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
