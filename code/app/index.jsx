import '@walletconnect/react-native-compat';
import React, { useState, useEffect } from 'react';
import SignIn from './(auth)/sign-in';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { ethers } from 'ethers';
import { getValueFor } from '@/services/storage/storage';

function App() {
    const nodeAddress = 'https://46af-2001-818-dd0a-8c00-7c9b-9ad5-a365-6bc2.ngrok-free.app';
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Connect to JSON-RPC Node
        async function connectToNode() {
            try {
                const provider = new ethers.JsonRpcProvider(nodeAddress);
                const network = await provider.getNetwork();
                console.log('Connected to network:', network);
            } catch (error) {
                console.log('Error connecting to node:', error);
            }
        }
        connectToNode();
        getValueFor('user_info').then(info => {
            if (info) {
                setUserInfo(info);
                router.push('/(tabs)/profile');
            }
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} size={'large'} color={colors.green} />
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
        backgroundColor: colors.backgroundColor,
    },
});

export default App;
