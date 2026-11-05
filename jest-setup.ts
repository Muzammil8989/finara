import '@testing-library/jest-native/extend-expect';

// Suppress act() warnings from async hooks that resolve after assertion
const originalError = console.error.bind(console);
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(),
    prepareSync: jest.fn(),
    withTransactionSync: jest.fn((fn: () => void) => fn()),
    closeSync: jest.fn(),
  })),
  SQLiteProvider: ({ children }: { children: React.ReactNode }) => children,
  useSQLiteContext: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(),
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn(() => Promise.resolve()),
  allowScreenCaptureAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: 'Link',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
  Redirect: 'Redirect',
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1, NONE: 0 },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('burnt', () => ({
  toast: jest.fn(),
  alert: jest.fn(),
}));

// The official mock predates useReducedMotion; add it (motion on by default).
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));

// NativeWind's color-scheme API needs the compiled Tailwind runtime, which
// Jest doesn't run. Keep the rest of the module and stub the scheme hook.
jest.mock('nativewind', () => {
  const actual = jest.requireActual('nativewind');
  const setColorScheme = jest.fn();
  return {
    ...actual,
    useColorScheme: () => ({ colorScheme: 'light', setColorScheme, toggleColorScheme: jest.fn() }),
  };
});

// gifted-charts animates via raw setTimeout and can fire after the test
// environment is torn down (crashing the worker). Our code is what's under
// test, so render each chart as a View that exposes its data.
jest.mock('react-native-gifted-charts', () => {
  const React = require('react');
  const { View } = require('react-native');
  const chart = (name: string) => {
    const Chart = (props: { data?: unknown[] }) =>
      React.createElement(View, { testID: name, accessibilityHint: `${props.data?.length ?? 0} points` });
    Chart.displayName = name;
    return Chart;
  };
  return { BarChart: chart('BarChart'), LineChart: chart('LineChart'), PieChart: chart('PieChart') };
});

// Icon fonts are irrelevant in tests; render each icon as a Text with its name.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name, testID }: { name: string; testID?: string }) =>
    React.createElement(Text, { testID }, name);
  return new Proxy({}, { get: (_t, key) => (key === '__esModule' ? true : Icon) });
});

jest.mock('@/lib/db/db-client', () => ({
  getDb: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  })),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));
