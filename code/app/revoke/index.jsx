import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Appbar, Button, Text } from 'react-native-paper';
import { router } from 'expo-router';

import Background from '@/components/Background';
import FormField from '@/components/FormField';
import HeaderImage from '@/components/HeaderImage';
import Colors from '@/constants/colors';
import Images from '@/constants/images';
import { STORAGE_KEYS } from '@/constants/app';
import * as SecureStore from 'expo-secure-store';
import { revokeCertificate } from '@/services/blockchain';
import { validateWalletAddress } from '@/utils/validation';

const RevokeCertificateScreen = () => {
    const [studentWallet, setStudentWallet] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRevoke = async () => {
        const walletError = validateWalletAddress(studentWallet);
        if (walletError) {
            Alert.alert('Invalid Wallet', walletError);
            return;
        }

        try {
            setIsLoading(true);
            const storedWallet = await SecureStore.getItemAsync(STORAGE_KEYS.WALLET);
            const issuerWallet = storedWallet ? JSON.parse(storedWallet) : null;
            await revokeCertificate({
                issuerWallet,
                receiverWalletAddress: studentWallet,
            });
            Alert.alert('Certificate Revoked', 'The certificate claim was removed from the student identity.');
            router.back();
        } catch (error) {
            Alert.alert('Revocation Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Background
            noScroll
            headerStyle={styles.backgroundHeader}
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.appbarHeader} statusBarHeight={0}>
                        <Appbar.BackAction onPress={() => router.back()} />
                        <Appbar.Content title="Revoke Certificate" titleStyle={styles.headerTitle} />
                    </Appbar.Header>
                    <View style={styles.headerImageContainer}>
                        <HeaderImage imageSource={Images.splashScreenImage} />
                    </View>
                </View>
            }
            body={
                <View style={styles.container}>
                    <Text style={styles.title}>Revoke Student Certificate</Text>
                    <FormField
                        label="Student Wallet Address"
                        icon="wallet"
                        value={studentWallet}
                        onChange={setStudentWallet}
                        autoCapitalize="none"
                        placeholder="0x..."
                    />
                    <Button
                        mode="contained"
                        icon="close-octagon"
                        loading={isLoading}
                        disabled={isLoading}
                        onPress={handleRevoke}
                        style={styles.button}
                        buttonColor={Colors.error || '#D32F2F'}
                    >
                        Revoke Certificate
                    </Button>
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
    backgroundHeader: {
        height: 250,
        minHeight: 250,
    },
    header: {
        width: '100%',
        backgroundColor: Colors.backgroundColor,
    },
    appbarHeader: {
        width: '100%',
        backgroundColor: Colors.backgroundColor,
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        color: Colors.primary,
    },
    headerImageContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    container: {
        width: '100%',
        paddingHorizontal: 20,
        gap: 18,
        paddingTop: 24,
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 24,
        color: Colors.black,
        textAlign: 'center',
    },
    button: {
        borderRadius: 10,
        marginTop: 12,
    },
});

export default RevokeCertificateScreen;
