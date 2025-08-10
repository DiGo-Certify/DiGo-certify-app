// Enhanced certificate validation screen
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Text, Button, TextInput, Chip, Divider, List, Avatar } from 'react-native-paper';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import Colors from '@/constants/colors';
import { Loading } from '@/components/Loading';
import CertificateValidationCard from '@/components/CertificateValidationCard';
import { useBlockchainOperations } from '@/hooks/useBlockchainOperations';
import { useAppStatus } from '@/contexts/AppContext';
import { VALIDATION_MESSAGES } from '@/constants/app';
import { isValidUrl } from '@/utils/validation';
import ErrorService from '@/services/errors/ErrorService';

const CertificateValidationScreen = () => {
    const [validationMethod, setValidationMethod] = useState('manual'); // manual, qr, url
    const [certificateInput, setCertificateInput] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [validationHistory, setValidationHistory] = useState([]);

    const { validateCertificate, isConnected } = useBlockchainOperations();
    const { setLoading } = useAppStatus();

    // Request camera permissions
    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        if (validationMethod === 'qr') {
            getCameraPermissions();
        }
    }, [validationMethod]);

    // Handle manual validation
    const handleManualValidation = async () => {
        if (!certificateInput.trim()) {
            Alert.alert('Error', VALIDATION_MESSAGES.REQUIRED_FIELD);
            return;
        }

        await performValidation(certificateInput.trim());
    };

    // Handle QR code scan
    const handleBarCodeScanned = async ({ type, data }) => {
        setShowScanner(false);

        try {
            // Extract certificate ID from QR data
            let certificateId = data;

            // If it's a URL, extract the certificate ID
            if (isValidUrl(data)) {
                const url = new URL(data);
                certificateId = url.searchParams.get('cert') || url.pathname.split('/').pop();
            }

            if (certificateId) {
                setCertificateInput(certificateId);
                await performValidation(certificateId);
            } else {
                Alert.alert('Invalid QR Code', 'Could not extract certificate ID from QR code.');
            }
        } catch (error) {
            Alert.alert('QR Scan Error', 'Failed to process QR code data.');
        }
    };

    // Handle URL validation
    const handleUrlValidation = async () => {
        if (!certificateInput.trim()) {
            Alert.alert('Error', VALIDATION_MESSAGES.REQUIRED_FIELD);
            return;
        }

        if (!isValidUrl(certificateInput)) {
            Alert.alert('Error', 'Please enter a valid URL.');
            return;
        }

        try {
            const url = new URL(certificateInput);
            const certificateId = url.searchParams.get('cert') || url.pathname.split('/').pop();

            if (certificateId) {
                await performValidation(certificateId);
            } else {
                Alert.alert('Invalid URL', 'Could not extract certificate ID from URL.');
            }
        } catch (error) {
            Alert.alert('URL Error', 'Failed to process certificate URL.');
        }
    };

    // Perform certificate validation
    const performValidation = async certificateId => {
        if (!isConnected) {
            Alert.alert('Connection Error', 'Please check your blockchain connection and try again.');
            return;
        }

        try {
            setIsValidating(true);
            setValidationResult(null);

            const result = await validateCertificate(certificateId);

            const validationData = {
                id: certificateId,
                timestamp: new Date(),
                result,
                isValid: result.isValid,
                method: validationMethod,
            };

            setValidationResult(validationData);
            addToHistory(validationData);
        } catch (error) {
            const errorMessage = ErrorService.getErrorMessage(error, 'validation');
            Alert.alert('Validation Error', errorMessage);

            setValidationResult({
                id: certificateId,
                timestamp: new Date(),
                isValid: false,
                error: errorMessage,
                method: validationMethod,
            });
        } finally {
            setIsValidating(false);
        }
    };

    // Add validation to history
    const addToHistory = validationData => {
        setValidationHistory(prev => [validationData, ...prev.slice(0, 9)]); // Keep last 10
    };

    // Clear validation result
    const clearValidation = () => {
        setValidationResult(null);
        setCertificateInput('');
    };

    // Validation method selector
    const renderMethodSelector = () => (
        <Card style={styles.methodCard}>
            <Card.Content>
                <Title style={styles.methodTitle}>Validation Method</Title>
                <View style={styles.methodButtons}>
                    <Chip
                        selected={validationMethod === 'manual'}
                        onPress={() => setValidationMethod('manual')}
                        style={styles.methodChip}
                        icon="keyboard"
                    >
                        Manual Input
                    </Chip>
                    <Chip
                        selected={validationMethod === 'qr'}
                        onPress={() => setValidationMethod('qr')}
                        style={styles.methodChip}
                        icon="qrcode-scan"
                    >
                        QR Code
                    </Chip>
                    <Chip
                        selected={validationMethod === 'url'}
                        onPress={() => setValidationMethod('url')}
                        style={styles.methodChip}
                        icon="link"
                    >
                        URL Link
                    </Chip>
                </View>
            </Card.Content>
        </Card>
    );

    // Input section based on method
    const renderInputSection = () => {
        if (validationMethod === 'qr') {
            return (
                <Card style={styles.inputCard}>
                    <Card.Content>
                        <Title style={styles.inputTitle}>QR Code Scanner</Title>
                        <Text style={styles.inputDescription}>
                            Scan the QR code on the certificate to validate it instantly
                        </Text>

                        <Button
                            mode="contained"
                            onPress={() => setShowScanner(true)}
                            icon="camera"
                            style={styles.scanButton}
                            disabled={hasPermission === false}
                        >
                            {hasPermission === false ? 'Camera Permission Required' : 'Start Scanning'}
                        </Button>
                    </Card.Content>
                </Card>
            );
        }

        return (
            <Card style={styles.inputCard}>
                <Card.Content>
                    <Title style={styles.inputTitle}>
                        {validationMethod === 'url' ? 'Certificate URL' : 'Certificate ID'}
                    </Title>
                    <Text style={styles.inputDescription}>
                        {validationMethod === 'url'
                            ? 'Enter the complete URL of the certificate'
                            : 'Enter the certificate ID or hash to validate'}
                    </Text>

                    <TextInput
                        label={validationMethod === 'url' ? 'Certificate URL' : 'Certificate ID'}
                        value={certificateInput}
                        onChangeText={setCertificateInput}
                        mode="outlined"
                        style={styles.input}
                        placeholder={
                            validationMethod === 'url'
                                ? 'https://certificates.domain.com/cert?id=...'
                                : 'Enter certificate ID or hash...'
                        }
                        multiline={validationMethod === 'url'}
                        numberOfLines={validationMethod === 'url' ? 3 : 1}
                    />

                    <Button
                        mode="contained"
                        onPress={validationMethod === 'url' ? handleUrlValidation : handleManualValidation}
                        icon="check-circle"
                        style={styles.validateButton}
                        disabled={!certificateInput.trim() || isValidating || !isConnected}
                        loading={isValidating}
                    >
                        Validate Certificate
                    </Button>
                </Card.Content>
            </Card>
        );
    };

    // QR Scanner overlay
    const renderQRScanner = () => {
        if (!showScanner) return null;

        return (
            <View style={styles.scannerContainer}>
                <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={styles.scanner} />
                <View style={styles.scannerOverlay}>
                    <Text style={styles.scannerText}>Position the QR code within the frame</Text>
                    <Button
                        mode="outlined"
                        onPress={() => setShowScanner(false)}
                        style={styles.cancelScanButton}
                        labelStyle={styles.cancelScanButtonLabel}
                    >
                        Cancel
                    </Button>
                </View>
            </View>
        );
    };

    // Validation history
    const renderValidationHistory = () => {
        if (validationHistory.length === 0) return null;

        return (
            <Card style={styles.historyCard}>
                <Card.Content>
                    <Title style={styles.historyTitle}>Recent Validations</Title>
                    {validationHistory.slice(0, 5).map((validation, index) => (
                        <View key={index}>
                            <List.Item
                                title={`${validation.id.substring(0, 16)}...`}
                                description={validation.timestamp.toLocaleString()}
                                left={() => (
                                    <Avatar.Icon
                                        size={40}
                                        icon={validation.isValid ? 'check-circle' : 'close-circle'}
                                        style={{
                                            backgroundColor: validation.isValid ? Colors.success : Colors.error,
                                        }}
                                    />
                                )}
                                right={() => (
                                    <Chip
                                        mode="outlined"
                                        compact
                                        style={{
                                            backgroundColor: validation.isValid
                                                ? Colors.successLight
                                                : Colors.errorLight,
                                        }}
                                    >
                                        {validation.isValid ? 'Valid' : 'Invalid'}
                                    </Chip>
                                )}
                                onPress={() => setValidationResult(validation)}
                            />
                            {index < validationHistory.length - 1 && <Divider />}
                        </View>
                    ))}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            {renderQRScanner()}

            <ScrollView style={styles.scrollView}>
                {renderMethodSelector()}
                {renderInputSection()}

                {validationResult && (
                    <CertificateValidationCard validation={validationResult} onClear={clearValidation} />
                )}

                {renderValidationHistory()}
            </ScrollView>

            {isValidating && <Loading.Overlay message="Validating certificate on blockchain..." />}
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
    },
    methodCard: {
        margin: 16,
        backgroundColor: Colors.white,
    },
    methodTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: Colors.primary,
        marginBottom: 12,
    },
    methodButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    methodChip: {
        marginRight: 8,
        marginBottom: 8,
    },
    inputCard: {
        margin: 16,
        marginTop: 8,
        backgroundColor: Colors.white,
    },
    inputTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: Colors.primary,
        marginBottom: 8,
    },
    inputDescription: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    input: {
        marginBottom: 16,
    },
    validateButton: {
        marginTop: 8,
    },
    scanButton: {
        marginTop: 8,
    },
    scannerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: Colors.black,
    },
    scanner: {
        flex: 1,
    },
    scannerOverlay: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    scannerText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        color: Colors.white,
        textAlign: 'center',
        marginBottom: 20,
    },
    cancelScanButton: {
        borderColor: Colors.white,
    },
    cancelScanButtonLabel: {
        color: Colors.white,
    },
    historyCard: {
        margin: 16,
        marginTop: 8,
        backgroundColor: Colors.white,
    },
    historyTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: Colors.primary,
        marginBottom: 8,
    },
});

export default CertificateValidationScreen;
