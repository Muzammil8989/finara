import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { logger } from '@/lib/logger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sha256 = require('js-sha256').sha256 as (input: string) => string;

/** Original scheme: one SHA-256 with a salt shared by every install. Read-only, for upgrading. */
function legacyHash(pin: string): string {
    return sha256(pin + 'finara_salt_v1');
}

const HASH_ROUNDS = 10_000;

/** Iterated, per-install-salted hash: makes offline guessing of a 4-digit PIN slow. */
function stretch(pin: string, salt: string, rounds: number): string {
    let h = sha256(`${salt}:${pin}`);
    for (let i = 1; i < rounds; i++) h = sha256(h + salt);
    return h;
}

function newSalt(): string {
    // The salt only has to be unique, not secret.
    let s = '';
    for (let i = 0; i < 4; i++) s += Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
    return s + Date.now().toString(16);
}

/** Stored as "v2$salt$rounds$hash". */
export function encodePin(pin: string, salt = newSalt(), rounds = HASH_ROUNDS): string {
    return `v2$${salt}$${rounds}$${stretch(pin, salt, rounds)}`;
}

/** Check a PIN against either stored format. */
export function pinMatches(pin: string, stored: string | null): { ok: boolean; legacy: boolean } {
    if (!stored) return { ok: false, legacy: false };
    if (stored.startsWith('v2$')) {
        const [, salt, rounds, hash] = stored.split('$');
        return { ok: stretch(pin, salt, Number(rounds)) === hash, legacy: false };
    }
    return { ok: legacyHash(pin) === stored, legacy: true };
}

const PIN_KEY = 'user_security_pin';
const BIO_ENABLED_KEY = 'biometric_enabled';
const PIN_ATTEMPTS_KEY = 'pin_attempts';
const PIN_LOCKOUT_KEY = 'pin_lockout_until';
const PIN_LOCKOUT_SET_KEY = 'pin_lockout_set_at';
const PIN_LOCKOUT_LEVEL_KEY = 'pin_lockout_level';

const MAX_PIN_ATTEMPTS = 5;
/** Each lockout in a row is longer: 1 min, 5 min, 15 min, 1 h, 4 h, then 24 h. */
export const LOCKOUT_STEPS_MS = [1, 5, 15, 60, 240, 1440].map(m => m * 60 * 1000);

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
                promptMessage: 'Authenticate to access Folio',
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
                const until = parseInt(lockoutUntil, 10);
                const setAt = parseInt((await SecureStore.getItemAsync(PIN_LOCKOUT_SET_KEY)) ?? '0', 10);
                const now = Date.now();
                // Clock moved back to before the lockout started: don't let that
                // shorten it — count the full lockout from now.
                if (setAt && now < setAt) return { locked: true, remainingMs: until - setAt };
                const remaining = until - now;
                if (remaining > 0) return { locked: true, remainingMs: remaining };
                // Lockout over: allow ONE more try, not a fresh round. Otherwise
                // moving the clock forward would hand out 5 guesses per jump.
                // The lockout *level* is kept, so the next lockout is longer.
                // Only a correct PIN (resetAttempts) clears the counter.
                await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY);
                await SecureStore.deleteItemAsync(PIN_LOCKOUT_SET_KEY);
                await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, String(MAX_PIN_ATTEMPTS - 1));
            }
        } catch (error) {
            logger.error('Failed to check lockout status', error);
        }
        return { locked: false, remainingMs: 0 };
    },

    async setPin(pin: string) {
        if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits');
        await SecureStore.setItemAsync(PIN_KEY, encodePin(pin));
        await this.resetAttempts();
    },

    async resetAttempts() {
        await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
        await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY);
        await SecureStore.deleteItemAsync(PIN_LOCKOUT_SET_KEY);
        await SecureStore.deleteItemAsync(PIN_LOCKOUT_LEVEL_KEY);
    },

    async verifyPin(input: string): Promise<boolean> {
        const lockout = await this.isLockedOut();
        if (lockout.locked) {
            logger.warn(`PIN locked out for ${Math.ceil(lockout.remainingMs / 60000)} more minutes`);
            return false;
        }
        try {
            const savedPin = await SecureStore.getItemAsync(PIN_KEY);
            const match = pinMatches(input, savedPin);
            if (match.ok) {
                // Upgrade a PIN stored with the old shared-salt hash.
                if (match.legacy) await SecureStore.setItemAsync(PIN_KEY, encodePin(input));
                await this.resetAttempts();
                return true;
            }
            const attemptsStr = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY);
            const attempts = attemptsStr ? parseInt(attemptsStr, 10) + 1 : 1;
            await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, attempts.toString());
            if (attempts >= MAX_PIN_ATTEMPTS) {
                const level = parseInt((await SecureStore.getItemAsync(PIN_LOCKOUT_LEVEL_KEY)) ?? '0', 10);
                const duration = LOCKOUT_STEPS_MS[Math.min(level, LOCKOUT_STEPS_MS.length - 1)];
                const now = Date.now();
                await SecureStore.setItemAsync(PIN_LOCKOUT_KEY, (now + duration).toString());
                await SecureStore.setItemAsync(PIN_LOCKOUT_SET_KEY, now.toString());
                await SecureStore.setItemAsync(PIN_LOCKOUT_LEVEL_KEY, String(level + 1));
                logger.warn(`PIN locked out for ${duration / 60000} min after too many failed attempts`);
            }
            return false;
        } catch (error) {
            logger.error('PIN verification error', error);
            return false;
        }
    },

    async isSecurityConfigured(): Promise<boolean> {
        try {
            // Read both at once: this is on the cold-start path.
            const [pin, bioPref] = await Promise.all([
                SecureStore.getItemAsync(PIN_KEY),
                SecureStore.getItemAsync(BIO_ENABLED_KEY),
            ]);
            // biometric-only counts as configured even without a PIN
            return !!pin || bioPref === 'true';
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
            await SecureStore.deleteItemAsync(PIN_LOCKOUT_SET_KEY);
            await SecureStore.deleteItemAsync(PIN_LOCKOUT_LEVEL_KEY);
        } catch (error) {
            logger.error('Failed to clear security', error);
            throw error;
        }
    },
};
