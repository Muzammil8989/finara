import * as SecureStore from 'expo-secure-store';
import { logger } from '../lib/logger';

export interface UserProfile {
    name: string;
    avatar: string | null;
    currency: string;
    theme: 'light' | 'dark' | 'system';
    isOnboarded: boolean;
}

const STORAGE_KEY = 'finara_user_profile';
const MAX_NAME_LENGTH = 50;

const DEFAULT_PROFILE: UserProfile = {
    name: '',
    avatar: null,
    currency: 'USD',
    theme: 'system',
    isOnboarded: false,
};

function normalize(parsed: Partial<UserProfile>): UserProfile {
    return {
        ...DEFAULT_PROFILE,
        ...parsed,
        name: typeof parsed.name === 'string' ? parsed.name.slice(0, MAX_NAME_LENGTH) : '',
    };
}

export const UserService = {
    async getProfile(): Promise<UserProfile> {
        try {
            const data = await SecureStore.getItemAsync(STORAGE_KEY);
            if (!data) return { ...DEFAULT_PROFILE };
            return normalize(JSON.parse(data));
        } catch (error) {
            logger.error('Failed to load profile', error);
            return { ...DEFAULT_PROFILE };
        }
    },

    async saveProfile(profile: UserProfile): Promise<void> {
        const sanitized: UserProfile = {
            ...profile,
            name: profile.name.trim().slice(0, MAX_NAME_LENGTH),
        };
        try {
            await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(sanitized));
        } catch (error) {
            logger.error('Failed to save profile', error);
            throw error;
        }
    },

    async clearProfile(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(STORAGE_KEY);
        } catch (error) {
            logger.error('Failed to clear profile', error);
            throw error;
        }
    },

    getCurrencySymbol(code: string): string {
        const currency = POPULAR_CURRENCIES.find(c => c.code === code);
        return currency?.symbol || '$';
    },

    formatCurrency(amount: number, code: string): string {
        const symbol = this.getCurrencySymbol(code);
        const formattedAmount = Math.abs(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${symbol}${formattedAmount}`;
    }
};

export const POPULAR_CURRENCIES = [
    { code: 'USD', name: 'United States Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
    { code: 'CHF', name: 'Swiss Franc', symbol: '₣', flag: '🇨🇭' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
];
