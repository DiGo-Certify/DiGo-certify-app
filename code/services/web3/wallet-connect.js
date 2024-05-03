import '@walletconnect/react-native-compat';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { WalletConnectModal, useWalletConnectModal } from '@walletconnect/modal-react-native';

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
 * @returns {Object} { isConnected, address, handleButtonPress, WalletConnectModal }
 */
function useWalletConnect() {
    const { open, isConnected, address, provider } = useWalletConnectModal();
    const handlePress = async () => {
        if (isConnected) {
            return provider?.disconnect();
        }
        return open();
    };
    return {
        isConnected,
        address,
        handlePress,
        WalletConnectModal: <WalletConnectModal projectId={projectId} providerMetadata={providerMetadata} />,
    };
}

export default useWalletConnect;