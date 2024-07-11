import '@walletconnect/react-native-compat';
import React, { useState, useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Alert } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { getValueFor, save } from '@/services/storage/storage';
import config from '@/config.json';
import InitialScreen from './initial-screen/initial-screen';
import useWalletConnect from '@/services/web3/wallet-connect.js';
import isAdminWallet from '@/services/ethereum/scripts/utils/isAdminWallet';
import { ethers } from 'ethers';

function App() {
    const [loading, setLoading] = useState(true);
    const [isConnectedToNode, setIsConnectedToNode] = useState(false);
    const { isConnected, address, handlePress, error, WalletConnectModal } = useWalletConnect();

    useEffect(() => {
        const checkWalletConnection = async () => {
            const userInfo = await getValueFor('user_info');
            const walletAddress = await getValueFor('wallet');
            if (userInfo && walletAddress) {
                <Redirect to="/profile" />;
            }
            setLoading(false);
        };
        checkWalletConnection();
    }, [isConnectedToNode]);

    const connectToNode = async nodeAddress => {
        try {
            const provider = new ethers.JsonRpcProvider(nodeAddress);
            const network = await provider.getNetwork();
            console.log(`Connected to network: ${network.name}`);
            setIsConnectedToNode(true);
        } catch (error) {
            console.log('[!] Error connecting to rpc:', error);
        }
    };

    useEffect(() => {
        if (isConnected && address) {
            save('wallet', JSON.stringify({ address: address }));
            // Verify if the wallet is an admin wallet (searching in the config file)
            if (isAdminWallet(address)) {
                save('user_type', JSON.stringify({ type: 'Admin' }));
            } else {
                save('user_type', JSON.stringify({ type: 'Default' }));
            }
            const checkUserInfo = async () => {
                const userInfo = await getValueFor('user_info');
                if (userInfo) {
                    return router.replace('/profile');
                } else {
                    console.log('User not found, redirecting to sign-up');
                    return router.replace('/sign-up');
                }
            };
            checkUserInfo();
        }
    }, [isConnected, address]);

    useEffect(() => {
        if (error) {
            Alert.alert('Wallet Connection Error', error);
        }
    }, [error]);

    const handleGuestPress = () => {
        save('user_type', JSON.stringify({ type: 'Guest' }));
        return router.replace('/(tabs)/validation');
    };

    return (
        <>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator animating={true} size={'large'} color={Colors.green} />
                </View>
            ) : (
                !isConnected && (
                    <InitialScreen
                        handleConnectPress={handlePress}
                        handleGuestPress={handleGuestPress}
                        WalletConnectModal={WalletConnectModal}
                    />
                )
            )}
        </>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.backgroundColor,
    },
});

export default App;
