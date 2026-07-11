import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { STORAGE_KEYS, USER_TYPES } from '@/constants/app';
import ErrorHandler from '@/services/errors/ErrorHandler';

const SessionContext = createContext(null);

const readJson = async key => {
    const value = await SecureStore.getItemAsync(key);
    return value ? JSON.parse(value) : null;
};

const writeJson = (key, value) => SecureStore.setItemAsync(key, JSON.stringify(value));

export function SessionProvider({ children }) {
    const [wallet, setWalletState] = useState(null);
    const [userInfo, setUserInfoState] = useState(null);
    const [userType, setUserTypeState] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        async function loadSession() {
            try {
                const [storedWallet, storedUserInfo, storedUserType] = await Promise.all([
                    readJson(STORAGE_KEYS.WALLET),
                    readJson(STORAGE_KEYS.USER_INFO),
                    readJson(STORAGE_KEYS.USER_TYPE),
                ]);

                if (!mounted) return;

                setWalletState(storedWallet);
                setUserInfoState(storedUserInfo);
                setUserTypeState(storedUserType);
            } catch (loadError) {
                ErrorHandler.logError(loadError, 'loadSession');
                if (mounted) {
                    setError('Failed to initialize app. Please restart the application.');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadSession();

        return () => {
            mounted = false;
        };
    }, []);

    const setWallet = useCallback(async nextWallet => {
        await writeJson(STORAGE_KEYS.WALLET, nextWallet);
        setWalletState(nextWallet);
    }, []);

    const setUserInfo = useCallback(async nextUserInfo => {
        await writeJson(STORAGE_KEYS.USER_INFO, nextUserInfo);
        setUserInfoState(nextUserInfo);
    }, []);

    const setUserType = useCallback(async nextUserType => {
        await writeJson(STORAGE_KEYS.USER_TYPE, nextUserType);
        setUserTypeState(nextUserType);
    }, []);

    const resetError = useCallback(() => {
        setError(null);
    }, []);

    const logout = useCallback(async () => {
        await Promise.all([
            SecureStore.deleteItemAsync(STORAGE_KEYS.WALLET),
            SecureStore.deleteItemAsync(STORAGE_KEYS.USER_INFO),
            SecureStore.deleteItemAsync(STORAGE_KEYS.USER_TYPE),
        ]);

        setWalletState(null);
        setUserInfoState(null);
        setUserTypeState(null);
        setError(null);
        setLoading(false);
    }, []);

    const value = useMemo(() => {
        const type = userType?.type || userType;

        return {
            wallet,
            userInfo,
            userType,
            isAuthenticated: Boolean(wallet?.address && userInfo),
            hasWallet: Boolean(wallet?.address),
            isAdmin: type === USER_TYPES.ADMIN,
            isGuest: type === USER_TYPES.GUEST,
            isLoading,
            error,
            setWallet,
            setUserInfo,
            setUserType,
            setLoading,
            setError,
            resetError,
            logout,
        };
    }, [wallet, userInfo, userType, isLoading, error, setWallet, setUserInfo, setUserType, resetError, logout]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);

    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }

    return context;
}
