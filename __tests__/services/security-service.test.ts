import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { SecurityService } from '@/services/security-service';

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

describe('SecurityService.isLockedOut', () => {
    it('returns not locked when no lockout key', async () => {
        mockGetItem.mockResolvedValue(null);
        const result = await SecurityService.isLockedOut();
        expect(result.locked).toBe(false);
        expect(result.remainingMs).toBe(0);
    });

    it('returns locked when lockout time is in the future', async () => {
        const futureTime = Date.now() + 5 * 60 * 1000;
        mockGetItem.mockResolvedValue(futureTime.toString());

        const result = await SecurityService.isLockedOut();
        expect(result.locked).toBe(true);
        expect(result.remainingMs).toBeGreaterThan(0);
    });

    it('clears expired lockout and returns unlocked', async () => {
        const pastTime = Date.now() - 1000;
        mockGetItem.mockResolvedValue(pastTime.toString());

        const result = await SecurityService.isLockedOut();
        expect(result.locked).toBe(false);
        expect(mockDeleteItem).toHaveBeenCalledTimes(2);
    });
});

describe('SecurityService.setPin', () => {
    it('throws for non-4-digit PIN', async () => {
        await expect(SecurityService.setPin('123')).rejects.toThrow('PIN must be exactly 4 digits');
        await expect(SecurityService.setPin('12345')).rejects.toThrow('PIN must be exactly 4 digits');
        await expect(SecurityService.setPin('abcd')).rejects.toThrow('PIN must be exactly 4 digits');
    });

    it('hashes and stores a valid PIN', async () => {
        await SecurityService.setPin('1234');
        expect(mockSetItem).toHaveBeenCalledWith('user_security_pin', expect.any(String));
        const storedHash = mockSetItem.mock.calls[0][1];
        expect(storedHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('clears attempts and lockout on new PIN', async () => {
        await SecurityService.setPin('5678');
        expect(mockDeleteItem).toHaveBeenCalledWith('pin_attempts');
        expect(mockDeleteItem).toHaveBeenCalledWith('pin_lockout_until');
    });
});

describe('SecurityService.verifyPin', () => {
    it('returns true for matching PIN', async () => {
        // Set the PIN first to capture its hash
        await SecurityService.setPin('1234');
        const storedHash = mockSetItem.mock.calls[0][1];

        // Mock getItemAsync: no lockout, then return the stored hash
        mockGetItem
            .mockResolvedValueOnce(null)      // isLockedOut check
            .mockResolvedValueOnce(storedHash); // PIN retrieval

        const result = await SecurityService.verifyPin('1234');
        expect(result).toBe(true);
    });

    it('returns false for wrong PIN', async () => {
        await SecurityService.setPin('1234');
        const storedHash = mockSetItem.mock.calls[0][1];

        mockGetItem
            .mockResolvedValueOnce(null)       // isLockedOut
            .mockResolvedValueOnce(storedHash) // PIN
            .mockResolvedValueOnce(null);      // attempts

        const result = await SecurityService.verifyPin('9999');
        expect(result).toBe(false);
    });

    it('returns false immediately when locked out', async () => {
        const futureTime = Date.now() + 5 * 60 * 1000;
        mockGetItem.mockResolvedValue(futureTime.toString());

        const result = await SecurityService.verifyPin('1234');
        expect(result).toBe(false);
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
