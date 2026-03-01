import '@walletconnect/react-native-compat';
import React, { useState, useEffect } from 'react';
import { WalletConnectModal, useWalletConnectModal } from '@walletconnect/modal-react-native';

// For Developing and Testing purposes
const USE_MOCK_WALLET = false;

// Default Hardhat Account #0 (Useful for local testing)
const MOCK_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const projectId = 'b57487c51107cc8b2509a12a8d028338';

const providerMetadata = {
    name: 'DiGo Certify',
    description: 'Certify your documents with DiGo Certify!',
    url: 'https://your-project-website.com/',
    icons: ['https://your-project-logo.com/'],
    redirect: {
        native: 'YOUR_APP_SCHEME://',
        universal: 'YOUR_APP_UNIVERSAL_LINK.com',
    },
};

function useWalletConnect() {
    // 1. Rename the original hooks so we can wrap them
    const {
        isOpen,
        open: wcOpen,
        close,
        provider: wcProvider,
        isConnected: wcIsConnected,
        address: wcAddress,
    } = useWalletConnectModal();

    // 2. Create local state to mimic the wallet connection
    const [mockConnected, setMockConnected] = useState(false);
    const [error, setError] = useState(null);

    // 3. Determine actual state based on Mode
    const isConnected = USE_MOCK_WALLET ? mockConnected : wcIsConnected;
    const address = USE_MOCK_WALLET && mockConnected ? MOCK_ADDRESS : wcAddress;
    const provider = USE_MOCK_WALLET ? null : wcProvider; // Mock doesn't have a real WC provider

    useEffect(() => {
        if (!USE_MOCK_WALLET && wcProvider) {
            wcProvider.on('session_update', (error, payload) => {
                if (error) setError(error);
            });

            wcProvider.on('disconnect', (error, payload) => {
                if (error) setError(error);
                else setError('Disconnected');
            });

            wcProvider.on('error', error => {
                console.error('Provider error:', error);
                setError(error.message);
            });
        }
    }, [wcProvider]);

    // 4. The Magic: Intercept the "Connect" press
    const handlePress = async () => {
        try {
            setError(null);

            // Handle Disconnect
            if (isConnected) {
                console.log('Disconnecting wallet...');
                if (USE_MOCK_WALLET) {
                    setMockConnected(false);
                    return;
                }
                return await wcProvider?.disconnect();
            }

            // Handle Connect
            if (USE_MOCK_WALLET) {
                console.log('⚡️ MOCK MODE: Connecting instantly...');
                setTimeout(() => {
                    setMockConnected(true);
                }, 500); // Fake a small delay for realism
                return;
            }

            // Real WalletConnect Flow
            wcOpen().catch(err => {
                console.error('Open modal error:', err);
                setError(err.message);
            });
        } catch (error) {
            console.log('WalletConnect error:', error);
        }
    };

    return {
        isOpen,
        open: wcOpen,
        close,
        provider,
        isConnected,
        address,
        handlePress,
        error,
        // Only render the modal if we are NOT mocking
        WalletConnectModal: !USE_MOCK_WALLET ? (
            <WalletConnectModal projectId={projectId} providerMetadata={providerMetadata} />
        ) : null,
    };
}

export default useWalletConnect;
