import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { SecurityService } from '../services/security-service';

interface AuthContextType {
    isLocked: boolean;
    isSecurityEnabled: boolean;
    unlock: (pin?: string) => Promise<boolean>;
    lock: () => void;
    recheckSecurity: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(true);
    const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkSecurity = async () => {
            try {
                const isConfigured = await SecurityService.isSecurityConfigured();
                if (!mounted) return;
                setIsSecurityEnabled(isConfigured);
                if (!isConfigured) {
                    setIsLocked(false);
                } else {
                    try {
                        const bioPref = await SecurityService.getBiometricPreference();
                        if (bioPref && mounted) {
                            const success = await SecurityService.authenticateBio();
                            if (success && mounted) setIsLocked(false);
                        }
                    } catch (bioError) {
                        logger.warn('Biometric auto-auth failed, falling back to PIN', bioError);
                    }
                }
            } catch (error) {
                logger.error('Failed to check security configuration', error);
                if (mounted) { setIsSecurityEnabled(false); setIsLocked(false); }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        checkSecurity();
        return () => { mounted = false; };
    }, []);

    const recheckSecurity = async () => {
        try {
            const isConfigured = await SecurityService.isSecurityConfigured();
            setIsSecurityEnabled(isConfigured);
            if (!isConfigured) setIsLocked(false);
        } catch (error) {
            logger.error('Failed to recheck security', error);
        }
    };

    const unlock = async (pin?: string): Promise<boolean> => {
        try {
            const success = pin
                ? await SecurityService.verifyPin(pin)
                : await SecurityService.authenticateBio();
            if (success) { setIsLocked(false); return true; }
            return false;
        } catch (error) {
            logger.error('Unlock failed', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ isLocked, isSecurityEnabled, unlock, lock: () => setIsLocked(true), recheckSecurity, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
