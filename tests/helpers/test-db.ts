/**
 * Real-SQLite test database for integration tests.
 *
 * Wraps an in-memory better-sqlite3 database in the subset of the expo-sqlite
 * API that the app uses (prepareSync for Drizzle, plus execAsync / runAsync /
 * getAllAsync / getFirstAsync / withTransactionAsync for raw SQL). The real
 * migrations, Drizzle queries and backup service then run unchanged.
 *
 * Usage (at the top of a test file):
 *   jest.unmock('@/lib/db/db-client');
 *   import { createTestDb } from '@/tests/helpers/test-db';
 *   let db: TestDb;
 *   beforeEach(async () => { db = await createTestDb(); });
 *   afterEach(() => db.close());
 */
import Database from 'better-sqlite3';
import type * as SQLite from 'expo-sqlite';

type Params = unknown[] | Record<string, unknown>;

function normalizeValue(v: unknown): unknown {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  return v;
}

function normalizeParams(args: unknown[]): unknown[] | Record<string, unknown> {
  // expo-sqlite accepts (sql, [a, b]), (sql, a, b) or (sql, { $a: 1 })
  if (args.length === 1 && Array.isArray(args[0])) return (args[0] as unknown[]).map(normalizeValue);
  if (args.length === 1 && args[0] !== null && typeof args[0] === 'object' && !(args[0] instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(args[0] as Record<string, unknown>)) {
      out[k.replace(/^[$:@]/, '')] = normalizeValue(v);
    }
    return out;
  }
  return args.map(normalizeValue);
}

function bind(params: Params): unknown[] {
  return Array.isArray(params) ? params : [params];
}

export interface TestDb {
  /** expo-sqlite compatible handle, pass to code under test */
  expo: SQLite.SQLiteDatabase;
  /** underlying better-sqlite3 handle for direct assertions */
  raw: Database.Database;
  close: () => void;
}

export function createExpoCompatibleDb(raw: Database.Database): SQLite.SQLiteDatabase {
  const prepare = (sql: string) => raw.prepare(sql);

  const run = (sql: string, args: unknown[]) => {
    const stmt = prepare(sql);
    const params = bind(normalizeParams(args));
    if (stmt.reader) {
      stmt.all(...params);
      return { changes: 0, lastInsertRowId: 0 };
    }
    const r = stmt.run(...params);
    return { changes: r.changes, lastInsertRowId: Number(r.lastInsertRowid) };
  };

  const adapter = {
    databasePath: ':memory:',

    // ---- Used by drizzle-orm/expo-sqlite ----
    prepareSync(sql: string) {
      const stmt = prepare(sql);
      return {
        executeSync(params: unknown[] = []) {
          const p = params.map(normalizeValue);
          if (stmt.reader) {
            const rows = stmt.all(...p) as Record<string, unknown>[];
            return {
              changes: 0,
              lastInsertRowId: 0,
              getAllSync: () => rows,
              getFirstSync: () => rows[0] ?? null,
            };
          }
          const r = stmt.run(...p);
          return {
            changes: r.changes,
            lastInsertRowId: Number(r.lastInsertRowid),
            getAllSync: () => [],
            getFirstSync: () => null,
          };
        },
        executeForRawResultSync(params: unknown[] = []) {
          const p = params.map(normalizeValue);
          if (!stmt.reader) {
            stmt.run(...p);
            return { getAllSync: () => [], getFirstSync: () => null };
          }
          const rows = stmt.raw(true).all(...p) as unknown[][];
          stmt.raw(false);
          return { getAllSync: () => rows, getFirstSync: () => rows[0] ?? null };
        },
        finalizeSync() {},
      };
    },

    // ---- Raw async API used by migrations / services ----
    async execAsync(sql: string) {
      raw.exec(sql);
    },
    execSync(sql: string) {
      raw.exec(sql);
    },
    async runAsync(sql: string, ...args: unknown[]) {
      return run(sql, args);
    },
    runSync(sql: string, ...args: unknown[]) {
      return run(sql, args);
    },
    async getAllAsync(sql: string, ...args: unknown[]) {
      return prepare(sql).all(...bind(normalizeParams(args)));
    },
    getAllSync(sql: string, ...args: unknown[]) {
      return prepare(sql).all(...bind(normalizeParams(args)));
    },
    async getFirstAsync(sql: string, ...args: unknown[]) {
      return prepare(sql).get(...bind(normalizeParams(args))) ?? null;
    },
    getFirstSync(sql: string, ...args: unknown[]) {
      return prepare(sql).get(...bind(normalizeParams(args))) ?? null;
    },
    async withTransactionAsync(fn: () => Promise<void>) {
      raw.exec('BEGIN');
      try {
        await fn();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
    async withExclusiveTransactionAsync(fn: (txn: unknown) => Promise<void>) {
      return adapter.withTransactionAsync(() => fn(adapter));
    },
    withTransactionSync(fn: () => void) {
      raw.transaction(fn)();
    },
    async closeAsync() {
      if (raw.open) raw.close();
    },
    closeSync() {
      if (raw.open) raw.close();
    },
  };

  return adapter as unknown as SQLite.SQLiteDatabase;
}

/**
 * Create a fresh in-memory DB, run the real migrations + seed, and register it
 * as the app's DB instance (requires `jest.unmock('@/lib/db/db-client')`).
 */
export async function createTestDb(options: { register?: boolean } = {}): Promise<TestDb> {
  const raw = new Database(':memory:');
  // better-sqlite3 is compiled with foreign keys ON by default; expo-sqlite's
  // bundled SQLite defaults to OFF. Match the device so tests catch FK bugs.
  raw.pragma('foreign_keys = OFF');
  const expo = createExpoCompatibleDb(raw);

  const { initializeDatabase } = require('@/lib/db/migrations');
  await initializeDatabase(expo);

  if (options.register !== false) {
    const { setDbInstance } = require('@/lib/db/db-client');
    setDbInstance(expo);
  }

  return {
    expo,
    raw,
    close: () => {
      if (raw.open) raw.close();
    },
  };
}
