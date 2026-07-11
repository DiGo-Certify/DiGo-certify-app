import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TouchableRipple, Avatar, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useAccount, useAppKit } from '@reown/appkit-react-native';

import Background from '@/components/Background';
import SettingsModal from '@/components/SettingsModal';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';
import { USER_TYPES } from '@/constants/app';

const getInitials = name =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase();

const Profile = () => {
    const [showSettings, setShowSettings] = useState(false);
    const { logout, wallet, userInfo: sessionUserInfo, userType } = useSession();
    const { isConnected } = useAccount();
    const { disconnect } = useAppKit();

    const profile = useMemo(() => {
        const type = userType?.type || userType || USER_TYPES.DEFAULT;

        return {
            username: sessionUserInfo?.name || 'User',
            initials: getInitials(sessionUserInfo?.name || 'User'),
            profileScope: sessionUserInfo?.profileScope || 'Stored on this device',
            memberSince: sessionUserInfo?.year?.toString() || '2024',
            walletAddress: wallet?.address || '',
            userType: type,
        };
    }, [sessionUserInfo, userType, wallet?.address]);

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    try {
                        if (isConnected) {
                            await disconnect('eip155');
                        }
                    } catch (error) {
                        console.error('Wallet disconnect failed:', error);
                    }

                    await logout();
                    router.replace('/');
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
                    <View style={styles.profileHeader}>
                        <Avatar.Text
                            size={112}
                            label={profile.initials}
                            style={styles.profileAvatar}
                            labelStyle={styles.profileAvatarLabel}
                        />

                        <View style={styles.profileInfo}>
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>{profile.userType}</Text>
                            </View>
                            <Text style={styles.username} numberOfLines={1} adjustsFontSizeToFit>
                                {profile.username}
                            </Text>
                            <Text style={styles.profileScope} numberOfLines={1}>
                                {profile.profileScope}
                            </Text>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.statsContainer}>
                        <DetailItem
                            label="Wallet Connected"
                            value={formatAddress(profile.walletAddress)}
                            icon="wallet-outline"
                        />
                        <DetailItem
                            label="Local Profile Since"
                            value={profile.memberSince}
                            icon="calendar-account-outline"
                        />
                    </View>

                    <SettingsModal
                        isVisible={showSettings}
                        onDismiss={() => setShowSettings(false)}
                        onLogout={handleLogout}
                        walletAddress={profile.walletAddress}
                    />
                </View>
            }
        />
    );
};

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
    profileAvatar: {
        backgroundColor: Colors.primary,
        marginRight: 24,
    },
    profileAvatarLabel: {
        color: Colors.white,
        fontFamily: 'Poppins-SemiBold',
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
    profileScope: {
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
