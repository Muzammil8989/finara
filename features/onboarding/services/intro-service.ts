import * as SecureStore from 'expo-secure-store';
import { logger } from '@/lib/logger';

/** Set once the first-launch intro has been seen (Skip or Get started). */
const INTRO_SEEN_KEY = 'folio_intro_seen';

/**
 * The intro carousel is for new users only: shown once, never again — even if
 * they leave profile setup half-way and reopen the app. A factory reset
 * clears this so the next (new) user sees it.
 */
export const IntroService = {
    async hasSeen(): Promise<boolean> {
        try {
            return (await SecureStore.getItemAsync(INTRO_SEEN_KEY)) === '1';
        } catch (e) {
            logger.error('Could not read intro flag', e);
            return false;
        }
    },
    async markSeen(): Promise<void> {
        try {
            await SecureStore.setItemAsync(INTRO_SEEN_KEY, '1');
        } catch (e) {
            logger.error('Could not save intro flag', e);
        }
    },
    async reset(): Promise<void> {
        await SecureStore.deleteItemAsync(INTRO_SEEN_KEY).catch(() => {});
    },
};
