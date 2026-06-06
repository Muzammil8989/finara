import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { logger } from '../lib/logger';

async function hashPin(pin: string): Promise<string> {
  // Use expo-crypto if available, otherwise use a simple hash
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'finara_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const PIN_KEY = 'user_security_pin';
const BIO_ENABLED_KEY = 'biometric_enabled';
const PIN_ATTEMPTS_KEY = 'pin_attempts';
const PIN_LOCKOUT_KEY = 'pin_lockout_until';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const SecurityService = {
    /**
     * Check if biometrics are available on the device
     */
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
                })
            };
        } catch (error) {
            logger.error('Failed to get biometric status', error);
            return { available: false, types: [] };
        }
    },

    /**
     * Authenticate using biometrics
     */
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

    /**
     * Check if user is currently locked out from PIN attempts
     */
    async isLockedOut(): Promise<{ locked: boolean; remainingMs: number }> {
        try {
            const lockoutUntil = await SecureStore.getItemAsync(PIN_LOCKOUT_KEY);
            if (lockoutUntil) {
                const lockoutTime = parseInt(lockoutUntil, 10);
                const remaining = lockoutTime - Date.now();
                if (remaining > 0) {
                    return { locked: true, remainingMs: remaining };
                }
                // Lockout expired, clear it
                await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY);
                await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
            }
        } catch (error) {
            logger.error('Failed to check lockout status', error);
        }
        return { locked: false, remainingMs: 0 };
    },

    /**
     * Set a 4-digit PIN
     */
    async setPin(pin: string) {
        if (!/^\d{4}$/.test(pin)) {
            throw new Error('PIN must be exactly 4 digits');
        }
        const hashedPin = await hashPin(pin);
        await SecureStore.setItemAsync(PIN_KEY, hashedPin);
        // Reset attempts on new PIN
        await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
        await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY);
    },

    /**
     * Verify a PIN with rate limiting
     */
    async verifyPin(input: string): Promise<boolean> {
        // Check lockout first
        const lockout = await this.isLockedOut();
        if (lockout.locked) {
            const minutes = Math.ceil(lockout.remainingMs / 60000);
            logger.warn(`PIN locked out for ${minutes} more minutes`);
            return false;
        }

        try {
            const savedPin = await SecureStore.getItemAsync(PIN_KEY);
            const hashedInput = await hashPin(input);
            if (savedPin === hashedInput) {
                // Success - reset attempts
                await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
                return true;
            }

            // Failed attempt - track it
            const attemptsStr = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY);
            const attempts = attemptsStr ? parseInt(attemptsStr, 10) + 1 : 1;
            await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, attempts.toString());

            if (attempts >= MAX_PIN_ATTEMPTS) {
                const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
                await SecureStore.setItemAsync(PIN_LOCKOUT_KEY, lockoutUntil.toString());
                logger.warn('PIN locked out due to too many failed attempts');
            }

            return false;
        } catch (error) {
            logger.error('PIN verification error', error);
            return false;
        }
    },

    /**
     * Check if security is configured
     */
    async isSecurityConfigured(): Promise<boolean> {
        try {
            const pin = await SecureStore.getItemAsync(PIN_KEY);
            return !!pin;
        } catch (error) {
            logger.error('Failed to check security config', error);
            return false;
        }
    },

    /**
     * Toggle biometric preference
     */
    async setBiometricPreference(enabled: boolean) {
        await SecureStore.setItemAsync(BIO_ENABLED_KEY, enabled ? 'true' : 'false');
    },

    async getBiometricPreference(): Promise<boolean> {
        try {
            const pref = await SecureStore.getItemAsync(BIO_ENABLED_KEY);
            return pref === 'true';
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
    }
};
