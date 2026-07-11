import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Button, Dialog, Portal, Text } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { ROUTES, USER_TYPES } from '@/constants/app';
import { useSession } from '@/contexts/SessionContext';
import { useWalletConnectionManager } from '@/hooks/useWalletConnectionManager';
import InitialScreen from './initial-screen';

function App() {
    const { isAuthenticated, hasWallet, userInfo, isLoading, error, resetError, setUserType } = useSession();
    const { isConnected, address, connectWallet } = useWalletConnectionManager();

    useEffect(() => {
        if (isAuthenticated && hasWallet && userInfo) {
            router.replace(ROUTES.PROFILE);
        }
    }, [isAuthenticated, hasWallet, userInfo]);

    useEffect(() => {
        if (isConnected && address && !userInfo) {
            router.replace('/profile-setup');
        }
    }, [isConnected, address, userInfo]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Portal>
                    <Dialog visible onDismiss={resetError}>
                        <Dialog.Title>Error</Dialog.Title>
                        <Dialog.Content>
                            <Text>{error}</Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={resetError}>OK</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        );
    }

    const handleGuest = async () => {
        await setUserType({ type: USER_TYPES.GUEST });
        router.push('/validation');
    };

    return (
        <View style={styles.container}>
            <InitialScreen onConnect={connectWallet} onGuest={handleGuest} />
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
