import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import Icons from '../../constants/icons';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const ProfileInfo = ({ title, subtitle }) => (
    <View style={styles.profileInfoContainer}>
        <Text style={styles.profileTitle}>{title}</Text>
        <Text style={styles.profileSubtitle}>{subtitle}</Text>
    </View>
);

const FeatureItem = ({ icon, title }) => {  
    return (
        <View style={styles.featureItemContainer}>
            <Image resizeMode="cover" source={icon} style={styles.featureIcon} />
            <Text>{title}</Text>
        </View>
    );
};

function Profile({ firstName, lastName, image, hasWallet, wallet, accountDate }) {
    const features = [
        { icon: Icons.favorite, title: 'Your Favorite' },
        { icon: Icons.send, title: 'Tell your friends' },
        { icon: Icons.settings, title: 'Settings' },
        { icon: Icons.logOut, title: 'Log Out' },
    ];

    return (
        <View style={styles.mainContainer}>
            <View style={styles.profileSection}>
                <Image resizeMode="cover" source={Icons.profile} style={styles.avatarImage} />
                <View style={styles.profileDetails}>
                    <ProfileInfo title={firstName} subtitle={lastName} />
                    <ProfileInfo title={`since ${accountDate}`} />
                </View>
            </View>
            <View style={styles.walletSection}>
                <View style={styles.walletInfo}>
                    <Text style={styles.walletInfoTitle}>Wallet</Text>
                    {hasWallet ? <Text style={styles.walletAmount}>{wallet}</Text> : <Text>Define your wallet</Text>}
                </View>
                <View style={styles.spentInfo}>
                    <Text style={styles.spentTitle}>Spent</Text>
                    <Text style={styles.spentAmount}>PKR 2K+</Text>
                </View>
            </View>
            {features.map((feature, index) => (
                <FeatureItem key={index} iconUri={feature.iconUri} title={feature.title} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: Colors.backgroundColor,
        flex: 1,
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
    },
    headerContainer: {
        display: 'flex',
        width: '100%',
        alignItems: 'start',
        justifyContent: 'space-between',
        padding: 12,
    },
    timeText: {
        color: '#000',
        textAlign: 'center',
        marginTop: 8,
        fontFamily: 'Acme',
        fontSize: 17,
    },
    profileImage: {
        width: 92,
        height: 92,
        borderRadius: 46,
    },
    iconsContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconImage: {
        width: 18,
        height: 18,
    },
    iconImageLarge: {
        width: 27,
        height: 27,
    },
    profileSection: {
        display: 'flex',
        flexDirection: 'row',
        marginTop: 31,
        padding: 20,
    },
    avatarImage: {
        width: 135,
        height: 135,
        borderRadius: 67.5,
    },
    profileDetails: {
        flex: 1,
        marginLeft: 20,
        justifyContent: 'center',
    },
    profileInfoContainer: {
        marginBottom: 5,
    },
    profileTitle: {
        fontFamily: 'Lato-Bold',
        fontSize: 24,
    },
    profileSubtitle: {
        fontFamily: 'Lato-Regular',
        fontSize: 20,
        textAlign: 'center',
    },
    walletSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        padding: 20,
    },
    walletInfo: {
        alignItems: 'center',
    },
    walletInfoTitle: {
        fontSize: 20,
        fontFamily: 'Lato-Bold',
    },
    walletAmount: {
        marginTop: 5,
        fontSize: 18,
        fontFamily: 'Lato-Regular',
    },
    spentInfo: {
        alignItems: 'center',
    },
    spentTitle: {
        fontSize: 20,
        fontFamily: 'Lato-Bold',
    },
    spentAmount: {
        marginTop: 5,
        fontSize: 18,
        fontFamily: 'Lato-Regular',
    },
    menuOptionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        padding: 10,
    },
    menuOptionImage: {
        width: 36,
        height: 36,
    },
    menuOptionText: {
        marginLeft: 10,
        fontSize: 18,
        fontFamily: 'Lato-Regular',
    },
    featureItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    featureIcon: {
        width: 36,
        height: 36,
        marginRight: 20,
    },
    featureItemTextContainer: {
        fontFamily: 'Lato-Regular',
    },
});

export default Profile;
