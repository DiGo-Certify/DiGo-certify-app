import '@walletconnect/react-native-compat';
import React, { useState, useEffect } from 'react';
import SignIn from './(auth)/sign-in';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { ethers } from 'ethers';
import { getValueFor } from '@/services/storage/storage';
import config from '@/config.json';

function App() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let intervalId;

        if (!isConnected) {
            intervalId = setInterval(() => {
                connectToNode(config.rpc);
            }, 5000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isConnected]);

    useEffect(() => {
        getValueFor('user_info').then(info => {
            if (info) {
                setUserInfo(info);
                router.push('/(tabs)/profile');
            }
            setLoading(false);
        });
    }, []);

    const connectToNode = async nodeAddress => {
        try {
            const provider = new ethers.JsonRpcProvider(nodeAddress);
            const network = await provider.getNetwork();
            console.log(`Connected to network`);
            setIsConnected(true);
        } catch (error) {
            console.log('[!] Error connecting to rpc:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} size={'large'} color={Colors.green} />
            </View>
        );
    }

    return userInfo ? <View /> : <SignIn />;
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
