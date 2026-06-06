import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { getRawDb } from '@/lib/db/db-client';
import { logger } from '@/lib/logger';
import { NotificationService } from '@/features/notifications/services/notification-service';
import { Platform } from 'react-native';

const AUTO_BACKUP_KEY = 'finara_auto_backup_enabled';
const LAST_BACKUP_KEY = 'finara_last_backup_time'; // last SUCCESSFUL backup (manual or auto)
const LAST_AUTO_ATTEMPT_KEY = 'finara_last_auto_attempt'; // last auto-backup attempt (success or fail) — prevents retry loops
const BACKUP_DIR_KEY = 'finara_backup_dir_uri';
const BACKUP_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
const BACKUP_VERSION = 1;

export interface BackupData {
  version: number;
  exportedAt: string;
  data: {
    accounts: Record<string, unknown>[];
    categories: Record<string, unknown>[];
    transactions: Record<string, unknown>[];
    recurringExpenses: Record<string, unknown>[];
    budgets: Record<string, unknown>[];
    savingsGoals: Record<string, unknown>[];
  };
}

export const BackupService = {
  async getAutoBackupEnabled(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(AUTO_BACKUP_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setAutoBackupEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(AUTO_BACKUP_KEY, enabled ? 'true' : 'false');
  },

  async getLastBackupTime(): Promise<Date | null> {
    try {
      const val = await SecureStore.getItemAsync(LAST_BACKUP_KEY);
      if (val) return new Date(val);
    } catch {
      // ignore
    }
    return null;
  },

  async setLastBackupTime(date: Date): Promise<void> {
    await SecureStore.setItemAsync(LAST_BACKUP_KEY, date.toISOString());
  },

  async getBackupDirUri(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(BACKUP_DIR_KEY);
    } catch {
      return null;
    }
  },

  async getLastAutoAttemptTime(): Promise<Date | null> {
    try {
      const val = await SecureStore.getItemAsync(LAST_AUTO_ATTEMPT_KEY);
      if (val) return new Date(val);
    } catch {
      // ignore
    }
    return null;
  },

  async setLastAutoAttemptTime(date: Date): Promise<void> {
    try {
      await SecureStore.setItemAsync(LAST_AUTO_ATTEMPT_KEY, date.toISOString());
    } catch {
      // ignore — best-effort backoff marker
    }
  },

  async shouldTriggerAutoBackup(): Promise<boolean> {
    const enabled = await BackupService.getAutoBackupEnabled();
    if (!enabled) return false;

    // Auto-backup must be SILENT. If no folder has been chosen yet (via a manual
    // "Download Backup"), we skip rather than popping the system folder picker.
    if (Platform.OS === 'android') {
      const dirUri = await BackupService.getBackupDirUri();
      if (!dirUri) return false;
    }

    const now = Date.now();

    // Back off from the last successful backup (manual or auto)…
    const last = await BackupService.getLastBackupTime();
    if (last && now - last.getTime() < BACKUP_INTERVAL_MS) return false;

    // …and from the last auto attempt, so a failing backup can't retry on every
    // app resume (this is what previously caused the repeating folder prompt).
    const lastAttempt = await BackupService.getLastAutoAttemptTime();
    if (lastAttempt && now - lastAttempt.getTime() < BACKUP_INTERVAL_MS) return false;

    return true;
  },

  async exportAllData(): Promise<BackupData> {
    const db = getRawDb();

    const accounts = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM accounts');
    const categories = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM categories');
    const transactions = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM transactions');
    const recurringExpenses = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM recurring_expenses');
    const budgets = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM budgets');
    const savingsGoals = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM savings_goals');

    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: { accounts, categories, transactions, recurringExpenses, budgets, savingsGoals },
    };
  },

  /**
   * Writes a backup file to the device.
   *
   * @param options.allowPrompt When `true` (manual backups) and no folder has
   *   been chosen yet on Android, the system folder picker is shown. When
   *   `false` (auto-backup) the picker is NEVER shown — if no folder is
   *   configured the call returns `null` and the backup is silently skipped.
   *
   * @returns The saved file info, or `null` if the backup was skipped because
   *   no folder is configured and prompting was not allowed.
   */
  async saveToDevice(
    options: { allowPrompt?: boolean } = {},
  ): Promise<{ fileName: string; location: string } | null> {
    const { allowPrompt = true } = options;

    if (Platform.OS === 'android') {
      const backup = await BackupService.exportAllData();
      const json = JSON.stringify(backup, null, 2);
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `finara-backup-${date}.json`;

      // Writes the JSON into the SAF folder at `dirUri`. SAF persists folder
      // permissions across app restarts, but they can still be lost (folder
      // deleted, SD card removed, OS reclaimed the grant) — in which case
      // createFileAsync/writeAsStringAsync throws. We surface the real native
      // message so failures are diagnosable instead of a generic catch-all.
      const writeInto = async (dirUri: string): Promise<void> => {
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          dirUri,
          fileName,
          'application/json',
        );
        await FileSystem.writeAsStringAsync(fileUri, json, { encoding: 'utf8' as const });
      };

      // Force a fresh folder pick, persist it, and write. Used both for the
      // first-ever backup and to recover when a stored folder has gone stale.
      const promptThenWrite = async (): Promise<void> => {
        const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!result.granted) {
          throw new Error('Storage permission denied. Please grant folder access to save backups.');
        }
        await SecureStore.setItemAsync(BACKUP_DIR_KEY, result.directoryUri);
        await writeInto(result.directoryUri);
      };

      const storedDir = await BackupService.getBackupDirUri();

      if (!storedDir) {
        // No folder chosen yet. Auto-backup must stay silent — bail out.
        if (!allowPrompt) return null;
        await promptThenWrite();
      } else {
        try {
          await writeInto(storedDir);
        } catch (error) {
          // The stored folder no longer works. Drop it so we don't keep retrying
          // a dead URI. For a manual backup, immediately re-prompt and try once
          // more; for silent auto-backup, just skip until the user re-picks.
          await SecureStore.deleteItemAsync(BACKUP_DIR_KEY);
          logger.error('Backup write to stored folder failed', error);
          if (!allowPrompt) return null;
          await promptThenWrite();
        }
      }

      await BackupService.setLastBackupTime(new Date());
      return { fileName, location: 'your selected folder' };

    } else {
      // iOS: saves to the app Documents folder, visible in Files app → Finara
      const backup = await BackupService.exportAllData();
      const json = JSON.stringify(backup, null, 2);
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `finara-backup-${date}.json`;

      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, json, { encoding: 'utf8' as const });
      await BackupService.setLastBackupTime(new Date());
      return { fileName, location: 'Files app → Finara' };
    }
  },

  async pickAndRestoreBackup(): Promise<{ restored: number; message: string }> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      throw new Error('No file selected');
    }

    const fileUri = result.assets[0].uri;
    const raw = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'utf8' as const,
    });

    let backup: BackupData;
    try {
      backup = JSON.parse(raw);
    } catch {
      throw new Error('Invalid backup file — could not parse JSON');
    }

    if (!backup.version || !backup.data) {
      throw new Error('Invalid backup format — missing required fields');
    }

    return BackupService.restoreData(backup);
  },

  async restoreData(backup: BackupData): Promise<{ restored: number; message: string }> {
    const db = getRawDb();
    const { accounts, categories, transactions, recurringExpenses, budgets, savingsGoals } = backup.data;

    await db.execAsync('PRAGMA foreign_keys = OFF;');

    try {
      // Clear existing data in dependency order
      await db.execAsync(`
        DELETE FROM transactions;
        DELETE FROM recurring_expenses;
        DELETE FROM budgets;
        DELETE FROM savings_goals;
        DELETE FROM accounts;
        DELETE FROM categories;
      `);

      type BindVal = string | number | null;
      const b = (v: unknown): BindVal => (v === undefined || v === null ? null : v as BindVal);

      // Restore categories first (no FK dependencies)
      for (const row of categories) {
        await db.runAsync(
          `INSERT OR IGNORE INTO categories (id, name, type, payment_method, icon, color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [b(row.id), b(row.name), b(row.type), b(row.payment_method), b(row.icon),
           b(row.color), b(row.created_at), b(row.updated_at)]
        );
      }

      // Restore accounts (no FK dependencies)
      for (const row of accounts) {
        await db.runAsync(
          `INSERT OR IGNORE INTO accounts (id, name, type, balance, currency, icon, color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b(row.id), b(row.name), b(row.type), b(row.balance), b(row.currency),
           b(row.icon), b(row.color), b(row.created_at), b(row.updated_at)]
        );
      }

      // Restore recurring_expenses (depends on categories + accounts)
      for (const row of recurringExpenses) {
        await db.runAsync(
          `INSERT OR IGNORE INTO recurring_expenses
           (id, category_id, account_id, amount, frequency, start_date, end_date, notes, is_active, last_processed, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b(row.id), b(row.category_id), b(row.account_id), b(row.amount), b(row.frequency),
           b(row.start_date), b(row.end_date), b(row.notes), b(row.is_active ?? 1),
           b(row.last_processed), b(row.created_at), b(row.updated_at)]
        );
      }

      // Restore budgets (depends on categories)
      for (const row of budgets) {
        await db.runAsync(
          `INSERT OR IGNORE INTO budgets
           (id, category_id, amount, period, start_date, end_date, notes, is_active, alert_threshold, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b(row.id), b(row.category_id), b(row.amount), b(row.period),
           b(row.start_date), b(row.end_date), b(row.notes),
           b(row.is_active ?? 1), b(row.alert_threshold ?? 80), b(row.created_at), b(row.updated_at)]
        );
      }

      // Restore transactions (depends on categories + accounts + recurring_expenses)
      for (const row of transactions) {
        await db.runAsync(
          `INSERT OR IGNORE INTO transactions
           (id, category_id, account_id, amount, type, date, notes, receipt, recurring_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b(row.id), b(row.category_id), b(row.account_id), b(row.amount), b(row.type),
           b(row.date), b(row.notes), b(row.receipt), b(row.recurring_id),
           b(row.created_at), b(row.updated_at)]
        );
      }

      // Restore savings_goals (no FK dependencies)
      for (const row of savingsGoals) {
        await db.runAsync(
          `INSERT OR IGNORE INTO savings_goals
           (id, name, target_amount, saved_amount, icon, color, deadline, is_completed, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b(row.id), b(row.name), b(row.target_amount), b(row.saved_amount ?? 0),
           b(row.icon), b(row.color), b(row.deadline),
           b(row.is_completed ?? 0), b(row.created_at), b(row.updated_at)]
        );
      }

      const total =
        categories.length + accounts.length + transactions.length +
        recurringExpenses.length + budgets.length + savingsGoals.length;

      logger.info(`Restore complete: ${total} records restored`);
      return {
        restored: total,
        message: `Restored ${transactions.length} transactions, ${accounts.length} accounts, ${categories.length} categories, and more.`,
      };
    } catch (error) {
      logger.error('Restore failed', error);
      throw error;
    } finally {
      await db.execAsync('PRAGMA foreign_keys = ON;');
    }
  },

  async runAutoBackupIfNeeded(): Promise<boolean> {
    if (!(await BackupService.shouldTriggerAutoBackup())) return false;

    // Record the attempt FIRST. Even if the save below fails — or the app is
    // killed mid-write — the 12h backoff is already in place, so we never fall
    // into a retry loop that repeatedly interrupts the user on app resume.
    await BackupService.setLastAutoAttemptTime(new Date());

    try {
      // allowPrompt: false — an automatic backup must never open the folder picker.
      const result = await BackupService.saveToDevice({ allowPrompt: false });
      if (result) {
        // Let the user know a scheduled backup just ran (no-op if notifications
        // are disabled — NotificationService guards on its own preference).
        await NotificationService.sendBackupComplete(result.fileName);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Auto-backup failed', error);
      return false;
    }
  },
};
