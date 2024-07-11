import '@walletconnect/react-native-compat';
import React from 'react';
import { WalletConnectModal, useWalletConnectModal } from '@walletconnect/modal-react-native';
import { save } from '@/services/storage/storage';

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

/**
 * Custom hook for WalletConnect that uses WalletConnectModal
 * @returns {Object} WalletConnectModal, isOpen, open, close, provider, isConnected, address, handlePress, error }
 */
function useWalletConnect() {
    const { isOpen, open, close, provider, isConnected, address } = useWalletConnectModal();
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (provider) {
            provider.on('session_update', (error, payload) => {
                if (error) {
                    setError(error);
                }
            });

            provider.on('disconnect', (error, payload) => {
                if (error) {
                    setError(error);
                } else {
                    setError('Disconnected');
                }
            });

            provider.on('error', error => {
                console.error('Provider error:', error);
                setError(error.message);
            });

            provider.on('pairing_proposal', proposal => {
                console.log('Pairing proposal:', proposal);
            });

            provider.on('pairing_created', pairing => {
                console.log('Pairing created:', pairing);
            });

            provider.on('pairing_deleted', pairing => {
                console.log('Pairing deleted:', pairing);
            });
        }
    }, [provider]);

    const handlePress = async () => {
        try {
            setError(null); // Clear previous errors
            if (isConnected) {
                console.log('Disconnecting wallet...');
                return await provider?.disconnect();
            }
            open().catch(err => {
                console.error('Open modal error:', err);
                setError(err.message);
            });
        } catch (error) {
            console.log('WalletConnect error:', error);
        }
    };
    return {
        isOpen,
        open,
        close,
        provider,
        isConnected,
        address,
        handlePress,
        error,
        WalletConnectModal: <WalletConnectModal projectId={projectId} providerMetadata={providerMetadata} />,
    };
}

export default useWalletConnect;
