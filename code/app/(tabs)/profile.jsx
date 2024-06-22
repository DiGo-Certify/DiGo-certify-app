import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import Icons from '@/constants/icons';
import Images from '@/constants/images';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { List } from 'react-native-paper';
import { router, useGlobalSearchParams } from 'expo-router';
import { getValueFor, removeValueFor } from '@/services/storage/storage';
import useWalletConnect from '@/services/web3/wallet-connect';

// TODO: Save on Secure Store the wallet address, also todo the settings page
const Profile = () => {
    const params = useGlobalSearchParams();
    // Mockup profile
    const [profile, setProfile] = useState({
        username: 'User',
        from: 'Lisbon',
        image: Images.mockupProfileImage,
        wallet: 'Define your wallet',
        since: '2021',
    });

    const { isConnected, address, handlePress, WalletConnectModal } = useWalletConnect();

    useEffect(() => {
        try {
            getValueFor('user_info').then(value => {
                if (value) {
                    setProfile(prevProfile => ({
                        ...prevProfile,
                        username: value.user || 'User',
                    }));
                }
            });
        } catch (error) {
            console.log('Error getting profile: ', error);
        }
    }, []);

    // Handle wallet connect with metamask
    const handleWalletConnect = async () => {
        // router.push('/initial-screen/initial-screen');
        handlePress();

        if (isConnected) {
            console.log('Connected with address: ', address);
            setProfile(prevProfile => ({
                ...prevProfile,
                wallet: address,
            }));
        }
    };

    // Handle logout
    const handleLogout = async () => {
        await removeValueFor('user_info');
        router.push('/sign-in');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.profile}>
                <ProfileImage source={profile.image} />
                <ProfileInfo username={profile.username} from={profile.from} since={profile.since} />
            </View>
            <View style={styles.walletAccount}>
                <WalletInfo title="Wallet" info={profile.wallet} onPress={handleWalletConnect} />
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

const WalletInfo = ({ title, info, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.walletInfo}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.info}>{info}</Text>
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
        backgroundColor: '#fff',
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
