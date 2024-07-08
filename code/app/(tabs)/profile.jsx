import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import Icons from '@/constants/icons';
import Images from '@/constants/images';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { List, ActivityIndicator } from 'react-native-paper';
import { Redirect, router } from 'expo-router';
import { getValueFor, removeValueFor, save } from '@/services/storage/storage';
import useWalletConnect from '@/services/web3/wallet-connect';
import { ethers } from 'ethers';
import config from '@/config.json';
import { deployIdentity } from '@/services/ethereum/scripts/deploy-identity';

// TODO: Settings Page
const Profile = () => {
    const [profile, setProfile] = useState({
        username: '',
        image: Images.mockupProfileImage,
        wallet: 'Not connected',
        since: '2024',
    });

    const [isSaving, setIsSaving] = useState(false);

    const { isConnected, address, handlePress, provider, WalletConnectModal } = useWalletConnect();

    useEffect(() => {
        const fetchUserInfo = async () => {
            const userInfo = await getValueFor('user_info');
            const profileImage = await getValueFor('profile_image');
            const walletAddress = await getValueFor('wallet_address');
            if (userInfo && walletAddress) {
                setProfile(() => ({
                    username: userInfo.username,
                    since: userInfo.year,
                    image: profileImage || Images.mockupProfileImage,
                    wallet: walletAddress.address,
                }));
            }
        };
        fetchUserInfo();
    }, []);

    useEffect(() => {
        if (!isConnected) {
            return;
        }
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

    //! Handle wallet connect with (To be used on settings)
    const handleWalletConnect = async () => {
        console.log('Connecting wallet...');
        setIsSaving(true);
        await handlePress();
    };

    // Handle logout
    const handleLogout = () => {
        removeValueFor('user_info').then(() =>
            removeValueFor('wallet_adress').then(async () => {
                if (isConnected) {
                    await handlePress();
                }
                return router.replace('/');
            })
        );
    };

    const pickImage = async () => {
        let result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (result.granted === false) {
            Alert.alert('Permission to access camera roll is required!');
            return;
        }

        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!pickerResult.canceled) {
            setProfile(prevProfile => ({
                ...prevProfile,
                image: { uri: pickerResult.assets[0].uri },
            }));
            await save('profile_image', JSON.stringify({ uri: pickerResult.assets[0].uri }));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.profile}>
                <ProfileImage source={profile.image} pickImage={pickImage} />
                <ProfileInfo username={profile.username} since={profile.since} />
            </View>
            <View style={styles.walletAccount}>
                <WalletInfo
                    title="Your Wallet Address"
                    info={profile.wallet}
                    disabled={isConnected}
                    isLoading={isSaving}
                />
                {/* Revise the need of this button */}
                {/* <WalletInfo title="Account" info="Account information" /> */}
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

const ProfileImage = ({ source, pickImage }) => (
    <TouchableOpacity onPress={pickImage}>
        <Image source={{ uri: source?.uri || source }} style={styles.profileImage} />
    </TouchableOpacity>
);

const ProfileInfo = ({ username, from, since }) => (
    <View style={styles.profileInfo}>
        <Text style={styles.username}>{username}</Text>
        {/* <Text style={styles.info}>{from}</Text> */}
        <Text style={styles.info}>{'Since ' + since}</Text>
    </View>
);

const WalletInfo = ({ title, info, isLoading = false }) => (
    <TouchableOpacity disabled={true} style={styles.walletInfo}>
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
