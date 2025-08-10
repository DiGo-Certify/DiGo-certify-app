// Settings and preferences component
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, List, Switch, Button, Divider, Dialog, Portal, Paragraph } from 'react-native-paper';
import Colors from '@/constants/colors';
import { useUser, useAppStatus } from '@/contexts/AppContext';
import { useNavigation } from '@/services/navigation/NavigationService';
import { USER_TYPES } from '@/constants/app';
import BlockchainService from '@/services/blockchain/BlockchainService';

const SettingsScreen = () => {
    const { userType, wallet, logout, isAdmin } = useUser();
    const { setLoading } = useAppStatus();
    const { goBack } = useNavigation();

    const [settings, setSettings] = useState({
        notifications: true,
        biometric: false,
        autoBackup: true,
        darkMode: false,
    });

    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogType, setDialogType] = useState('');

    // Handle setting changes
    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        // Here you would save to storage
        // await save(`setting_${key}`, value);
    };

    // Handle logout
    const handleLogout = () => {
        setDialogType('logout');
        setDialogVisible(true);
    };

    // Handle cache clear
    const handleClearCache = () => {
        setDialogType('clearCache');
        setDialogVisible(true);
    };

    // Handle data export
    const handleExportData = async () => {
        try {
            setLoading(true);

            // Get user certificates
            const claims = await BlockchainService.getUserClaims(wallet.address);

            const exportData = {
                wallet: wallet.address,
                userType: userType.type,
                certificates: claims.certificates?.length || 0,
                exportDate: new Date().toISOString(),
            };

            // Here you would implement actual export functionality
            // For now, just show the data
            Alert.alert(
                'Export Data',
                `Wallet: ${exportData.wallet}\nCertificates: ${
                    exportData.certificates
                }\nExported: ${new Date().toLocaleDateString()}`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Export Error', 'Failed to export data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Confirm action
    const confirmAction = async () => {
        setDialogVisible(false);

        try {
            setLoading(true);

            switch (dialogType) {
                case 'logout':
                    await logout();
                    // Navigation will be handled by context
                    break;

                case 'clearCache':
                    BlockchainService.clearCache();
                    Alert.alert('Success', 'Cache cleared successfully.');
                    break;

                default:
                    break;
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to complete action. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get dialog content
    const getDialogContent = () => {
        switch (dialogType) {
            case 'logout':
                return {
                    title: 'Confirm Logout',
                    content:
                        'Are you sure you want to log out? You will need to reconnect your wallet to access the app.',
                };
            case 'clearCache':
                return {
                    title: 'Clear Cache',
                    content:
                        'This will clear all cached blockchain data. The app may be slower until the cache is rebuilt.',
                };
            default:
                return { title: '', content: '' };
        }
    };

    const dialogContent = getDialogContent();

    return (
        <ScrollView style={styles.container}>
            {/* User Info Section */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.sectionTitle}>Account Information</Title>

                    <List.Item
                        title="Wallet Address"
                        description={`${wallet?.address?.substring(0, 10)}...${wallet?.address?.substring(34)}`}
                        left={() => <List.Icon icon="wallet" />}
                    />

                    <List.Item
                        title="Account Type"
                        description={userType?.type || 'Unknown'}
                        left={() => <List.Icon icon={isAdmin ? 'shield-account' : 'account'} />}
                        right={() => (
                            <View
                                style={[
                                    styles.typeBadge,
                                    { backgroundColor: isAdmin ? Colors.warning : Colors.primary },
                                ]}
                            >
                                <Title style={styles.typeBadgeText}>{isAdmin ? 'ADMIN' : 'USER'}</Title>
                            </View>
                        )}
                    />
                </Card.Content>
            </Card>

            {/* App Settings */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.sectionTitle}>App Settings</Title>

                    <List.Item
                        title="Push Notifications"
                        description="Receive notifications for certificate updates"
                        left={() => <List.Icon icon="bell" />}
                        right={() => (
                            <Switch
                                value={settings.notifications}
                                onValueChange={value => handleSettingChange('notifications', value)}
                            />
                        )}
                    />

                    <List.Item
                        title="Biometric Authentication"
                        description="Use fingerprint or face recognition"
                        left={() => <List.Icon icon="fingerprint" />}
                        right={() => (
                            <Switch
                                value={settings.biometric}
                                onValueChange={value => handleSettingChange('biometric', value)}
                            />
                        )}
                    />

                    <List.Item
                        title="Auto Backup"
                        description="Automatically backup certificate data"
                        left={() => <List.Icon icon="backup-restore" />}
                        right={() => (
                            <Switch
                                value={settings.autoBackup}
                                onValueChange={value => handleSettingChange('autoBackup', value)}
                            />
                        )}
                    />

                    <List.Item
                        title="Dark Mode"
                        description="Use dark theme"
                        left={() => <List.Icon icon="theme-light-dark" />}
                        right={() => (
                            <Switch
                                value={settings.darkMode}
                                onValueChange={value => handleSettingChange('darkMode', value)}
                            />
                        )}
                    />
                </Card.Content>
            </Card>

            {/* Data & Privacy */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.sectionTitle}>Data & Privacy</Title>

                    <List.Item
                        title="Export My Data"
                        description="Download your certificate data"
                        left={() => <List.Icon icon="download" />}
                        onPress={handleExportData}
                    />

                    <List.Item
                        title="Clear Cache"
                        description="Clear blockchain data cache"
                        left={() => <List.Icon icon="delete" />}
                        onPress={handleClearCache}
                    />
                </Card.Content>
            </Card>

            {/* Admin Settings */}
            {isAdmin && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.sectionTitle}>Admin Settings</Title>

                        <List.Item
                            title="Institution Management"
                            description="Manage institution settings"
                            left={() => <List.Icon icon="domain" />}
                            onPress={() =>
                                Alert.alert('Coming Soon', 'This feature will be available in a future update.')
                            }
                        />

                        <List.Item
                            title="User Management"
                            description="View and manage users"
                            left={() => <List.Icon icon="account-group" />}
                            onPress={() =>
                                Alert.alert('Coming Soon', 'This feature will be available in a future update.')
                            }
                        />

                        <List.Item
                            title="System Statistics"
                            description="View system usage statistics"
                            left={() => <List.Icon icon="chart-line" />}
                            onPress={() =>
                                Alert.alert('Coming Soon', 'This feature will be available in a future update.')
                            }
                        />
                    </Card.Content>
                </Card>
            )}

            {/* About */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.sectionTitle}>About</Title>

                    <List.Item
                        title="Version"
                        description="1.0.0 (Beta)"
                        left={() => <List.Icon icon="information" />}
                    />

                    <List.Item
                        title="Help & Support"
                        description="Get help with using the app"
                        left={() => <List.Icon icon="help-circle" />}
                        onPress={() => Alert.alert('Support', 'Contact support at: support@digocertify.com')}
                    />

                    <List.Item
                        title="Privacy Policy"
                        description="Read our privacy policy"
                        left={() => <List.Icon icon="shield-check" />}
                        onPress={() => Alert.alert('Privacy Policy', 'Privacy policy details would be shown here.')}
                    />

                    <List.Item
                        title="Terms of Service"
                        description="Read our terms of service"
                        left={() => <List.Icon icon="file-document" />}
                        onPress={() => Alert.alert('Terms of Service', 'Terms of service would be shown here.')}
                    />
                </Card.Content>
            </Card>

            {/* Logout Button */}
            <View style={styles.logoutContainer}>
                <Button
                    mode="outlined"
                    onPress={handleLogout}
                    icon="logout"
                    style={styles.logoutButton}
                    labelStyle={styles.logoutButtonLabel}
                >
                    Logout
                </Button>
            </View>

            {/* Confirmation Dialog */}
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
                    <Dialog.Title>{dialogContent.title}</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>{dialogContent.content}</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={confirmAction}>Confirm</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundGray,
    },
    card: {
        margin: 16,
        marginBottom: 8,
        backgroundColor: Colors.white,
    },
    sectionTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: Colors.primary,
        marginBottom: 8,
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    typeBadgeText: {
        fontFamily: 'Poppins-Bold',
        fontSize: 12,
        color: Colors.white,
    },
    logoutContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    logoutButton: {
        borderColor: Colors.error,
    },
    logoutButtonLabel: {
        color: Colors.error,
        fontFamily: 'Poppins-Medium',
    },
});

export default SettingsScreen;
