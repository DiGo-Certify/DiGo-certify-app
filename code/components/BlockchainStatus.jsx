// Blockchain status and activity indicator
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card, Title, Caption, ProgressBar, Chip, Text } from 'react-native-paper';
import Colors from '@/constants/colors';
import BlockchainService from '@/services/blockchain/BlockchainService';

const BlockchainStatus = ({ visible = true, operations = [] }) => {
    const [networkStatus, setNetworkStatus] = useState('checking');
    const [connectionQuality, setConnectionQuality] = useState(0);
    const [activeOperations, setActiveOperations] = useState([]);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            checkNetworkStatus();
            const interval = setInterval(checkNetworkStatus, 10000); // Check every 10 seconds

            return () => clearInterval(interval);
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    useEffect(() => {
        setActiveOperations(operations);
    }, [operations]);

    const checkNetworkStatus = async () => {
        try {
            const start = Date.now();
            const isConnected = await BlockchainService.checkConnection();
            const responseTime = Date.now() - start;

            if (isConnected) {
                setNetworkStatus('connected');
                // Calculate connection quality based on response time
                if (responseTime < 1000) setConnectionQuality(1);
                else if (responseTime < 3000) setConnectionQuality(0.7);
                else if (responseTime < 5000) setConnectionQuality(0.4);
                else setConnectionQuality(0.2);
            } else {
                setNetworkStatus('disconnected');
                setConnectionQuality(0);
            }
        } catch (error) {
            setNetworkStatus('error');
            setConnectionQuality(0);
        }
    };

    const getStatusColor = () => {
        switch (networkStatus) {
            case 'connected':
                return connectionQuality > 0.7 ? Colors.success : Colors.warning;
            case 'disconnected':
                return Colors.error;
            case 'error':
                return Colors.error;
            default:
                return Colors.primary;
        }
    };

    const getStatusText = () => {
        switch (networkStatus) {
            case 'connected':
                return connectionQuality > 0.7 ? 'Excellent' : connectionQuality > 0.4 ? 'Good' : 'Slow';
            case 'disconnected':
                return 'Disconnected';
            case 'error':
                return 'Error';
            default:
                return 'Checking...';
        }
    };

    const getOperationIcon = type => {
        switch (type) {
            case 'certificate_request':
                return '📝';
            case 'certificate_emission':
                return '🎓';
            case 'certificate_validation':
                return '✅';
            case 'identity_verification':
                return '🔐';
            case 'smart_contract':
                return '📄';
            default:
                return '⚡';
        }
    };

    if (!visible) {
        return null;
    }

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Card style={styles.statusCard}>
                <Card.Content style={styles.statusContent}>
                    {/* Network Status */}
                    <View style={styles.statusRow}>
                        <View style={styles.statusIndicator}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                            <Text style={styles.statusText}>Blockchain</Text>
                        </View>

                        <View style={styles.statusDetails}>
                            <Caption style={styles.statusLabel}>{getStatusText()}</Caption>
                            {networkStatus === 'connected' && (
                                <ProgressBar
                                    progress={connectionQuality}
                                    color={getStatusColor()}
                                    style={styles.qualityBar}
                                />
                            )}
                        </View>
                    </View>

                    {/* Active Operations */}
                    {activeOperations.length > 0 && (
                        <View style={styles.operationsContainer}>
                            <Caption style={styles.operationsTitle}>
                                Active Operations ({activeOperations.length})
                            </Caption>

                            <View style={styles.operationsList}>
                                {activeOperations.slice(0, 3).map((operation, index) => (
                                    <View key={index} style={styles.operationItem}>
                                        <Text style={styles.operationIcon}>{getOperationIcon(operation.type)}</Text>
                                        <View style={styles.operationDetails}>
                                            <Text style={styles.operationName}>{operation.name || operation.type}</Text>
                                            <ProgressBar
                                                progress={operation.progress || 0.5}
                                                color={Colors.primary}
                                                style={styles.operationProgress}
                                            />
                                        </View>
                                        <Chip
                                            mode="outlined"
                                            compact
                                            style={styles.operationChip}
                                            textStyle={styles.operationChipText}
                                        >
                                            {operation.status || 'Processing'}
                                        </Chip>
                                    </View>
                                ))}

                                {activeOperations.length > 3 && (
                                    <Caption style={styles.moreOperations}>
                                        +{activeOperations.length - 3} more operations
                                    </Caption>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Quick Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Caption style={styles.statLabel}>Gas Price</Caption>
                            <Text style={styles.statValue}>~15 Gwei</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Caption style={styles.statLabel}>Block Time</Caption>
                            <Text style={styles.statValue}>~13s</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Caption style={styles.statLabel}>Network</Caption>
                            <Text style={styles.statValue}>Sepolia</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: 16,
    },
    statusCard: {
        backgroundColor: Colors.white,
        elevation: 4,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusContent: {
        paddingVertical: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    statusText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    statusDetails: {
        alignItems: 'flex-end',
        flex: 1,
    },
    statusLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        marginBottom: 4,
    },
    qualityBar: {
        width: 60,
        height: 4,
    },
    operationsContainer: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
    },
    operationsTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        marginBottom: 8,
        color: Colors.textSecondary,
    },
    operationsList: {
        gap: 8,
    },
    operationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    operationIcon: {
        fontSize: 16,
        marginRight: 8,
        width: 20,
        textAlign: 'center',
    },
    operationDetails: {
        flex: 1,
        marginRight: 8,
    },
    operationName: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    operationProgress: {
        height: 2,
    },
    operationChip: {
        height: 24,
        backgroundColor: Colors.backgroundGray,
    },
    operationChipText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10,
    },
    moreOperations: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
        color: Colors.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10,
        marginBottom: 2,
        color: Colors.textSecondary,
    },
    statValue: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: Colors.textPrimary,
    },
});

export default BlockchainStatus;
