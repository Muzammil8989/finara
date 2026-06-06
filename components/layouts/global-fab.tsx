import { useModals } from '@/context/modal-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WHITE_COLOR = '#FFFFFF';
const FAB_SIZE = 56;
const TAB_BAR_HEIGHT = 60;
const FAB_GAP = 16;

export function GlobalFab() {
    const { openModal } = useModals();
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const bottom = TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + FAB_GAP;

    return (
        <View style={[styles.container, { bottom }]} pointerEvents="auto">
            <Pressable
                style={[
                    styles.fab,
                    { backgroundColor: colors.primary, shadowColor: colors.primary },
                ]}
                onPress={() => openModal('transaction')}
            >
                <Ionicons name="add" size={32} color={WHITE_COLOR} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 20,
        zIndex: 1001,
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});
