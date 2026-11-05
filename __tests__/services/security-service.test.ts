import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { encodePin, LOCKOUT_STEPS_MS, pinMatches, SecurityService } from '@/features/auth/services/security-service';
import { installInMemorySecureStore } from '@/tests/helpers/secure-store';

// Polyfill Web Crypto API for Node.js test environment
const nodeCrypto = require('crypto');
Object.defineProperty(globalThis, 'crypto', {
    value: {
        subtle: {
            digest: async (_algo: string, data: ArrayBuffer) => {
                const buf = Buffer.from(data);
                const hash = nodeCrypto.createHash('sha256').update(buf).digest();
                const result = new ArrayBuffer(hash.length);
                new Uint8Array(result).set(hash);
                return result;
            },
        },
    },
    writable: true,
});

const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItem = SecureStore.deleteItemAsync as jest.Mock;
const mockHasHardware = LocalAuthentication.hasHardwareAsync as jest.Mock;
const mockIsEnrolled = LocalAuthentication.isEnrolledAsync as jest.Mock;
const mockSupportedTypes = LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockResolvedValue(undefined);
    mockDeleteItem.mockResolvedValue(undefined);
    mockGetItem.mockResolvedValue(null);
});

describe('SecurityService.getBiometricStatus', () => {
    it('returns available=true when hardware and enrollment are present', async () => {
        mockHasHardware.mockResolvedValue(true);
        mockIsEnrolled.mockResolvedValue(true);
        mockSupportedTypes.mockResolvedValue([1, 2]);

        const status = await SecurityService.getBiometricStatus();
        expect(status.available).toBe(true);
        expect(status.types).toEqual(['Fingerprint', 'FaceID']);
    });

    it('returns available=false when no hardware', async () => {
        mockHasHardware.mockResolvedValue(false);
        mockIsEnrolled.mockResolvedValue(true);
        mockSupportedTypes.mockResolvedValue([]);

        const status = await SecurityService.getBiometricStatus();
        expect(status.available).toBe(false);
    });

    it('returns available=false when not enrolled', async () => {
        mockHasHardware.mockResolvedValue(true);
        mockIsEnrolled.mockResolvedValue(false);
        mockSupportedTypes.mockResolvedValue([1]);

        const status = await SecurityService.getBiometricStatus();
        expect(status.available).toBe(false);
    });

    it('maps type 3 to Iris', async () => {
        mockHasHardware.mockResolvedValue(true);
        mockIsEnrolled.mockResolvedValue(true);
        mockSupportedTypes.mockResolvedValue([3]);

        const status = await SecurityService.getBiometricStatus();
        expect(status.types).toEqual(['Iris']);
    });

    it('returns fallback on error', async () => {
        mockHasHardware.mockRejectedValue(new Error('Hardware error'));

        const status = await SecurityService.getBiometricStatus();
        expect(status.available).toBe(false);
        expect(status.types).toEqual([]);
    });
});

describe('PIN storage and verification', () => {
    let store: Map<string, string>;
    beforeEach(() => { store = installInMemorySecureStore(); });

    it('rejects anything but exactly 4 digits', async () => {
        await expect(SecurityService.setPin('123')).rejects.toThrow('PIN must be exactly 4 digits');
        await expect(SecurityService.setPin('12345')).rejects.toThrow('PIN must be exactly 4 digits');
        await expect(SecurityService.setPin('abcd')).rejects.toThrow('PIN must be exactly 4 digits');
    });

    it('stores a salted, stretched hash — never the PIN — unique per install', async () => {
        await SecurityService.setPin('1234');
        const first = store.get('user_security_pin')!;
        expect(first).toMatch(/^v2\$[0-9a-f]+\$10000\$[0-9a-f]{64}$/);
        expect(first).not.toContain('1234');
        await SecurityService.setPin('1234');
        expect(store.get('user_security_pin')).not.toBe(first); // fresh salt each time
    });

    it('accepts the right PIN and rejects a wrong one', async () => {
        await SecurityService.setPin('1234');
        expect(await SecurityService.verifyPin('9999')).toBe(false);
        expect(await SecurityService.verifyPin('1234')).toBe(true);
    });

    it('accepts a PIN saved with the old scheme and upgrades it', async () => {
        const sha256 = require('js-sha256').sha256 as (s: string) => string;
        store.set('user_security_pin', sha256('4321finara_salt_v1'));
        expect(await SecurityService.verifyPin('4321')).toBe(true);
        expect(store.get('user_security_pin')).toMatch(/^v2\$/);
        expect(await SecurityService.verifyPin('4321')).toBe(true);
    });

    it('pinMatches handles empty and unknown values', () => {
        expect(pinMatches('1234', null)).toEqual({ ok: false, legacy: false });
        expect(pinMatches('1234', encodePin('1234', 'abc', 3)).ok).toBe(true);
        expect(pinMatches('1235', encodePin('1234', 'abc', 3)).ok).toBe(false);
    });
});

