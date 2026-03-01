import '@walletconnect/react-native-compat';
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Alert } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { ROUTES } from '@/constants/app';
import { useUser, useAppStatus } from '@/contexts/AppContext';
import { useWalletConnectionManager } from '@/hooks/useWalletConnectionManager';
import InitialScreen from './initial-screen';
import ErrorHandler from '@/services/errors/ErrorHandler';

function App() {
    const { isAuthenticated, hasWallet, userInfo } = useUser();
    const { isLoading, error, setError, resetError } = useAppStatus();
    const { isConnected, address, isInitializing, connectWallet, WalletConnectModal, connectionError } =
        useWalletConnectionManager();

    // Handle authentication state changes
    useEffect(() => {
        if (isAuthenticated && hasWallet && userInfo) {
            router.replace(ROUTES.PROFILE);
        }
    }, [isAuthenticated, hasWallet, userInfo]);

    // Handle wallet connection state
    useEffect(() => {
        if (isConnected && address && !userInfo) {
            // User connected wallet but needs to complete registration
            router.replace('/sign-up');
        }
    }, [isConnected, address, userInfo]);

    // Handle connection errors
    useEffect(() => {
        if (connectionError) {
            const processedError = ErrorHandler.processError(connectionError, 'WalletConnection');
            setError(processedError.userMessage);
            Alert.alert('Connection Error', processedError.userMessage, [{ text: 'OK', onPress: resetError }]);
        }
    }, [connectionError, setError, resetError]);

    // Loading state
    if (isLoading || isInitializing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Alert.Dialog visible={true}>
                    <Alert.Dialog.Title>Error</Alert.Dialog.Title>
                    <Alert.Dialog.Content>
                        <Alert.Paragraph>{error}</Alert.Paragraph>
                    </Alert.Dialog.Content>
                    <Alert.Dialog.Actions>
                        <Alert.Button onPress={resetError}>OK</Alert.Button>
                    </Alert.Dialog.Actions>
                </Alert.Dialog>
            </View>
        );
    }

    // Main app content
    return (
        <View style={styles.container}>
            <InitialScreen onConnect={connectWallet} onGuest={() => router.push('/validation')} />
            {WalletConnectModal}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});

export default App;
