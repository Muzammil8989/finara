import * as Notifications from 'expo-notifications';
import { NotificationService } from '@/features/notifications/services/notification-service';
import { SecurityService } from '@/features/auth/services/security-service';
import { installInMemorySecureStore } from '@/tests/helpers/secure-store';

const scheduled = () =>
    (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(([req]) => req.content.body as string);

beforeEach(() => {
    jest.clearAllMocks();
    installInMemorySecureStore({ notifications_enabled: 'true' });
});

describe('Notifications stay private when the app is locked with a PIN', () => {
    it('shows bill names when no app security is set', async () => {
        await NotificationService.sendRecurringAlert(1, ['Rent']);
        expect(scheduled()[0]).toContain('Rent');
    });

    it('leaves bill names out when a PIN is set', async () => {
        await SecurityService.setPin('1234');
        await NotificationService.sendRecurringAlert(2, ['Rent', 'Gym']);
        expect(scheduled()[0]).toBe('2 bills auto-processed. Open Folio to review.');
    });

    it('leaves goal names out when a PIN is set', async () => {
        await SecurityService.setPin('1234');
        await NotificationService.sendSavingsMilestone('Secret trip', 50);
        expect(scheduled()[0]).not.toContain('Secret trip');
    });

    it('shows goal names when no app security is set', async () => {
        await NotificationService.sendSavingsMilestone('Holiday', 100);
        expect(scheduled()[0]).toContain('Holiday');
    });
});
