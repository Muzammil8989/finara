import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import { logger } from '../logger';
import * as schema from './schema';

/**
 * DATABASE CLIENT
 * Singleton Drizzle ORM client for type-safe database operations
 * Handles database connection and initialization
 */

let dbInstance: ExpoSQLiteDatabase<typeof schema> | null = null;
let sqliteDb: SQLite.SQLiteDatabase | null = null;

export function setDbInstance(db: SQLite.SQLiteDatabase) {
  sqliteDb = db;
  dbInstance = drizzle(db, { schema });
  logger.info('Drizzle instance explicitly set from provider');
}

/**
 * Get the Drizzle ORM database instance
 * Must be called after setDbInstance()
 */
export function getDb(): ExpoSQLiteDatabase<typeof schema> {
  if (!dbInstance) {
    throw new Error(
      'Database not initialized. Ensure SQLiteProvider has loaded before accessing the database.'
    );
  }
  return dbInstance;
}

/**
 * Get the raw SQLite database instance
 * Useful for raw SQL queries
 */
export function getRawDb(): SQLite.SQLiteDatabase {
  if (!sqliteDb) {
    throw new Error(
      'Database not initialized. Ensure SQLiteProvider has loaded before accessing the database.'
    );
  }
  return sqliteDb;
}

/**
 * Check if database has been initialized
 */
export function isDbReady(): boolean {
  return dbInstance !== null && sqliteDb !== null;
}

/**
 * Close database connection
 * Call this during app shutdown
 */
export async function closeDb(): Promise<void> {
  if (sqliteDb) {
    try {
      await sqliteDb.closeAsync();
      dbInstance = null;
      sqliteDb = null;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database:', error);
    }
  }
}
