import { useModals, type ModalType } from '@/providers/modal-context';
import { useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FAB_SIZE, Fab } from '@/components/common/fab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from './custom-tab-bar';

const FAB_GAP = 16;

/**
 * What the + button does on each tab. One clear action per screen —
 * the tab headers no longer carry their own add buttons.
 */
const FAB_ACTIONS: Record<string, { modal: Exclude<ModalType, null>; label: string } | null> = {
    index: { modal: 'transaction', label: 'Add transaction' },
    transactions: { modal: 'transaction', label: 'Add transaction' },
    budget: { modal: 'budget', label: 'Add budget' },
    savings: { modal: 'savings', label: 'Add savings goal' },
    reports: null,
};

/** The tab route the user is on: segments are ['(tabs)'] for index, ['(tabs)', 'budget'] otherwise. */
export function useActiveTab(): string {
    const segments = useSegments() as string[];
    const i = segments.indexOf('(tabs)');
    return segments[i + 1] ?? 'index';
}

export function GlobalFab() {
    const { openModal } = useModals();
    const insets = useSafeAreaInsets();
    const tab = useActiveTab();
    const action = FAB_ACTIONS[tab];

    if (!action) return null;

    const bottom = TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + FAB_GAP;

    return (
        // Sized explicitly, and elevated on Android: siblings there stack by
        // elevation before zIndex, so screen content must never cover the FAB.
        <View style={[styles.container, { bottom }]} pointerEvents="box-none">
            <Fab
                testID="global-fab"
                accessibilityLabel={action.label}
                onPress={() => openModal(action.modal)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 20,
        width: FAB_SIZE,
        height: FAB_SIZE,
        zIndex: 1001,
        elevation: 12,
    },
});
