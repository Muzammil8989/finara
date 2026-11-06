import { getBudgetsWithDetails } from '@/lib/db/queries';
import { loadSpendByRange } from '@/features/budgets/services/budget-spend';
import { getPeriodDateRange } from '@/lib/utils/date';
import { logger } from '@/lib/logger';
import { UserService } from '@/features/user/services/user-service';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { SecurityService } from '@/features/auth/services/security-service';
import { Platform } from 'react-native';

const PREF_KEY = 'notifications_enabled';
const DAILY_REMINDER_ID = 'finara-daily-reminder';
// Legacy identifier from when the app was named "WealthFlow". Kept here only so
// upgraded installs can cancel the stale schedule still sitting in the OS queue.
const LEGACY_DAILY_REMINDER_ID = 'wf-daily-reminder';

/**
 * Notifications show on the phone's lock screen, outside the app's PIN.
 * With app security on, keep names and amounts out of them.
 */
const keepPrivate = () => SecurityService.isSecurityConfigured();

export const NotificationService = {
    async requestPermissions(): Promise<boolean> {
        try {
            if (Platform.OS === 'web') return false;
            const { status: existing } = await Notifications.getPermissionsAsync();
            if (existing === 'granted') return true;
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        } catch (e) {
            logger.error('Failed to request notification permissions', e);
            return false;
        }
    },

    async isEnabled(): Promise<boolean> {
        try {
            return (await SecureStore.getItemAsync(PREF_KEY)) === 'true';
        } catch {
            return false;
        }
    },

    async setEnabled(val: boolean): Promise<void> {
        try {
            await SecureStore.setItemAsync(PREF_KEY, val ? 'true' : 'false');
        } catch (e) {
            logger.error('Failed to save notification preference', e);
        }
    },

    async scheduleDailyReminder(): Promise<void> {
        try {
            if (!(await this.isEnabled())) return;
            await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
            await Notifications.cancelScheduledNotificationAsync(LEGACY_DAILY_REMINDER_ID).catch(() => {});
            await Notifications.scheduleNotificationAsync({
                identifier: DAILY_REMINDER_ID,
                content: {
                    title: 'Folio Daily Reminder',
                    body: "Don't forget to log today's expenses & income!",
                    sound: true,
                },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 21, minute: 0 },
            });
            logger.info('Daily reminder scheduled for 9 PM');
        } catch (e) {
            logger.error('Failed to schedule daily reminder', e);
        }
    },

    async cancelDailyReminder(): Promise<void> {
        try {
            await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
            await Notifications.cancelScheduledNotificationAsync(LEGACY_DAILY_REMINDER_ID).catch(() => {});
            logger.info('Daily reminder cancelled');
        } catch (e) {
            logger.error('Failed to cancel daily reminder', e);
        }
    },

    async sendRecurringAlert(count: number, names: string[]): Promise<void> {
        try {
            if (!(await this.isEnabled())) return;
            const nameList = names.slice(0, 3).join(', ');
            const more = names.length > 3 ? ` +${names.length - 3} more` : '';
            const summary = `${count} bill${count > 1 ? 's' : ''} auto-processed`;
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Recurring Bills Processed',
                    body: (await keepPrivate()) ? `${summary}. Open Folio to review.` : `${summary}: ${nameList}${more}`,
                    sound: true,
                },
                trigger: null,
            });
        } catch (e) {
            logger.error('Failed to send recurring alert', e);
        }
    },

    /**
     * Alert once when an expense pushes a budget across its threshold.
     * `date` is the expense's date: an expense outside a budget's current
     * period doesn't change that period's spend, so it can't trigger it.
     */
    async checkAndSendBudgetAlert(categoryId: number, newAmount: number, date?: string): Promise<void> {
        try {
            if (!(await this.isEnabled())) return;
            const profile = await UserService.getProfile();
            const budgetsRaw = await getBudgetsWithDetails();
            const hideDetails = await keepPrivate();
            // An expense outside a budget's current period can't trigger it.
            const relevant = budgetsRaw
                .filter(b => b.category_id === null || b.category_id === categoryId)
                .map(budget => ({ budget, range: getPeriodDateRange(budget.period) }))
                .filter(({ range }) => !date || (date >= range.startDate && date <= range.endDate));
            if (relevant.length === 0) return;
            const spentIn = await loadSpendByRange(relevant.map(r => r.range));

            for (const { budget, range } of relevant) {
                const spent = spentIn(range, budget.category_id);
                const threshold = budget.alert_threshold ?? 80;
                const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const prevPercent = budget.amount > 0 ? ((spent - newAmount) / budget.amount) * 100 : 0;
                if (percentUsed >= threshold && prevPercent < threshold) {
                    const remaining = budget.amount - spent;
                    const formatted = UserService.formatCurrency(Math.abs(remaining), profile.currency);
                    const tail = remaining < 0 ? `over by ${formatted}` : `${formatted} left`;
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: 'Budget Alert',
                            body: hideDetails
                                ? 'A budget has reached its alert limit. Open Folio to review.'
                                : `${budget.categoryName || 'Overall'} budget is ${Math.round(percentUsed)}% used — ${tail}`,
                            sound: true,
                        },
                        trigger: null,
                    });
                    logger.info(`Budget alert sent for ${budget.categoryName}`);
                }
            }
        } catch (e) {
            logger.error('Failed to check budget alert', e);
        }
    },

    async sendBackupComplete(fileName: string): Promise<void> {
        try {
            if (!(await this.isEnabled())) return;
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Auto-Backup Complete',
                    body: `Your data was backed up to "${fileName}".`,
                    sound: true,
                },
                trigger: null,
            });
            logger.info('Backup-complete notification sent');
        } catch (e) {
            logger.error('Failed to send backup-complete notification', e);
        }
    },

    async sendSavingsMilestone(goalName: string, milestone: number): Promise<void> {
        try {
            if (!(await this.isEnabled())) return;
            let body = milestone >= 100
                ? `${goalName} goal is complete! Congratulations!`
                : `${goalName} is ${milestone}% complete — keep going!`;
            if (await keepPrivate()) body = 'A savings goal reached a milestone. Open Folio to see it.';
            await Notifications.scheduleNotificationAsync({
                content: { title: 'Savings Milestone!', body, sound: true },
                trigger: null,
            });
        } catch (e) {
            logger.error('Failed to send savings milestone notification', e);
        }
    },
};
