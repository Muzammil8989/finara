/**
 * LOGGER UTILITY
 * Centralized logging that can be disabled in production.
 * Prevents sensitive data from leaking into production logs.
 */

const __DEV__ = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.error(`[ERROR] ${message}`, ...args);
    }
    // In production, you could send to an error reporting service like Sentry
    // e.g., Sentry.captureException(args[0]);
  },

  debug: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
