/**
 * Render a screen or component inside the app's real providers
 * (SafeArea, Auth, User, Modal) for screen-level tests.
 *
 *   const { getByText } = await renderWithProviders(<PaymentMethodsScreen />);
 *
 * Waits for the UserProvider's async profile load before returning, so
 * screens render with the profile in place.
 */
import { ModalProvider } from '@/providers/modal-context';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { UserProvider } from '@/features/user/context/user-context';
import type { UserProfile } from '@/features/user/services/user-service';
import { act, render, RenderOptions } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installInMemorySecureStore } from './secure-store';

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export const TEST_PROFILE: UserProfile = {
  name: 'Test User',
  avatar: null,
  currency: 'USD',
  theme: 'light',
  isOnboarded: true,
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <AuthProvider>
        <UserProvider>
          <ModalProvider>{children}</ModalProvider>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export async function renderWithProviders(
  ui: React.ReactElement,
  {
    profile = TEST_PROFILE,
    secureStore = {},
    ...options
  }: { profile?: Partial<UserProfile>; secureStore?: Record<string, string> } & RenderOptions = {}
) {
  const store = installInMemorySecureStore({
    finara_user_profile: JSON.stringify({ ...TEST_PROFILE, ...profile }),
    ...secureStore,
  });
  const result = render(ui, { wrapper: AppProviders, ...options });
  // Let the profile load + first effects settle.
  await act(async () => {});
  return Object.assign(result, { secureStore: store });
}

/** Run InteractionManager.runAfterInteractions callbacks immediately. */
export function runInteractionsImmediately() {
  const { InteractionManager } = require('react-native');
  jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((cb: any) => {
    const p = Promise.resolve().then(() => (typeof cb === 'function' ? cb() : cb?.gen?.()));
    return { then: p.then.bind(p), done: () => {}, cancel: () => {} } as any;
  });
}
