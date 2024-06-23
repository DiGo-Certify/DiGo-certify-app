import '@walletconnect/react-native-compat';
import React, { useState, useEffect } from 'react';
import SignIn from './(auth)/sign-in';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { getValueFor } from '@/services/storage/storage';

function App() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
