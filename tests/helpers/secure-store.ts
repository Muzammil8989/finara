import * as SecureStore from 'expo-secure-store';

/**
 * Back the jest-mocked expo-secure-store with a real in-memory map so
 * services (PIN, profile, backup settings) behave as on device.
 * Returns the map for direct assertions.
 */
export function installInMemorySecureStore(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) => store.get(k) ?? null);
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (k: string, v: string) => {
    store.set(k, v);
  });
  (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (k: string) => {
    store.delete(k);
  });
  return store;
}