describe('PIN lockout', () => {
    let store: Map<string, string>;
    let now = 1_000_000_000_000;
    beforeEach(async () => {
        store = installInMemorySecureStore();
        jest.spyOn(Date, 'now').mockImplementation(() => now);
        await SecurityService.setPin('1234');
    });
    afterEach(() => jest.restoreAllMocks());

    const failFive = async () => { for (let i = 0; i < 5; i++) await SecurityService.verifyPin('0000'); };

    it('locks after 5 wrong tries, and even the right PIN is refused while locked', async () => {
        await failFive();
        expect((await SecurityService.isLockedOut()).locked).toBe(true);
        expect(await SecurityService.verifyPin('1234')).toBe(false);
    });

    it('each lockout in a row lasts longer', async () => {
        await failFive();
        expect((await SecurityService.isLockedOut()).remainingMs).toBe(LOCKOUT_STEPS_MS[0]);
        now += LOCKOUT_STEPS_MS[0] + 1;
        expect((await SecurityService.isLockedOut()).locked).toBe(false);
        await failFive();
        expect((await SecurityService.isLockedOut()).remainingMs).toBe(LOCKOUT_STEPS_MS[1]);
    });

    it('moving the clock back does not shorten a lockout', async () => {
        await failFive();
        now -= 24 * 60 * 60 * 1000;
        const state = await SecurityService.isLockedOut();
        expect(state.locked).toBe(true);
        expect(state.remainingMs).toBe(LOCKOUT_STEPS_MS[0]);
    });

    it('after a lockout ends, a single wrong PIN starts the next one', async () => {
        await failFive();
        now += LOCKOUT_STEPS_MS[0] + 1;
        expect((await SecurityService.isLockedOut()).locked).toBe(false);
        await SecurityService.verifyPin('0000');
        const state = await SecurityService.isLockedOut();
        expect(state.locked).toBe(true);
        expect(state.remainingMs).toBe(LOCKOUT_STEPS_MS[1]);
    });

    it('moving the clock forward gives one guess, not a fresh round of five', async () => {
        await failFive();
        now += 365 * 24 * 60 * 60 * 1000;
        expect(await SecurityService.verifyPin('0000')).toBe(false);
        expect((await SecurityService.isLockedOut()).locked).toBe(true);
    });

    it('a correct PIN after a lockout resets the escalation', async () => {
        await failFive();
        now += LOCKOUT_STEPS_MS[0] + 1;
        expect(await SecurityService.verifyPin('1234')).toBe(true);
        await failFive();
        expect((await SecurityService.isLockedOut()).remainingMs).toBe(LOCKOUT_STEPS_MS[0]);
    });

    it('clearSecurity removes every PIN and lockout key', async () => {
        await failFive();
        await SecurityService.clearSecurity();
        expect([...store.keys()]).toEqual([]);
    });
});


describe('SecurityService.isSecurityConfigured', () => {
    it('returns true when PIN is set', async () => {
        mockGetItem.mockResolvedValue('somehash');
        expect(await SecurityService.isSecurityConfigured()).toBe(true);
    });

    it('returns false when no PIN stored', async () => {
        mockGetItem.mockResolvedValue(null);
        expect(await SecurityService.isSecurityConfigured()).toBe(false);
    });
});

describe('SecurityService.clearSecurity', () => {
    it('deletes all security keys', async () => {
        await SecurityService.clearSecurity();
        expect(mockDeleteItem).toHaveBeenCalledWith('user_security_pin');
        expect(mockDeleteItem).toHaveBeenCalledWith('biometric_enabled');
        expect(mockDeleteItem).toHaveBeenCalledWith('pin_attempts');
        expect(mockDeleteItem).toHaveBeenCalledWith('pin_lockout_until');
    });

    it('re-throws on error', async () => {
        mockDeleteItem.mockRejectedValue(new Error('SecureStore failure'));
        await expect(SecurityService.clearSecurity()).rejects.toThrow('SecureStore failure');
    });
});

describe('SecurityService.setBiometricPreference / getBiometricPreference', () => {
    it('stores true preference', async () => {
        await SecurityService.setBiometricPreference(true);
        expect(mockSetItem).toHaveBeenCalledWith('biometric_enabled', 'true');
    });

    it('stores false preference', async () => {
        await SecurityService.setBiometricPreference(false);
        expect(mockSetItem).toHaveBeenCalledWith('biometric_enabled', 'false');
    });

    it('returns true when preference is "true"', async () => {
        mockGetItem.mockResolvedValue('true');
        expect(await SecurityService.getBiometricPreference()).toBe(true);
    });

    it('returns false when preference is "false"', async () => {
        mockGetItem.mockResolvedValue('false');
        expect(await SecurityService.getBiometricPreference()).toBe(false);
    });

    it('returns false when no preference set', async () => {
        mockGetItem.mockResolvedValue(null);
        expect(await SecurityService.getBiometricPreference()).toBe(false);
    });
});
