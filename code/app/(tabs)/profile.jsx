import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, Dimensions, Alert } from 'react-native';
import { Text, Surface, TouchableRipple, Avatar, Divider } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';

// Components & Services
import Background from '@/components/Background';
import SettingsModal from '@/components/SettingsModal';
import Colors from '@/constants/colors';
import Images from '@/constants/images';
import { getValueFor, removeValueFor } from '@/services/storage/storage';
import { STORAGE_KEYS } from '@/constants/app';

const { width } = Dimensions.get('window');

const Profile = () => {
    const [showSettings, setShowSettings] = useState(false);

    // User State
    const [userInfo, setUserInfo] = useState({
        username: 'User',
        email: 'Loading...',
        walletAddress: '',
        userType: 'Standard',
    });

    useFocusEffect(
        useCallback(() => {
            loadUserProfile();
        }, [])
    );

    const loadUserProfile = async () => {
        try {
            // Get Wallet
            const walletData = await getValueFor(STORAGE_KEYS.WALLET);
            let address = '';
            if (walletData) {
                const parsed = typeof walletData === 'string' ? JSON.parse(walletData) : walletData;
                address = parsed.address || walletData;
            }

            // Get User Info
            const storedUser = await getValueFor(STORAGE_KEYS.USER_INFO);
            let name = 'User';
            let email = 'No Email';

            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                name = parsedUser.username || parsedUser.name || 'User';
                email = parsedUser.email || 'No Email';
            }

            // Get User Type
            const typeData = await getValueFor(STORAGE_KEYS.USER_TYPE);
            const type = typeData && typeData.type ? typeData.type : typeData || 'Standard';

            setUserInfo({
                username: name,
                email: email,
                walletAddress: address,
                userType: type,
            });
        } catch (error) {
            console.log('Error loading profile:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await removeValueFor(STORAGE_KEYS.USER_INFO);
                    await removeValueFor(STORAGE_KEYS.WALLET);
                    await removeValueFor(STORAGE_KEYS.USER_TYPE);
                    router.replace('/sign-in');
                },
            },
        ]);
    };

    const formatAddress = addr => {
        if (!addr || addr.length < 10) return 'Not Connected';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <Background
            noScroll={false}
            header={
                <View style={styles.headerContainer}>
                    <Text style={styles.screenTitle}>My Profile</Text>
                    <TouchableRipple onPress={() => setShowSettings(true)} borderless style={styles.settingsButton}>
                        <Avatar.Icon size={44} icon="cog-outline" color={Colors.black} style={styles.settingsIcon} />
                    </TouchableRipple>
                </View>
            }
            body={
                <View style={styles.container}>
                    {/* --- 1. The "Side-by-Side" Layout --- */}
                    <View style={styles.profileHeader}>
                        {/* Left: Dynamic Avatar */}
                        <View style={styles.imageContainer}>
                            <Image
                                source={Images.mockupProfileImage || Images.splashScreenImage}
                                style={styles.profileImage}
                            />
                        </View>

                        {/* Right: Info */}
                        <View style={styles.profileInfo}>
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>{userInfo.userType}</Text>
                            </View>
                            <Text style={styles.username} numberOfLines={1} adjustsFontSizeToFit>
                                {userInfo.username}
                            </Text>
                            <Text style={styles.email} numberOfLines={1}>
                                {userInfo.email}
                            </Text>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    {/* --- 2. Details Section --- */}
                    <View style={styles.statsContainer}>
                        <DetailItem
                            label="Wallet Connected"
                            value={formatAddress(userInfo.walletAddress)}
                            icon="wallet-outline"
                        />
                        <DetailItem label="Member Since" value="2024" icon="calendar-account-outline" />
                        <DetailItem
                            label="Status"
                            value="Active & Verified"
                            icon="shield-check-outline"
                            valueColor={Colors.success || '#4CAF50'}
                        />
                    </View>

                    {/* Settings Overlay */}
                    <SettingsModal
                        isVisible={showSettings}
                        onDismiss={() => setShowSettings(false)}
                        onLogout={handleLogout}
                        walletAddress={userInfo.walletAddress}
                    />
                </View>
            }
        />
    );
};

// Helper Component for the list items
const DetailItem = ({ label, value, icon, valueColor }) => (
    <View style={styles.detailRow}>
        <View style={styles.detailIconBox}>
            <Avatar.Icon size={24} icon={icon} color={Colors.darkGray} style={{ backgroundColor: 'transparent' }} />
        </View>
        <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 10,
    },
    screenTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 28,
        color: Colors.black,
    },
    settingsButton: {
        borderRadius: 22,
        paddingHorizontal: 16,
    },
    settingsIcon: {
        backgroundColor: Colors.solitudeGrey,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        marginTop: -30,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    imageContainer: {
        width: width * 0.35,
        height: width * 0.35,
        borderRadius: (width * 0.35) / 2,
        elevation: 8, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        backgroundColor: 'white',
        marginRight: 24, // Space between image and text
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    badgeContainer: {
        backgroundColor: Colors.primary,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontFamily: 'Poppins-Bold',
        textTransform: 'uppercase',
    },
    username: {
        fontFamily: 'Poppins-Bold',
        fontSize: 24,
        color: Colors.black,
        lineHeight: 30,
    },
    email: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: Colors.darkGray,
        marginTop: 4,
    },
    divider: {
        backgroundColor: '#E0E0E0',
        height: 1,
        marginBottom: 24,
    },
    statsContainer: {
        gap: 16,
    },
    // Details
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    detailIconBox: {
        width: 40,
        alignItems: 'center',
    },
    detailContent: {
        marginLeft: 12,
    },
    detailLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: Colors.darkGray,
    },
    detailValue: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: Colors.black,
    },
});

export default Profile;
