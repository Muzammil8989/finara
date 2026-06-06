import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { logger } from '@/lib/logger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sha256 = require('js-sha256').sha256 as (input: string) => string;

function hashPin(pin: string): string {
    return sha256(pin + 'finara_salt_v1');
}

const PIN_KEY = 'user_security_pin';
const BIO_ENABLED_KEY = 'biometric_enabled';
const PIN_ATTEMPTS_KEY = 'pin_attempts';
const PIN_LOCKOUT_KEY = 'pin_lockout_until';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

export const SecurityService = {
    async getBiometricStatus() {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            return {
                available: hasHardware && isEnrolled,
                types: types.map(t => {
                    if (t === 1) return 'Fingerprint';
                    if (t === 2) return 'FaceID';
                    if (t === 3) return 'Iris';
                    return 'Unknown';
                }),
            };
        } catch (error) {
            logger.error('Failed to get biometric status', error);
            return { available: false, types: [] };
        }
    },

    async authenticateBio(): Promise<boolean> {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to access Finara',
                cancelLabel: 'Use PIN',
                disableDeviceFallback: false,
            });
            return result.success;
        } catch (e) {
            logger.error('Bio auth failed', e);
            return false;
        }
    },

    async isLockedOut(): Promise<{ locked: boolean; remainingMs: number }> {
        try {
            const lockoutUntil = await SecureStore.getItemAsync(PIN_LOCKOUT_KEY);
            if (lockoutUntil) {
                const remaining = parseInt(lockoutUntil, 10) - Date.now();
                if (remaining > 0) return { locked: true, remainingMs: remaining };
                await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY);
                await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
            }
        } catch (error) {
            logger.error('Failed to check lockout status', error);
        }
        return { locked: false, remainingMs: 0 };
    },

    async setPin(pin: string) {
        if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits');
        const hashedPin = hashPin(pin);
        await SecureStore.setItemAsync(PIN_KEY, hashedPin);
        await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
        await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY);
    },

    async verifyPin(input: string): Promise<boolean> {
        const lockout = await this.isLockedOut();
        if (lockout.locked) {
            logger.warn(`PIN locked out for ${Math.ceil(lockout.remainingMs / 60000)} more minutes`);
            return false;
        }
        try {
            const savedPin = await SecureStore.getItemAsync(PIN_KEY);
            const hashedInput = hashPin(input);
            if (savedPin === hashedInput) {
                await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
                return true;
            }
            const attemptsStr = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY);
            const attempts = attemptsStr ? parseInt(attemptsStr, 10) + 1 : 1;
            await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, attempts.toString());
            if (attempts >= MAX_PIN_ATTEMPTS) {
                await SecureStore.setItemAsync(PIN_LOCKOUT_KEY, (Date.now() + LOCKOUT_DURATION_MS).toString());
                logger.warn('PIN locked out due to too many failed attempts');
            }
            return false;
        } catch (error) {
            logger.error('PIN verification error', error);
            return false;
        }
    },

    async isSecurityConfigured(): Promise<boolean> {
        try {
            const pin = await SecureStore.getItemAsync(PIN_KEY);
            if (pin) return true;
            // biometric-only counts as configured even without a PIN
            const bioPref = await SecureStore.getItemAsync(BIO_ENABLED_KEY);
            return bioPref === 'true';
        } catch (error) {
            logger.error('Failed to check security config', error);
            return false;
        }
    },

    async hasPinConfigured(): Promise<boolean> {
        try {
            return !!(await SecureStore.getItemAsync(PIN_KEY));
        } catch (error) {
            logger.error('Failed to check PIN config', error);
            return false;
        }
    },

    async setBiometricPreference(enabled: boolean) {
        await SecureStore.setItemAsync(BIO_ENABLED_KEY, enabled ? 'true' : 'false');
    },

    async getBiometricPreference(): Promise<boolean> {
        try {
            return (await SecureStore.getItemAsync(BIO_ENABLED_KEY)) === 'true';
        } catch (error) {
            logger.error('Failed to get biometric preference', error);
            return false;
        }
    },

    async clearSecurity() {
        try {
            await SecureStore.deleteItemAsync(PIN_KEY);
            await SecureStore.deleteItemAsync(BIO_ENABLED_KEY);
            await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
            await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY);
        } catch (error) {
            logger.error('Failed to clear security', error);
            throw error;
        }
    },
};
