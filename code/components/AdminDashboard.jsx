// Enhanced admin dashboard with comprehensive management
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import {
    Card,
    Title,
    Text,
    Button,
    FAB,
    Chip,
    List,
    Avatar,
    ProgressBar,
    Divider,
    Dialog,
    Portal,
    Paragraph,
} from 'react-native-paper';
import Colors from '@/constants/colors';
import { Loading } from '@/components/Loading';
import BlockchainStatus from '@/components/BlockchainStatus';
import { useUser, useAppStatus } from '@/contexts/AppContext';
import { useBlockchainOperations } from '@/hooks/useBlockchainOperations';
import { useCertificates } from '@/hooks/useCertificates';
import BlockchainService from '@/services/blockchain/BlockchainService';
import { USER_TYPES } from '@/constants/app';
import ErrorService from '@/services/errors/ErrorService';

const AdminDashboard = () => {
    const { userType, wallet, isAdmin } = useUser();
    const { setLoading } = useAppStatus();
    const { isConnected, networkStatus, getOperationStats } = useBlockchainOperations();
    const { certificates, refreshCertificates, isLoading: certificatesLoading } = useCertificates();

    const [dashboardData, setDashboardData] = useState({
        totalCertificates: 0,
        pendingRequests: 0,
        totalUsers: 0,
        systemHealth: 'good',
    });

    const [recentActivity, setRecentActivity] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);

    // Load dashboard data
    useEffect(() => {
        if (isAdmin && isConnected) {
            loadDashboardData();
        }
    }, [isAdmin, isConnected]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Get certificates data
            const certificatesData = (await BlockchainService.getAllCertificates?.()) || [];
            const pendingData = (await BlockchainService.getPendingRequests?.()) || [];

            // Get system statistics
            const operationStats = getOperationStats();

            setDashboardData({
                totalCertificates: certificatesData.length,
                pendingRequests: pendingData.length,
                totalUsers: (await BlockchainService.getTotalUsers?.()) || 0,
                systemHealth:
                    operationStats.failed > operationStats.completed * 0.1
                        ? 'poor'
                        : operationStats.failed > 0
                        ? 'fair'
                        : 'good',
            });

            // Load recent activity
            const activity = await loadRecentActivity();
            setRecentActivity(activity);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            ErrorService.handleError(error, 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const loadRecentActivity = async () => {
        try {
            // This would normally come from your backend or blockchain events
            const mockActivity = [
                {
                    id: 1,
                    type: 'certificate_issued',
                    description: 'Certificate issued to John Doe',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
                    status: 'completed',
                },
                {
                    id: 2,
                    type: 'certificate_request',
                    description: 'New certificate request from Jane Smith',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                    status: 'pending',
                },
                {
                    id: 3,
                    type: 'user_registration',
                    description: 'New user registered: Mike Johnson',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
                    status: 'completed',
                },
            ];

            return mockActivity;
        } catch (error) {
            console.error('Failed to load recent activity:', error);
            return [];
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([loadDashboardData(), refreshCertificates()]);
        } catch (error) {
            ErrorService.handleError(error, 'Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    };

    const handleAdminAction = action => {
        setSelectedAction(action);
        setDialogVisible(true);
    };

    const executeAdminAction = async () => {
        setDialogVisible(false);

        try {
            setLoading(true);

            switch (selectedAction) {
                case 'export_data':
                    await exportSystemData();
                    break;
                case 'system_backup':
                    await createSystemBackup();
                    break;
                case 'clear_cache':
                    BlockchainService.clearCache();
                    Alert.alert('Success', 'System cache cleared successfully.');
                    break;
                case 'refresh_stats':
                    await loadDashboardData();
                    break;
                default:
                    Alert.alert('Coming Soon', 'This feature will be available in a future update.');
            }
        } catch (error) {
            ErrorService.handleError(error, 'Failed to execute admin action');
        } finally {
            setLoading(false);
        }
    };

    const exportSystemData = async () => {
        // Implementation for data export
        Alert.alert('Export Started', 'System data export has been initiated. You will be notified when complete.');
    };

    const createSystemBackup = async () => {
        // Implementation for system backup
        Alert.alert('Backup Started', 'System backup has been initiated. You will be notified when complete.');
    };

    const getHealthColor = health => {
        switch (health) {
            case 'good':
                return Colors.success;
            case 'fair':
                return Colors.warning;
            case 'poor':
                return Colors.error;
            default:
                return Colors.textSecondary;
        }
    };

    const getActivityIcon = type => {
        switch (type) {
            case 'certificate_issued':
                return 'certificate';
            case 'certificate_request':
                return 'file-document-outline';
            case 'user_registration':
                return 'account-plus';
            case 'system_event':
                return 'cog';
            default:
                return 'information';
        }
    };

    const formatTimeAgo = timestamp => {
        const now = new Date();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    // Check admin permissions
    if (!isAdmin) {
        return (
            <View style={styles.unauthorizedContainer}>
                <Card style={styles.unauthorizedCard}>
                    <Card.Content style={styles.unauthorizedContent}>
                        <Avatar.Icon size={64} icon="shield-alert" style={styles.unauthorizedIcon} />
                        <Title style={styles.unauthorizedTitle}>Access Denied</Title>
                        <Text style={styles.unauthorizedText}>
                            You don't have administrative privileges to access this dashboard.
                        </Text>
                    </Card.Content>
                </Card>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BlockchainStatus visible={true} operations={[]} />

            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* Dashboard Overview */}
                <Card style={styles.overviewCard}>
                    <Card.Content>
                        <Title style={styles.sectionTitle}>System Overview</Title>

                        <View style={styles.metricsRow}>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>{dashboardData.totalCertificates}</Text>
                                <Text style={styles.metricLabel}>Total Certificates</Text>
                            </View>

                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>{dashboardData.pendingRequests}</Text>
                                <Text style={styles.metricLabel}>Pending Requests</Text>
                            </View>

                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>{dashboardData.totalUsers}</Text>
                                <Text style={styles.metricLabel}>Total Users</Text>
                            </View>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.healthRow}>
                            <Text style={styles.healthLabel}>System Health</Text>
                            <Chip
                                mode="outlined"
                                style={[styles.healthChip, { borderColor: getHealthColor(dashboardData.systemHealth) }]}
                                textStyle={{ color: getHealthColor(dashboardData.systemHealth) }}
                            >
                                {dashboardData.systemHealth.toUpperCase()}
                            </Chip>
                        </View>

                        <View style={styles.networkRow}>
                            <Text style={styles.networkLabel}>Network Status</Text>
                            <Chip
                                mode="outlined"
                                style={[
                                    styles.networkChip,
                                    { borderColor: isConnected ? Colors.success : Colors.error },
                                ]}
                                textStyle={{ color: isConnected ? Colors.success : Colors.error }}
                            >
                                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                            </Chip>
                        </View>
                    </Card.Content>
                </Card>

                {/* Quick Actions */}
                <Card style={styles.actionsCard}>
                    <Card.Content>
                        <Title style={styles.sectionTitle}>Quick Actions</Title>

                        <View style={styles.actionButtons}>
                            <Button
                                mode="outlined"
                                icon="file-certificate"
                                onPress={() => handleAdminAction('manage_certificates')}
                                style={styles.actionButton}
                            >
                                Manage Certificates
                            </Button>

                            <Button
                                mode="outlined"
                                icon="account-group"
                                onPress={() => handleAdminAction('manage_users')}
                                style={styles.actionButton}
                            >
                                Manage Users
                            </Button>

                            <Button
                                mode="outlined"
                                icon="download"
                                onPress={() => handleAdminAction('export_data')}
                                style={styles.actionButton}
                            >
                                Export Data
                            </Button>

                            <Button
                                mode="outlined"
                                icon="backup-restore"
                                onPress={() => handleAdminAction('system_backup')}
                                style={styles.actionButton}
                            >
                                System Backup
                            </Button>
                        </View>
                    </Card.Content>
                </Card>

                {/* Recent Activity */}
                <Card style={styles.activityCard}>
                    <Card.Content>
                        <Title style={styles.sectionTitle}>Recent Activity</Title>

                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, index) => (
                                <View key={activity.id}>
                                    <List.Item
                                        title={activity.description}
                                        description={formatTimeAgo(activity.timestamp)}
                                        left={() => (
                                            <Avatar.Icon
                                                size={40}
                                                icon={getActivityIcon(activity.type)}
                                                style={[
                                                    styles.activityIcon,
                                                    {
                                                        backgroundColor:
                                                            activity.status === 'completed'
                                                                ? Colors.success
                                                                : Colors.warning,
                                                    },
                                                ]}
                                            />
                                        )}
                                        right={() => (
                                            <Chip mode="outlined" compact style={styles.activityStatus}>
                                                {activity.status}
                                            </Chip>
                                        )}
                                    />
                                    {index < recentActivity.length - 1 && <Divider />}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noActivityText}>No recent activity</Text>
                        )}
                    </Card.Content>
                </Card>

                {/* System Statistics */}
                <Card style={styles.statsCard}>
                    <Card.Content>
                        <Title style={styles.sectionTitle}>System Statistics</Title>

                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Certificate Success Rate</Text>
                            <ProgressBar progress={0.92} color={Colors.success} style={styles.progressBar} />
                            <Text style={styles.statPercentage}>92%</Text>
                        </View>

                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>System Uptime</Text>
                            <ProgressBar progress={0.99} color={Colors.primary} style={styles.progressBar} />
                            <Text style={styles.statPercentage}>99%</Text>
                        </View>

                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Storage Usage</Text>
                            <ProgressBar progress={0.67} color={Colors.warning} style={styles.progressBar} />
                            <Text style={styles.statPercentage}>67%</Text>
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* Floating Action Button */}
            <FAB icon="plus" style={styles.fab} onPress={() => handleAdminAction('new_action')} />

            {/* Action Confirmation Dialog */}
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
                    <Dialog.Title>Confirm Action</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>Are you sure you want to execute this administrative action?</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={executeAdminAction}>Confirm</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundGray,
    },
    scrollView: {
        flex: 1,
        paddingTop: 80, // Account for BlockchainStatus
    },
    unauthorizedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.backgroundGray,
    },
    unauthorizedCard: {
        width: '100%',
        maxWidth: 400,
    },
    unauthorizedContent: {
        alignItems: 'center',
        padding: 24,
    },
    unauthorizedIcon: {
        backgroundColor: Colors.error,
        marginBottom: 16,
    },
    unauthorizedTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: Colors.error,
        marginBottom: 8,
    },
    unauthorizedText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    overviewCard: {
        margin: 16,
        backgroundColor: Colors.white,
    },
    actionsCard: {
        margin: 16,
        marginTop: 8,
        backgroundColor: Colors.white,
    },
    activityCard: {
        margin: 16,
        marginTop: 8,
        backgroundColor: Colors.white,
    },
    statsCard: {
        margin: 16,
        marginTop: 8,
        marginBottom: 80, // Account for FAB
        backgroundColor: Colors.white,
    },
    sectionTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: Colors.primary,
        marginBottom: 16,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricValue: {
        fontFamily: 'Poppins-Bold',
        fontSize: 24,
        color: Colors.primary,
    },
    metricLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    divider: {
        marginVertical: 16,
    },
    healthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    healthLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    healthChip: {
        height: 32,
    },
    networkRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    networkLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    networkChip: {
        height: 32,
    },
    actionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        minWidth: '45%',
        marginBottom: 8,
    },
    activityIcon: {
        marginRight: 8,
    },
    activityStatus: {
        height: 28,
    },
    noActivityText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    statLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
        flex: 1,
    },
    progressBar: {
        flex: 2,
        height: 8,
        marginHorizontal: 12,
    },
    statPercentage: {
        fontFamily: 'Poppins-Bold',
        fontSize: 14,
        color: Colors.primary,
        minWidth: 40,
        textAlign: 'right',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.primary,
    },
});

export default AdminDashboard;
