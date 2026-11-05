jest.unmock('@/lib/db/db-client');
import { LockScreen } from '@/components/layouts/lock-screen';
import { ObscuredContent } from '@/components/layouts/obscured-content';
import { RELOCK_AFTER_MS, useAuth } from '@/features/auth/context/auth-context';
import { SecurityService } from '@/features/auth/services/security-service';
import * as q from '@/lib/db/queries';
import { renderWithProviders } from '@/tests/helpers/render-with-providers';
import { installInMemorySecureStore } from '@/tests/helpers/secure-store';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { Alert, AppState, AppStateStatus, Text } from 'react-native';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() } }));

/** What _layout.tsx renders: the lock screen over the app while locked. */
function Gate() {
  const { isLocked, isSecurityEnabled, isLoading } = useAuth();
  if (isLoading) return null;
  return isSecurityEnabled && isLocked ? <LockScreen /> : <Text>App content</Text>;
}

let db: TestDb;
let pinStore: Record<string, string>;

beforeAll(async () => {
  // Hash a real PIN with the real service, then reuse the stored entries.
  const store = installInMemorySecureStore();
  await SecurityService.setPin('1234');
  pinStore = Object.fromEntries(store);
});

beforeEach(async () => {
  db = await createTestDb();
  (useSQLiteContext as jest.Mock).mockReturnValue(db.expo);
  (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });
  jest.clearAllMocks();
});
afterEach(() => {
  db.close();
  jest.restoreAllMocks();
});

const appStateListeners = () => {
  const listeners: ((s: AppStateStatus) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, fn) => {
    listeners.push(fn as (s: AppStateStatus) => void);
    return { remove: jest.fn() } as any;
  });
  return (state: AppStateStatus) => act(() => listeners.forEach(l => l(state)));
};

/** _layout.tsx keeps the app mounted UNDER the lock screen; it must be hidden from screen readers. */
function OverlayGate() {
  const { isLocked, isSecurityEnabled, isLoading } = useAuth();
  if (isLoading) return null;
  const showLock = isSecurityEnabled && isLocked;
  return (
    <>
      <ObscuredContent hidden={showLock}><Text>Balance 1,000</Text></ObscuredContent>
      {showLock && <LockScreen />}
    </>
  );
}

describe('Lock screen hides the app from screen readers', () => {
  it('app content under the lock screen is not reachable by accessibility', async () => {
    await renderWithProviders(<OverlayGate />, { secureStore: pinStore });
    await screen.findByLabelText('1');
    expect(screen.queryByText('Balance 1,000')).toBeNull();
    expect(screen.getByText('Balance 1,000', { includeHiddenElements: true })).toBeTruthy();
  });

  it('blocks screen capture (app-switcher snapshot) while a PIN is set', async () => {
    await renderWithProviders(<OverlayGate />, { secureStore: pinStore });
    await waitFor(() => expect(ScreenCapture.preventScreenCaptureAsync).toHaveBeenCalled());
    expect(ScreenCapture.allowScreenCaptureAsync).not.toHaveBeenCalled();
  });

  it('allows screen capture when no security is set', async () => {
    await renderWithProviders(<OverlayGate />, { secureStore: {} });
    await waitFor(() => expect(ScreenCapture.allowScreenCaptureAsync).toHaveBeenCalled());
    expect(ScreenCapture.preventScreenCaptureAsync).not.toHaveBeenCalled();
  });

  it('app content is reachable again after unlocking', async () => {
    await renderWithProviders(<OverlayGate />, { secureStore: pinStore });
    for (const d of ['1', '2', '3', '4']) fireEvent.press(await screen.findByLabelText(d));
    expect(await screen.findByText('Balance 1,000', {}, { timeout: 2000 })).toBeTruthy();
  });
});

describe('Lock screen', () => {
  it('unlocks with the correct PIN', async () => {
    await renderWithProviders(<Gate />, { secureStore: pinStore });
    for (const d of ['1', '2', '3', '4']) fireEvent.press(await screen.findByLabelText(d));
    expect(await screen.findByText('App content', {}, { timeout: 2000 })).toBeTruthy();
  });

  it('"Forgot PIN" wipes data, removes the lock and goes to onboarding', async () => {
    const [cat] = await q.getCategories('income');
    const [acct] = await q.getAccounts();
    await q.createTransaction({ amount: 5, type: 'income', category_id: cat.id, account_id: acct.id, date: '2026-01-01' } as any);
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find(b => b.style === 'destructive')?.onPress?.();
    });

    const { secureStore } = await renderWithProviders(<Gate />, { secureStore: pinStore });
    await act(async () => {
      fireEvent.press(await screen.findByText('Forgot PIN?'));
    });

    // Before the fix the lock screen stayed up with no PIN left to enter.
    expect(await screen.findByText('App content')).toBeTruthy();
    expect(router.replace).toHaveBeenCalledWith('/onboarding');
    expect(secureStore.has('user_security_pin')).toBe(false);
    expect(JSON.parse(secureStore.get('finara_user_profile')!).isOnboarded).toBe(false);
    expect(db.raw.prepare('select count(*) c from transactions').get()).toEqual({ c: 0 });
  });

  it('asks for biometrics only once at startup', async () => {
    await renderWithProviders(<Gate />, { secureStore: { ...pinStore, biometric_enabled: 'true' } });
    await waitFor(() => expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled());
    await act(async () => {});
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledTimes(1);
  });
});

describe('re-lock on background', () => {
  it('locks again after the app was in the background past the grace period', async () => {
    const setState = appStateListeners();
    const now = jest.spyOn(Date, 'now');
    await renderWithProviders(<Gate />, { secureStore: pinStore });
    for (const d of ['1', '2', '3', '4']) fireEvent.press(await screen.findByLabelText(d));
    await screen.findByText('App content', {}, { timeout: 2000 });

    now.mockReturnValue(1_000_000);
    setState('background');
    now.mockReturnValue(1_000_000 + RELOCK_AFTER_MS + 1);
    setState('active');
    expect(await screen.findByText('Forgot PIN?')).toBeTruthy();
  });

  it('stays unlocked after a short trip (e.g. the photo picker)', async () => {
    const setState = appStateListeners();
    const now = jest.spyOn(Date, 'now');
    await renderWithProviders(<Gate />, { secureStore: pinStore });
    for (const d of ['1', '2', '3', '4']) fireEvent.press(await screen.findByLabelText(d));
    await screen.findByText('App content', {}, { timeout: 2000 });

    now.mockReturnValue(1_000_000);
    setState('background');
    now.mockReturnValue(1_000_000 + 5_000);
    setState('active');
    expect(screen.getByText('App content')).toBeTruthy();
  });
});
