/**
 * LOGGER UTILITY
 * Centralized logging that can be disabled in production.
 * Prevents sensitive data from leaking into production logs.
 */

// Metro inlines NODE_ENV, so production builds dead-code-eliminate every log call below.
const IS_DEV = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (IS_DEV) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (IS_DEV) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (IS_DEV) {
      console.error(`[ERROR] ${message}`, ...args);
    }
    // In production, you could send to an error reporting service like Sentry
    // e.g., Sentry.captureException(args[0]);
  },

  debug: (message: string, ...args: unknown[]) => {
    if (IS_DEV) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
