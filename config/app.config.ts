/**
 * Application Configuration
 * Core app settings and constants
 */

export const APP_CONFIG = {
  name: 'Finara',
  version: '1.0.0',
  description: 'Personal Finance Management App',

  // Security settings
  security: {
    minPinLength: 4,
    maxPinLength: 6,
    pinAttempts: 3,
    lockoutDuration: 300000, // 5 minutes in ms
    sessionTimeout: 900000, // 15 minutes in ms
  },

  // Database settings
  database: {
    name: 'finara.db',
    version: 3,
  },

  // Date/Time settings
  dateTime: {
    defaultLocale: 'en-US',
    defaultTimezone: 'America/New_York',
    dateFormat: 'MMM DD, YYYY',
    timeFormat: 'h:mm A',
  },

  // Currency settings
  currency: {
    defaultCurrency: 'USD',
    defaultLocale: 'en-US',
  },

  // Pagination settings
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // Chart settings
  charts: {
    defaultColors: [
      '#6366F1', // Indigo
      '#EC4899', // Pink
      '#10B981', // Green
      '#F59E0B', // Amber
      '#8B5CF6', // Violet
      '#EF4444', // Red
      '#06B6D4', // Cyan
      '#F97316', // Orange
    ],
  },

  // Feature flags
  features: {
    biometricAuth: true,
    recurringTransactions: true,
    budgets: true,
    reports: true,
    exports: false,
    cloudSync: false,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
