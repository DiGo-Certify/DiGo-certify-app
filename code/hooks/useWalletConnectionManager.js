import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppStatus, useUser } from '@/contexts/AppContext';
import useWalletConnect from '@/services/web3/wallet-connect';
import ErrorHandler from '@/services/errors/ErrorHandler';

export const useWalletConnectionManager = () => {
    const appStatus = useAppStatus();
    const setLoading = appStatus.setLoading || appStatus.setIsLoading; 
    const setError = appStatus.setError;

    const { setUserWallet } = useUser();
    
    // Get wallet connect logic
    const { 
        isConnected, 
        address, 
        handlePress, 
        error: walletError, 
        WalletConnectModal 
    } = useWalletConnect();

    const [isInitializing, setIsInitializing] = useState(true);

    // Sync WalletConnect errors to App Global Error
    useEffect(() => {
        if (walletError && setError) {
            setError(walletError);
        }
    }, [walletError, setError]);

    // Handle successful connection
    useEffect(() => {
        const handleConnection = async () => {
            if (isConnected && address) {
                try {
                    if (setLoading) setLoading(true);
                    
                    // Save wallet to global user state
                    await setUserWallet({ address });
                    
                    // Here you could trigger other logic like checking user type
                    console.log("Wallet connected & saved:", address);

                } catch (err) {
                    console.error("Connection setup failed:", err);
                    if (setError) setError(err.message);
                } finally {
                    if (setLoading) setLoading(false);
                }
            }
        };

        handleConnection();
    }, [isConnected, address]);

    // The Connect Function called by your UI
    const connectWallet = useCallback(async () => {
        try {
            if (setLoading) setLoading(true);
            
            // Trigger the wallet connect modal (or Mock logic)
            await handlePress();
            
        } catch (error) {
            const processedError = ErrorHandler.processError(error, 'connectWallet');
            if (setError) setError(processedError.userMessage);
            Alert.alert('Connection Error', processedError.userMessage);
        } finally {
            if (setLoading) setLoading(false);
        }
    }, [handlePress, setLoading, setError]);

    // Initialization check (optional, prevents flickering)
    useEffect(() => {
        setIsInitializing(false);
    }, []);

    return {
        isConnected,
        address,
        isInitializing,
        connectWallet,
        WalletConnectModal,
        connectionError: walletError,
    };
};