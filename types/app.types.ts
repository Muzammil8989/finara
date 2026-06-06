/**
 * Application Type Definitions
 * General app-wide types and interfaces
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ModalType = 'transaction' | 'recurring' | 'budget' | null;

export interface UserProfile {
  name: string;
  avatar: string | null;
  currency: string;
  theme: ThemeMode;
  isOnboarded: boolean;
}

export interface SecuritySettings {
  isPinEnabled: boolean;
  isBiometricEnabled: boolean;
  pin?: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}
