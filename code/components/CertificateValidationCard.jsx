// Enhanced Certificate Validation Component
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Surface, ProgressBar, List, Divider } from 'react-native-paper';
import FormField from '@/components/FormField';
import Colors from '@/constants/colors';
import { validateValidationForm } from '@/utils/validation';
import { useAsync } from '@/utils/asyncUtils';
import BlockchainService from '@/services/blockchain/BlockchainService';
import ErrorHandler from '@/services/errors/ErrorHandler';
import { CLAIM_TOPICS_OBJ } from '@/services/ethereum/scripts/claims/claimTopics';
import { ethers } from 'ethers';

const CertificateValidationCard = () => {
    const [form, setForm] = useState({
        userAddress: '',
        certificateLink: '',
    });
    const [validationResult, setValidationResult] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);

    // Async validation handler
    const {
        loading: isValidating,
        execute: validateCertificate,
        error: validationError,
    } = useAsync(
        async () => {
            const validation = validateValidationForm(form);

            if (!validation.isValid) {
                const errorMessages = Object.values(validation.errors).join('\n');
                throw new Error(errorMessages);
            }

            // Perform certificate validation
            const result = await BlockchainService.validateCertificate(
                form.userAddress,
                form.certificateLink || uploadedFile
            );

            setValidationResult(result);
            return result;
        },
        {
            onSuccess: result => {
                if (result.isValid) {
                    Alert.alert('✅ Valid Certificate', 'The certificate is authentic and verified on the blockchain.');
                } else {
                    Alert.alert('❌ Invalid Certificate', result.reason || 'The certificate could not be verified.');
                }
            },
            onError: error => {
                Alert.alert('Validation Error', error.userMessage);
            },
            context: 'certificateValidation',
        }
    );

    // Handle form changes
    const handleFormChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear previous results when form changes
        if (validationResult) {
            setValidationResult(null);
        }
    };

    // Handle file upload
    const handleFileUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (result && !result.canceled) {
                const { uri, name, size } = result.assets[0];

                if (size > 10 * 1024 * 1024) {
                    Alert.alert('Error', 'File size must be less than 10MB');
                    return;
                }

                const fileContents = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                setUploadedFile({
                    uri,
                    name,
                    size,
                    fileContents,
                });

                // Clear certificate link when file is uploaded
                setForm(prev => ({ ...prev, certificateLink: '' }));
            }
        } catch (error) {
            ErrorHandler.logError(error, 'handleFileUpload');
            Alert.alert('Error', 'Failed to upload file. Please try again.');
        }
    };

    // Render validation result
    const renderValidationResult = () => {
        if (!validationResult) return null;

        return (
            <Card style={styles.resultCard} elevation={3}>
                <Card.Content>
                    <View style={styles.resultHeader}>
                        <Chip
                            icon={validationResult.isValid ? 'check-circle' : 'close-circle'}
                            style={[
                                styles.statusChip,
                                { backgroundColor: validationResult.isValid ? Colors.success : Colors.error },
                            ]}
                            textStyle={{ color: Colors.white }}
                        >
                            {validationResult.isValid ? 'VALID' : 'INVALID'}
                        </Chip>
                    </View>

                    {validationResult.isValid && validationResult.claims && (
                        <View style={styles.claimsContainer}>
                            <Title style={styles.claimsTitle}>Certificate Details</Title>

                            {validationResult.claims.map((claim, index) => (
                                <Surface key={index} style={styles.claimItem} elevation={1}>
                                    <List.Item
                                        title={`Certificate ${index + 1}`}
                                        description={`Issuer: ${claim.issuer.substring(0, 10)}...`}
                                        left={() => <List.Icon icon="certificate" />}
                                        right={() => (
                                            <Chip size="small" mode="outlined">
                                                Verified
                                            </Chip>
                                        )}
                                    />

                                    {claim.data && (
                                        <View style={styles.claimData}>
                                            <Paragraph style={styles.claimDataText}>
                                                Data: {ethers.toUtf8String(claim.data).substring(0, 100)}...
                                            </Paragraph>
                                        </View>
                                    )}
                                </Surface>
                            ))}
                        </View>
                    )}

                    {!validationResult.isValid && (
                        <View style={styles.errorContainer}>
                            <Paragraph style={styles.errorText}>
                                {validationResult.reason || 'Certificate validation failed'}
                            </Paragraph>
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    // Get form validation
    const validation = validateValidationForm(form);
    const fieldErrors = validation.errors || {};

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Card style={styles.mainCard} elevation={2}>
                <Card.Content>
                    <Title style={styles.title}>Certificate Validation</Title>
                    <Paragraph style={styles.subtitle}>
                        Verify the authenticity of academic certificates on the blockchain
                    </Paragraph>

                    <Divider style={styles.divider} />

                    {/* User Address Input */}
                    <FormField
                        label="Student Wallet Address"
                        value={form.userAddress}
                        onChange={text => handleFormChange('userAddress', text)}
                        icon="wallet"
                        error={fieldErrors.userAddress}
                        required
                        autoCapitalize="none"
                        placeholder="0x..."
                        helperText="The blockchain address of the certificate holder"
                    />

                    {/* Certificate Link Input */}
                    <FormField
                        label="Certificate URL"
                        value={form.certificateLink}
                        onChange={text => handleFormChange('certificateLink', text)}
                        icon="link"
                        error={fieldErrors.certificateLink}
                        autoCapitalize="none"
                        placeholder="https://..."
                        helperText="Direct link to the certificate file"
                        disabled={!!uploadedFile}
                    />

                    {/* File Upload Section */}
                    <View style={styles.uploadSection}>
                        <Button
                            mode="outlined"
                            onPress={handleFileUpload}
                            icon="upload"
                            style={styles.uploadButton}
                            labelStyle={styles.uploadButtonLabel}
                            disabled={!!form.certificateLink}
                        >
                            {uploadedFile ? 'Change File' : 'Or Upload Certificate'}
                        </Button>

                        {uploadedFile && (
                            <Surface style={styles.fileInfo} elevation={1}>
                                <List.Item
                                    title={uploadedFile.name}
                                    description={`${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`}
                                    left={() => <List.Icon icon="file-document" />}
                                    right={() => (
                                        <Button
                                            mode="text"
                                            onPress={() => setUploadedFile(null)}
                                            textColor={Colors.error}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                />
                            </Surface>
                        )}
                    </View>

                    {/* Validation Progress */}
                    {isValidating && (
                        <View style={styles.progressContainer}>
                            <Paragraph style={styles.progressText}>Validating certificate on blockchain...</Paragraph>
                            <ProgressBar indeterminate color={Colors.primary} style={styles.progressBar} />
                        </View>
                    )}

                    {/* Validate Button */}
                    <Button
                        mode="contained"
                        onPress={validateCertificate}
                        loading={isValidating}
                        disabled={isValidating || !form.userAddress || (!form.certificateLink && !uploadedFile)}
                        style={styles.validateButton}
                        labelStyle={styles.validateButtonLabel}
                        icon="shield-check"
                    >
                        {isValidating ? 'Validating...' : 'Validate Certificate'}
                    </Button>
                </Card.Content>
            </Card>

            {/* Validation Result */}
            {renderValidationResult()}

            {/* Help Section */}
            <Card style={styles.helpCard} elevation={1}>
                <Card.Content>
                    <Title style={styles.helpTitle}>How it works</Title>
                    <List.Item
                        title="1. Enter wallet address"
                        description="Provide the blockchain address of the certificate holder"
                        left={() => <List.Icon icon="numeric-1-circle" />}
                    />
                    <List.Item
                        title="2. Provide certificate"
                        description="Either enter a URL or upload the certificate file"
                        left={() => <List.Icon icon="numeric-2-circle" />}
                    />
                    <List.Item
                        title="3. Validate"
                        description="We check the blockchain for certificate authenticity"
                        left={() => <List.Icon icon="numeric-3-circle" />}
                    />
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    mainCard: {
        marginBottom: 16,
        backgroundColor: Colors.white,
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 24,
        color: Colors.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: Colors.gray,
        textAlign: 'center',
        marginBottom: 8,
    },
    divider: {
        marginVertical: 16,
    },
    uploadSection: {
        marginVertical: 16,
    },
    uploadButton: {
        borderColor: Colors.primary,
        marginBottom: 8,
    },
    uploadButtonLabel: {
        fontFamily: 'Poppins-Medium',
        color: Colors.primary,
    },
    fileInfo: {
        borderRadius: 8,
        backgroundColor: Colors.lightGray,
    },
    progressContainer: {
        marginVertical: 16,
    },
    progressText: {
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
        marginBottom: 8,
        color: Colors.primary,
    },
    progressBar: {
        height: 4,
    },
    validateButton: {
        backgroundColor: Colors.primary,
        marginTop: 16,
        paddingVertical: 8,
    },
    validateButtonLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: Colors.white,
    },
    resultCard: {
        marginBottom: 16,
        backgroundColor: Colors.white,
    },
    resultHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    statusChip: {
        paddingHorizontal: 16,
    },
    claimsContainer: {
        marginTop: 16,
    },
    claimsTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: Colors.darkGray,
        marginBottom: 12,
    },
    claimItem: {
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: Colors.backgroundGray,
    },
    claimData: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    claimDataText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: Colors.gray,
    },
    errorContainer: {
        backgroundColor: Colors.errorLight,
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    errorText: {
        fontFamily: 'Poppins-Medium',
        color: Colors.error,
        textAlign: 'center',
    },
    helpCard: {
        backgroundColor: Colors.backgroundGray,
    },
    helpTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: Colors.darkGray,
        marginBottom: 8,
    },
});

export default CertificateValidationCard;
