import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

const SettingsModal = ({ isVisible, onDismiss, onLogout, walletAddress }) => {
    return (
        <Portal>
            <Modal visible={isVisible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
                <View style={styles.handle} />
                <Text style={styles.title}>Settings</Text>

                {/* Wallet Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Wallet Connection</Text>
                    <Surface style={styles.walletCard} elevation={0}>
                        <MaterialCommunityIcons name="wallet-outline" size={24} color={Colors.primary} />
                        <View style={styles.walletInfo}>
                            <Text style={styles.walletLabel}>Connected Account</Text>
                            <Text style={styles.walletAddress} numberOfLines={1}>
                                {walletAddress || 'Not Connected'}
                            </Text>
                        </View>
                    </Surface>
                </View>

                <Button
                    mode="contained"
                    onPress={onLogout}
                    style={styles.logoutButton}
                    buttonColor={Colors.error || '#FF5252'}
                    icon="logout"
                >
                    Log Out
                </Button>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 24,
        padding: 24,
        paddingTop: 12,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 24,
    },
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: Colors.gray,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    walletCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 12,
    },
    walletInfo: {
        marginLeft: 12,
        flex: 1,
    },
    walletLabel: {
        fontSize: 10,
        color: Colors.gray,
        fontFamily: 'Poppins-Regular',
    },
    walletAddress: {
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        color: Colors.black,
    },
    logoutButton: {
        borderRadius: 12,
        paddingVertical: 4,
    },
});

export default SettingsModal;
