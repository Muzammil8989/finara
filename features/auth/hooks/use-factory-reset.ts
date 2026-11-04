import { useModalActions } from '@/providers/modal-context';
import { useAuth } from '@/features/auth/context/auth-context';
import { SecurityService } from '@/features/auth/services/security-service';
import { useUser } from '@/features/user/context/user-context';
import { BackupService } from '@/features/backup/services/backup-service';
import { clearDatabase } from '@/lib/db/migrations';
import * as Notifications from 'expo-notifications';
import { logger } from '@/lib/logger';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

/**
 * Wipe all app data and return the app to a clean, unlocked, not-onboarded
 * state. Shared by Settings, the lock screen ("Forgot PIN") and Security Setup.
 *
 * Order matters: security must be re-checked after it is cleared, otherwise
 * the auth context still reports a PIN and the lock screen stays up with no
 * PIN to enter.
 */
export function useFactoryReset() {
    const db = useSQLiteContext();
    const { recheckSecurity } = useAuth();
    const { updateProfile } = useUser();
    const { triggerRefresh } = useModalActions();

    return useCallback(async () => {
        await clearDatabase(db);
        await SecurityService.clearSecurity();
        // Otherwise auto-backup keeps writing to the old folder and old
        // reminders keep firing after the reset. Best effort: cleanup must
        // never stop the reset itself.
        try {
            await BackupService.clearSettings();
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (e) {
            logger.error('Factory reset cleanup failed', e);
        }
        await recheckSecurity();
        await updateProfile({ name: '', avatar: null, currency: 'USD', isOnboarded: false });
        triggerRefresh();
    }, [db, recheckSecurity, updateProfile, triggerRefresh]);
}
