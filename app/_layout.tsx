import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, AppState, LogBox, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import '../global.css';

import { ErrorBoundary, LockScreen } from '@/components/layouts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { logger } from '@/lib/logger';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/features/auth/context/auth-context';
import { ModalProvider } from '@/context/modal-context';
import { UserProvider, useUser } from '@/features/user/context/user-context';
import { setDbInstance } from '@/lib/db/db-client';
import { clearDatabase, initializeDatabase } from '@/lib/db/migrations';
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '@/features/notifications/services/notification-service';
import { BackupService } from '@/services/backup-service';

const PRIMARY_COLOR = '#246BFD';

SplashScreen.preventAutoHideAsync().catch(() => {});

const initDb = async (db: SQLiteDatabase) => {
  try {
    await initializeDatabase(db);
    setDbInstance(db);
  } catch (e) {
    logger.error('Database initialization failed, attempting cleanup...', e);
    try {
      await clearDatabase(db);
      await initializeDatabase(db);
      setDbInstance(db);
      logger.info('Database recovered from corruption');
    } catch (cleanupError) {
      logger.error('Failed to recover database:', cleanupError);
      throw cleanupError;
    }
  }
};

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  "Couldn't find a navigation context",
  'navigation context',
  'NavigationContainer',
]);

// Strip the default Android underline / focus highlight from every TextInput.
// Individual inputs can still override by passing their own underlineColorAndroid.
(TextInput as unknown as { defaultProps?: Record<string, unknown> }).defaultProps = {
  ...((TextInput as unknown as { defaultProps?: Record<string, unknown> }).defaultProps ?? {}),
  underlineColorAndroid: 'transparent',
  selectionColor: PRIMARY_COLOR,
};

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  logger.error('Failed to set notification handler', e);
}

export const unstable_settings = {
  anchor: '(tabs)',
};

// React Navigation's DefaultTheme / DarkTheme set colors.background to white/black.
// During the very first push of a lazy-imported screen, react-native-screens paints
// that color in the gap before the screen content mounts — visible as a hairline
// "shadow" leaking at the slide edge. Override with the app's real backgrounds.
const APP_LIGHT_BG = '#F4F7FA';
const APP_DARK_BG = '#0E1117';

const AppLightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: APP_LIGHT_BG },
};
const AppDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: APP_DARK_BG },
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isLocked, isSecurityEnabled, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isUserLoading } = useUser();
  const isLoading = isAuthLoading || isUserLoading;

  // Keep the native splash up until the user profile (which carries the
  // theme preference) has actually loaded. Hiding the splash on fonts-loaded
  // alone makes the JS app paint with the device color scheme first and then
  // flip to the user's saved theme — the visible black-to-white flash on boot.
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync().catch(() => {});
  }, [isLoading]);

  // Defers Stack render to the second commit so NativeWind's appearance observer
  // doesn't fire state updates on components that haven't mounted yet.
  const [mounted, setMounted] = useState(false);

  const hasNotifiedRef = useRef(false);
  const prevIsOnboardedRef = useRef<boolean | null>(null);

  const overlayOpacity = useSharedValue(1);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  // Mark as mounted after the first commit — Stack renders from here onwards.
  useEffect(() => {
    setMounted(true);
    // One-time cleanup of legacy "WealthFlow" daily reminder left over from
    // pre-rebrand builds. Without this, existing users get duplicate 9 PM
    // notifications (legacy + new) until they reschedule via settings.
    Notifications.cancelScheduledNotificationAsync('wf-daily-reminder').catch(() => {});
  }, []);

  // App-wide auto-backup. Runs whenever the app is opened or brought back to the
  // foreground; BackupService enforces the 12h interval internally, so this only
  // actually writes a backup once per window. Previously this lived on the
  // Settings screen, so it never fired unless the user happened to open Settings.
  useEffect(() => {
    if (isLoading) return;

    const checkAutoBackup = () => {
      BackupService.runAutoBackupIfNeeded().catch((error) => {
        logger.error('Auto-backup check failed', error);
      });
    };

    checkAutoBackup();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkAutoBackup();
    });
    return () => sub.remove();
  }, [isLoading]);

  // Effect 1: once mounted and data loaded, resolve the initial route then fade the overlay.
  useEffect(() => {
    if (!mounted || isLoading) return;

    prevIsOnboardedRef.current = profile.isOnboarded;

    if (!profile.isOnboarded) {
      router.replace('/onboarding');
    }

    // Prefetch every push-stack route so its JS module is parsed BEFORE the
    // user first navigates. Without this, the first push of e.g. /settings
    // runs the import + first render during the slide animation — which is
    // the "buggy / skeleton-y" flash on first navigation only.
    const PREFETCH_ROUTES = [
      '/settings',
      '/security-setup',
      '/payment-methods',
      '/categories',
      '/recurring',
      '/household',
      '/household-history',
      '/loans',
      '/terms',
      '/privacy',
    ] as const;
    PREFETCH_ROUTES.forEach((path) => {
      try { router.prefetch(path as never); } catch { /* harmless if route doesn't exist yet */ }
    });

    overlayOpacity.value = withTiming(
      0,
      { duration: 380, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(setOverlayVisible)(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isLoading]);

  // Effect 2: react to profile.isOnboarded changes after init (completing onboarding).
  useEffect(() => {
    if (!mounted || isLoading || prevIsOnboardedRef.current === null) return;

    const wasOnboarded = prevIsOnboardedRef.current;
    const isNowOnboarded = profile.isOnboarded;
    prevIsOnboardedRef.current = isNowOnboarded;

    if (!wasOnboarded && isNowOnboarded) {
      router.replace('/(tabs)');
    }

    if (isNowOnboarded && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      NotificationService.scheduleDailyReminder().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isLoading, profile.isOnboarded]);

  const showLock = isSecurityEnabled && isLocked;

  const screenBg = colorScheme === 'dark' ? APP_DARK_BG : APP_LIGHT_BG;
  const opaqueContent = { contentStyle: { backgroundColor: screenBg } };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
      {/*
       * Stack is withheld on the very first render (mounted=false).
       * This prevents NativeWind's appearance observer from dispatching state
       * updates into components that haven't finished mounting yet.
       * The opaque overlay covers the gap — users see nothing during this frame.
       *
       * LockScreen is rendered ABOVE the Stack (not in place of it) so that
       * unlocking does not remount the navigator — all screen state, form
       * inputs, and tab positions survive an app re-open / lock cycle.
       */}
      {mounted && (
        <Stack
          screenOptions={{
            headerShown: false,
            // Opaque background — the navigation theme background is the fallback
            // shown during a lazy-imported screen's first mount. Match it here so
            // there's no shadow leak on the first push to any route.
            contentStyle: { backgroundColor: screenBg },
            animation: 'slide_from_right',
            animationDuration: 250,
            gestureEnabled: true,
          }}
        >
          {/* Onboarding has its own LinearGradient — keep transparent so the gradient shows. */}
          <Stack.Screen
            name="onboarding"
            options={{ contentStyle: { backgroundColor: 'transparent' }, animation: 'fade', animationDuration: 300 }}
          />
          <Stack.Screen name="(tabs)" options={{ ...opaqueContent, animation: 'fade', animationDuration: 250 }} />
          <Stack.Screen name="settings" options={opaqueContent} />
          <Stack.Screen name="security-setup" options={opaqueContent} />
          <Stack.Screen name="payment-methods" options={opaqueContent} />
          <Stack.Screen name="categories" options={opaqueContent} />
          <Stack.Screen name="recurring" options={opaqueContent} />
          <Stack.Screen name="household" options={opaqueContent} />
          <Stack.Screen name="household-history" options={opaqueContent} />
          <Stack.Screen name="loans" options={opaqueContent} />
          <Stack.Screen name="terms" options={opaqueContent} />
          <Stack.Screen name="privacy" options={opaqueContent} />
          <Stack.Screen name="+not-found" />
        </Stack>
      )}

      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {showLock && (
        <View style={StyleSheet.absoluteFillObject}>
          <LockScreen />
        </View>
      )}

      {overlayVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            overlayStyle,
            {
              // Brand blue — matches the native splash. Using a theme-dependent
              // color here causes a dark/light flash when the device color and
              // the user's saved app theme don't match (e.g. dark phone +
              // saved light theme = the user sees a black flash before light).
              backgroundColor: PRIMARY_COLOR,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
        </Animated.View>
      )}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  // Splash is intentionally NOT hidden here — RootLayoutContent hides it only
  // once the user profile (and therefore the theme) is loaded, to avoid the
  // boot-time light/dark flash.

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="wealthflow.db" onInit={initDb}>
          <AuthProvider>
            <UserProvider>
              <ModalProvider>
                <RootLayoutContent />
              </ModalProvider>
            </UserProvider>
          </AuthProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
