import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import Icons from '@/constants/icons';
import Images from '@/constants/images';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { List, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { getValueFor, removeValueFor, save } from '@/services/storage/storage';
import useWalletConnect from '@/services/web3/wallet-connect';
import { ethers } from 'ethers';
import config from '@/config.json';
import { deployIdentity } from '@/services/ethereum/scripts/deploy-identity';

// TODO: Settings Page
const Profile = () => {
    const [profile, setProfile] = useState({
        username: '',
        from: 'From Earth',
        image: Images.mockupProfileImage,
        wallet: 'Define your wallet',
        since: '2024',
    });
    const [isSaving, setIsSaving] = useState(false);

    const { isConnected, address, handlePress, provider, WalletConnectModal } = useWalletConnect();

    useEffect(() => {
        getValueFor('user_info')
            .then(async value => {
                if (value) {
                    setProfile(prevProfile => ({
                        ...prevProfile,
                        username: value.user,
                        address: value.wallet || profile.wallet,
                    }));
                }
            })
            .catch(error => console.log('Error getting user info: ', error));
    }, []);

    useEffect(() => {
        if (!isConnected) {
            return;
        }

        save('user_info', JSON.stringify({ user: profile.username, wallet: address }))
            .then(() => {
                setProfile(prevProfile => ({
                    ...prevProfile,
                    wallet: address,
                }));
            })
            .catch(error => console.log('Error saving user info: ', error));

        const deployUserIdentity = async () => {
            if (!address && !provider) {
                return;
            }

            try {
                const identityFactory = new ethers.Contract(
                    config.identityFactory.address,
                    config.identityFactory.abi,
                    provider
                );
                const user_salt = profile.username + '-' + 'salt';
                await deployIdentity(identityFactory, address, user_salt);
            } catch (error) {
                console.log(error);
            }
        };
        deployUserIdentity();
    }, [address]);

    // Handle wallet connect with
    const handleWalletConnect = async () => {
        console.log('Connecting wallet...');
        setIsSaving(true);
        await handlePress();
    };

    // Handle logout
    const handleLogout = () => {
        removeValueFor('user_info').then(async () => {
            if (isConnected) {
                await handlePress();
            }
            router.replace('/sign-in');
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.profile}>
                <ProfileImage source={profile.image} />
                <ProfileInfo username={profile.username} from={profile.from} since={profile.since} />
            </View>
            <View style={styles.walletAccount}>
                <WalletInfo
                    title="Wallet"
                    info={profile.wallet}
                    onPress={handleWalletConnect}
                    disabled={isConnected}
                    isLoading={isSaving}
                />
                <WalletInfo title="Account" info="Account information" />
            </View>
            <View style={styles.options}>
                <ListItem title="Your favorite" onPress={() => console.log('Favorite')} icon={Icons.favorite} />
                <ListItem
                    title="Tell your friends"
                    onPress={() => console.log('Tell your friends')}
                    icon={Icons.send}
                />
                <ListItem title="Settings" onPress={() => console.log('Settings')} icon={Icons.settings} />
                <ListItem title="Log out" onPress={handleLogout} icon={Icons.logOut} />
            </View>
            {WalletConnectModal}
        </SafeAreaView>
    );
};

export default Profile;

const ProfileImage = ({ source }) => <Image source={source} style={styles.profileImage} />;

const ProfileInfo = ({ username, from, since }) => (
    <View style={styles.profileInfo}>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.info}>{from}</Text>
        <Text style={styles.info}>{'Since ' + since}</Text>
    </View>
);

const WalletInfo = ({ title, info, onPress, disabled = false, isLoading = false }) => (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={styles.walletInfo}>
        <Text style={styles.title}>{title}</Text>
        {isLoading ? <ActivityIndicator size="small" color={Colors.green} /> : <Text style={styles.info}>{info}</Text>}
    </TouchableOpacity>
);

const ListItem = ({ title, onPress, icon }) => (
    <List.Item
        title={title}
        style={styles.item}
        titleStyle={styles.itemTitle}
        onPress={onPress}
        left={() => <List.Icon icon={icon} />}
    />
);

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
        padding: 20,
    },
    profile: {
        flexDirection: 'row',
        marginBottom: 50,
        justifyContent: 'center',
    },
    profileImage: {
        width: windowWidth * 0.4,
        height: windowWidth * 0.4,
        borderRadius: windowWidth * 0.2, // Half of width and height
        paddingRight: 50,
    },
    profileInfo: {
        marginLeft: 50,
        justifyContent: 'center',
    },
    username: {
        fontSize: 25,
        fontFamily: 'Poppins-SemiBold',
    },
    info: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
    },
    walletAccount: {
        flexDirection: 'row',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    walletInfo: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
    },
    options: {
        flex: 1,
        marginHorizontal: 10,
        marginBottom: 40,
    },
    item: {
        padding: 20,
        marginVertical: 8,
    },
    itemTitle: {
        fontSize: 20,
        fontFamily: 'Poppins-Regular',
    },
});
