import { useColorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { UserProfile, UserService } from '../services/user-service';

type ThemeOption = 'light' | 'dark' | 'system';

interface UserContextType {
    profile: UserProfile;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
    name: '',
    avatar: null,
    currency: 'USD',
    theme: 'system',
    isOnboarded: false,
};

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { setColorScheme } = useColorScheme();
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadProfile = async () => {
            try {
                const data = await UserService.getProfile();
                if (mounted) setProfile(data);
            } catch (error) {
                logger.error('Failed to load user profile, using defaults', error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        loadProfile();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (profile.theme) {
            const validThemes: ThemeOption[] = ['light', 'dark', 'system'];
            if (validThemes.includes(profile.theme)) setColorScheme(profile.theme);
        }
    }, [profile.theme, setColorScheme]);

    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        const newProfile = { ...profile, ...updates };
        setProfile(newProfile);
        try {
            await UserService.saveProfile(newProfile);
        } catch (error) {
            logger.error('Failed to save user profile', error);
            setProfile(profile);
            throw error;
        }
    }, [profile]);

    return (
        <UserContext.Provider value={{ profile, updateProfile, isLoading }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};
