// Enhanced WalletConnect hook with better state management
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import useWalletConnect from '@/services/web3/wallet-connect';
import isAdminWallet from '@/services/ethereum/scripts/utils/isAdminWallet';
import { deployIdentity } from '@/services/ethereum/scripts/identities/deploy-identity';
import { useApp, useUser } from '@/contexts/AppContext';
import { USER_TYPES } from '@/constants/app';
import ErrorHandler from '@/services/errors/ErrorHandler';

export const useWalletConnectionManager = () => {
    const { isConnected, address, handlePress, error, WalletConnectModal } = useWalletConnect();
    const { setUserWallet, setUserType, setAuthenticated } = useUser();
    const { setLoading, setError } = useApp();

    const [isInitializing, setIsInitializing] = useState(true);
    const [shouldDeployIdentity, setShouldDeployIdentity] = useState(false);

    // Handle wallet connection changes
    useEffect(() => {
        if (isConnected && address) {
            handleWalletConnected(address);
        }
    }, [isConnected, address]);

    // Handle wallet connection
    const handleWalletConnected = useCallback(
        async walletAddress => {
            try {
                setLoading(true);

                // Save wallet info
                const walletData = { address: walletAddress };
                await setUserWallet(walletData);

                // Determine user type
                const userType = isAdminWallet(walletAddress) ? USER_TYPES.ADMIN : USER_TYPES.DEFAULT;
                await setUserType({ type: userType });

                // Deploy identity for non-admin users
                if (userType === USER_TYPES.DEFAULT) {
                    setShouldDeployIdentity(true);
                    await deployUserIdentity(walletAddress);
                }

                setAuthenticated(true);
            } catch (error) {
                const processedError = ErrorHandler.processError(error, 'handleWalletConnected');
                setError(processedError.userMessage);
                Alert.alert('Connection Error', processedError.userMessage);
            } finally {
                setLoading(false);
            }
        },
        [setUserWallet, setUserType, setAuthenticated, setLoading, setError]
    );

    // Deploy user identity
    const deployUserIdentity = useCallback(async walletAddress => {
        try {
            console.log('Deploying identity for:', walletAddress);
            await deployIdentity(walletAddress);
            console.log('Identity deployed successfully');
        } catch (error) {
            ErrorHandler.logError(error, 'deployUserIdentity');
            // Don't throw here - identity deployment can be retried later
            console.warn('Identity deployment failed, but user can still proceed');
        }
    }, []);

    // Connect wallet
    const connectWallet = useCallback(async () => {
        try {
            setLoading(true);
            await handlePress();
        } catch (error) {
            const processedError = ErrorHandler.processError(error, 'connectWallet');
            setError(processedError.userMessage);
            Alert.alert('Connection Error', processedError.userMessage);
        } finally {
            setLoading(false);
        }
    }, [handlePress, setLoading, setError]);

    // Initialize connection state
    const initializeConnection = useCallback(async () => {
        try {
            setIsInitializing(true);
            // Check existing connection state
            // This would be handled by the useWalletConnect hook
        } catch (error) {
            ErrorHandler.logError(error, 'initializeConnection');
        } finally {
            setIsInitializing(false);
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        initializeConnection();
    }, [initializeConnection]);

    return {
        // Connection state
        isConnected,
        address,
        isInitializing,
        shouldDeployIdentity,

        // Connection methods
        connectWallet,

        // WalletConnect components
        WalletConnectModal,

        // Error state
        connectionError: error,
    };
};
