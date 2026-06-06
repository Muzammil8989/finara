/**
 * Mock for expo-sqlite.
 * Used by Jest when running unit tests that import the DB layer.
 * Add @types/jest to devDependencies to enable jest.fn() type support.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const jest: any;

const mockDb = {
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn(),
};

export const openDatabaseAsync = jest.fn().mockResolvedValue(mockDb);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SQLiteProvider = ({ children }: { children: any }) => children;
