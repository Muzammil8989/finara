import { useColorScheme } from 'nativewind';
import { isDbReady } from '@/lib/db/db-client';
import { setAccountsCurrency } from '@/lib/db/queries';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
    // Latest profile, so rapid successive updates (e.g. typing a name) each
    // build on the previous one instead of a stale render-time copy.
    const profileRef = useRef<UserProfile>(DEFAULT_PROFILE);

    useEffect(() => {
        let mounted = true;
        const loadProfile = async () => {
            try {
                const data = await UserService.getProfile();
                if (mounted) {
                    profileRef.current = data;
                    setProfile(data);
                }
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
        const previous = profileRef.current;
        const newProfile = { ...previous, ...updates };
        profileRef.current = newProfile;
        setProfile(newProfile);
        try {
            await UserService.saveProfile(newProfile);
            // Accounts are always in the profile currency; keep them in step so
            // balances in different currency codes are never added together.
            if (updates.currency && updates.currency !== previous.currency && isDbReady()) {
                await setAccountsCurrency(updates.currency);
            }
        } catch (error) {
            logger.error('Failed to save user profile', error);
            // Roll back only if nothing newer has been applied since.
            if (profileRef.current === newProfile) {
                profileRef.current = previous;
                setProfile(previous);
            }
            throw error;
        }
    }, []);

    // Stable value: nearly every screen reads this context.
    const value = useMemo(() => ({ profile, updateProfile, isLoading }), [profile, updateProfile, isLoading]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};
