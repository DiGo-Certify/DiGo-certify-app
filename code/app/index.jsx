import '@walletconnect/react-native-compat';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Alert } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { getValueFor, save } from '@/services/storage/storage';
import InitialScreen from './initial-screen/initial-screen';
import useWalletConnect from '@/services/web3/wallet-connect.js';
import isAdminWallet from '@/services/ethereum/scripts/utils/isAdminWallet';
import { deployIdentity } from '@/services/ethereum/scripts/identities/deploy-identity';
import { getContractAt } from '@/services/ethereum/scripts/utils/ethers';
import { v4 as uuidv4 } from 'uuid';
import { useRpcProvider } from '@/services/ethereum/scripts/utils/useRpcProvider';
import config from '@/config.json';

function App() {
    const [loading, setLoading] = useState(true);
    const { isConnected, address, handlePress, error, WalletConnectModal } = useWalletConnect();

    useEffect(() => {
        const checkWalletConnection = async () => {
            const userInfo = await getValueFor('user_info');
            const walletAddress = await getValueFor('wallet');
            if (userInfo && walletAddress) {
                // Create OID if it doesn't exist or if the user is not an admin
                if (!isAdminWallet(walletAddress.address)) {
                    deployUserIdentity();
                }
                setLoading(false);
                return router.replace('/profile');
            }
            setLoading(false);
        };
        checkWalletConnection();
    }, [isConnected]);

    useEffect(() => {
        if (isConnected && address) {
            save('wallet', JSON.stringify({ address: address }));
            if (isAdminWallet(address)) {
                save('user_type', JSON.stringify({ type: 'Admin' }));
            } else {
                deployUserIdentity();
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

    const deployUserIdentity = async () => {
        try {
            const walletAddress = await getValueFor('wallet');
            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);
            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            const user_salt = uuidv4();
            const idContract = await deployIdentity(identityFactory, walletAddress.address, user_salt, signer);
            if (idContract) {
                const idAddress = await idContract.getAddress();
                await save('OID', JSON.stringify({ OID: idAddress }));
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (error) {
            Alert.alert('Wallet Connection Error', error);
        }
    }, [error]);

    const handleGuestPress = () => {
        save('user_type', JSON.stringify({ type: 'Admin' }));
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
