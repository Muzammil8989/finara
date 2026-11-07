import * as SecureStore from 'expo-secure-store';
import { BackupService } from '@/features/backup/services/backup-service';
import { NotificationService } from '@/features/notifications/services/notification-service';

// Force the iOS code path (writes to the app Documents dir, no folder picker).
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

jest.mock('expo-file-system/legacy', () => ({
    documentDirectory: 'file:///docs/',
    writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
    readAsStringAsync: jest.fn(),
    StorageAccessFramework: {
        requestDirectoryPermissionsAsync: jest.fn(),
        createFileAsync: jest.fn(),
    },
}));

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

// Raw SQLite handle used by exportAllData — every table read returns [].
jest.mock('@/lib/db/db-client', () => ({
    getRawDb: jest.fn(() => ({
        getAllAsync: jest.fn().mockResolvedValue([]),
        runAsync: jest.fn(),
        execAsync: jest.fn(),
    })),
}));

// Isolate from NotificationService internals — we only assert it is invoked.
jest.mock('@/features/notifications/services/notification-service', () => ({
    NotificationService: { sendBackupComplete: jest.fn().mockResolvedValue(undefined) },
}));

const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockSendBackupComplete = NotificationService.sendBackupComplete as jest.Mock;

const AUTO_BACKUP_KEY = 'folio_auto_backup_enabled';
const LAST_BACKUP_KEY = 'folio_last_backup_time';
const LAST_AUTO_ATTEMPT_KEY = 'folio_last_auto_attempt';

/** Build a SecureStore.getItemAsync mock from a key→value map. */
function secureStore(values: Record<string, string | null>) {
    mockGetItem.mockImplementation(async (key: string) => values[key] ?? null);
}

beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockResolvedValue(undefined);
});

describe('BackupService.runAutoBackupIfNeeded', () => {
    it('backs up and fires a notification when enabled and 12h have elapsed', async () => {
        // enabled, never backed up, never attempted → should run
        secureStore({ [AUTO_BACKUP_KEY]: 'true' });

        const result = await BackupService.runAutoBackupIfNeeded();

        expect(result).toBe(true);
        expect(mockSendBackupComplete).toHaveBeenCalledTimes(1);
        expect(mockSendBackupComplete).toHaveBeenCalledWith(
            expect.stringMatching(/^folio-backup-\d{4}-\d{2}-\d{2}\.json$/),
        );
        // The successful backup time must be persisted.
        expect(mockSetItem).toHaveBeenCalledWith(LAST_BACKUP_KEY, expect.any(String));
    });

    it('does nothing when auto-backup is disabled', async () => {
        secureStore({ [AUTO_BACKUP_KEY]: 'false' });

        const result = await BackupService.runAutoBackupIfNeeded();

        expect(result).toBe(false);
        expect(mockSendBackupComplete).not.toHaveBeenCalled();
    });

    it('skips (no notification) when the last backup was under 12h ago', async () => {
        secureStore({
            [AUTO_BACKUP_KEY]: 'true',
            [LAST_BACKUP_KEY]: new Date().toISOString(), // just now → inside backoff
        });

        const result = await BackupService.runAutoBackupIfNeeded();

        expect(result).toBe(false);
        expect(mockSendBackupComplete).not.toHaveBeenCalled();
    });

    it('records the attempt time before saving so a failure cannot retry-loop', async () => {
        secureStore({ [AUTO_BACKUP_KEY]: 'true' });

        await BackupService.runAutoBackupIfNeeded();

        expect(mockSetItem).toHaveBeenCalledWith(LAST_AUTO_ATTEMPT_KEY, expect.any(String));
    });
});
