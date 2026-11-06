import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { logger } from '@/lib/logger';
import { SecurityService } from '../services/security-service';

interface AuthContextType {
    isLocked: boolean;
    isSecurityEnabled: boolean;
    unlock: (pin?: string) => Promise<boolean>;
    lock: () => void;
    recheckSecurity: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Re-lock when the app has been in the background longer than this.
 * A grace period keeps short system hand-offs (photo picker, file picker,
 * share sheet) from bouncing the user to the lock screen.
 */
export const RELOCK_AFTER_MS = 30_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(true);
    const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const securityEnabledRef = useRef(false);
    const backgroundedAtRef = useRef<number | null>(null);

    const applySecurityEnabled = (enabled: boolean) => {
        securityEnabledRef.current = enabled;
        setIsSecurityEnabled(enabled);
        if (!enabled) setIsLocked(false);
    };

    // With a PIN / biometrics on, keep balances out of the app-switcher
    // thumbnail and screenshots. On Android the JS privacy cover can render too
    // late for the recents snapshot; FLAG_SECURE is applied natively.
    useEffect(() => {
        if (isLoading) return;
        (async () => {
            try {
                if (isSecurityEnabled) await ScreenCapture.preventScreenCaptureAsync();
                else await ScreenCapture.allowScreenCaptureAsync();
            } catch (error) {
                logger.error('Failed to update screen capture protection', error);
            }
        })();
    }, [isSecurityEnabled, isLoading]);

    // The biometric prompt is NOT triggered here: the LockScreen prompts when
    // it mounts. Prompting in both places opened two prompts at cold start.
    useEffect(() => {
        let mounted = true;

        const checkSecurity = async () => {
            try {
                const isConfigured = await SecurityService.isSecurityConfigured();
                if (mounted) applySecurityEnabled(isConfigured);
            } catch (error) {
                logger.error('Failed to check security configuration', error);
                if (mounted) applySecurityEnabled(false);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        checkSecurity();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'background') {
                backgroundedAtRef.current = Date.now();
            } else if (state === 'active') {
                const since = backgroundedAtRef.current;
                backgroundedAtRef.current = null;
                if (securityEnabledRef.current && since !== null && Date.now() - since >= RELOCK_AFTER_MS) {
                    setIsLocked(true);
                }
            }
        });
        return () => sub.remove();
    }, []);

    const recheckSecurity = useCallback(async () => {
        try {
            applySecurityEnabled(await SecurityService.isSecurityConfigured());
        } catch (error) {
            logger.error('Failed to recheck security', error);
        }
    }, []);

    const unlock = useCallback(async (pin?: string): Promise<boolean> => {
        try {
            const success = pin
                ? await SecurityService.verifyPin(pin)
                : await SecurityService.authenticateBio();
            if (success) { setIsLocked(false); return true; }
            return false;
        } catch (error) {
            logger.error('Unlock failed', error);
            return false;
        }
    }, []);

    const lock = useCallback(() => setIsLocked(true), []);

    const value = useMemo(
        () => ({ isLocked, isSecurityEnabled, unlock, lock, recheckSecurity, isLoading }),
        [isLocked, isSecurityEnabled, unlock, lock, recheckSecurity, isLoading],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
