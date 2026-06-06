import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { BackupService } from '@/services/backup-service';

// Force the Android (Storage Access Framework) code path.
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

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

jest.mock('@/lib/db/db-client', () => ({
    getRawDb: jest.fn(() => ({
        getAllAsync: jest.fn().mockResolvedValue([]),
        runAsync: jest.fn(),
        execAsync: jest.fn(),
    })),
}));

jest.mock('@/features/notifications/services/notification-service', () => ({
    NotificationService: { sendBackupComplete: jest.fn().mockResolvedValue(undefined) },
}));

const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItem = SecureStore.deleteItemAsync as jest.Mock;
const SAF = FileSystem.StorageAccessFramework as unknown as {
    requestDirectoryPermissionsAsync: jest.Mock;
    createFileAsync: jest.Mock;
};
const mockWrite = FileSystem.writeAsStringAsync as jest.Mock;

const BACKUP_DIR_KEY = 'finara_backup_dir_uri';

beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockResolvedValue(undefined);
    mockDeleteItem.mockResolvedValue(undefined);
    mockGetItem.mockResolvedValue(null);
    mockWrite.mockResolvedValue(undefined);
    SAF.createFileAsync.mockResolvedValue('content://tree/doc/file.json');
});

describe('BackupService.saveToDevice (Android SAF)', () => {
    it('writes into the stored folder when it still works', async () => {
        mockGetItem.mockResolvedValue('content://tree/Saved');

        const result = await BackupService.saveToDevice({ allowPrompt: true });

        expect(result).not.toBeNull();
        expect(SAF.createFileAsync).toHaveBeenCalledWith(
            'content://tree/Saved',
            expect.stringMatching(/^finara-backup-\d{4}-\d{2}-\d{2}\.json$/),
            'application/json',
        );
        expect(SAF.requestDirectoryPermissionsAsync).not.toHaveBeenCalled();
    });

    it('recovers from a stale stored folder by re-prompting once', async () => {
        mockGetItem.mockResolvedValue('content://tree/Stale');
        // First write (into stale folder) fails; second (fresh pick) succeeds.
        SAF.createFileAsync
            .mockRejectedValueOnce(new Error('ENOENT: stale folder'))
            .mockResolvedValueOnce('content://tree/Fresh/file.json');
        SAF.requestDirectoryPermissionsAsync.mockResolvedValue({
            granted: true,
            directoryUri: 'content://tree/Fresh',
        });

        const result = await BackupService.saveToDevice({ allowPrompt: true });

        expect(result).not.toBeNull();
        expect(mockDeleteItem).toHaveBeenCalledWith(BACKUP_DIR_KEY);      // dropped stale
        expect(SAF.requestDirectoryPermissionsAsync).toHaveBeenCalledTimes(1); // re-prompted
        expect(mockSetItem).toHaveBeenCalledWith(BACKUP_DIR_KEY, 'content://tree/Fresh');
    });

    it('surfaces the real native error when the fresh folder also fails', async () => {
        mockGetItem.mockResolvedValue('content://tree/Stale');
        SAF.createFileAsync.mockRejectedValue(new Error('EACCES: permission denied by provider'));
        SAF.requestDirectoryPermissionsAsync.mockResolvedValue({
            granted: true,
            directoryUri: 'content://tree/Fresh',
        });

        await expect(BackupService.saveToDevice({ allowPrompt: true })).rejects.toThrow(
            'EACCES: permission denied by provider',
        );
    });

    it('skips silently (returns null) for auto-backup when the stored folder fails', async () => {
        mockGetItem.mockResolvedValue('content://tree/Stale');
        SAF.createFileAsync.mockRejectedValue(new Error('stale'));

        const result = await BackupService.saveToDevice({ allowPrompt: false });

        expect(result).toBeNull();
        expect(SAF.requestDirectoryPermissionsAsync).not.toHaveBeenCalled(); // never prompts
    });

    it('skips silently when no folder is configured and prompting is not allowed', async () => {
        mockGetItem.mockResolvedValue(null);

        const result = await BackupService.saveToDevice({ allowPrompt: false });

        expect(result).toBeNull();
    });
});
