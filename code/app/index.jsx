import '@walletconnect/react-native-compat';
import React, { useState, useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Alert } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { ethers } from 'ethers';
import { getValueFor, save } from '@/services/storage/storage';
import config from '@/config.json';
import InitialScreen from './initial-screen/initial-screen';
import useWalletConnect from '@/services/web3/wallet-connect.js';

function App() {
    const [loading, setLoading] = useState(true);
    const [isConnectedToNode, setIsConnectedToNode] = useState(false);
    const { isConnected, address, handlePress, error, WalletConnectModal } = useWalletConnect();

    useEffect(() => {
        let intervalId;

        if (!isConnectedToNode) {
            intervalId = setInterval(() => {
                connectToNode(config.rpc); //? Não deveria ter await?
            }, 5000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isConnectedToNode]);

    useEffect(() => {
        const checkWalletConnection = async () => {
            const userInfo = await getValueFor('user_info');
            const walletAddress = await getValueFor('wallet_address');
            if (userInfo && walletAddress) {
                <Redirect to="/profile" />;
            }
            setLoading(false);
        };
        checkWalletConnection();
    }, []);

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
            save('wallet_address', JSON.stringify({ address: address }));
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

    return (
        <>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator animating={true} size={'large'} color={Colors.green} />
                </View>
            ) : (
                !isConnected && <InitialScreen handlePress={handlePress} WalletConnectModal={WalletConnectModal} />
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
