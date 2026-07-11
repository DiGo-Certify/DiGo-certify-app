import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import Images from '@/constants/images';
import Colors from '@/constants/colors';
import HeaderImage from '@/components/HeaderImage';
import FormField from '@/components/FormField';
import Background from '@/components/Background';
import { useCertificateEmission } from '@/hooks/useCertificateEmission';
import { validateCertificateForm } from '@/utils/validation';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const EmissionScreen = () => {
    const { form, fileInfo, isLoading, error, setField, setFile, emitCertificate } = useCertificateEmission();
    const [showValidationErrors, setShowValidationErrors] = useState(false);

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result && !result.canceled) {
                const { uri, name, size, mimeType } = result.assets[0];
                const fileSize = size || 0;

                if (fileSize > 10 * 1024 * 1024) {
                    Alert.alert('Error', 'File size must be less than 10MB');
                    return;
                }

                const fileContents = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                if (!fileContents) {
                    Alert.alert('Error', 'Could not read the selected file');
                    return;
                }

                setFile({ uri, name, size: fileSize, mimeType, fileContents });
                setField('certificateUri', '');
                Alert.alert('Success', `File "${name}" uploaded successfully`);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to upload file. Please try again.');
        }
    };

    const handleSubmit = async () => {
        setShowValidationErrors(true);

        const validation = validateCertificateForm(form);

        if (!validation.isValid) {
            const errorMessages = Object.values(validation.errors).join('\n');
            Alert.alert('Validation Error', errorMessages);
            return;
        }

        if (!form.certificateUri && !fileInfo) {
            Alert.alert('Error', 'Please provide either a certificate URL or upload a file');
            return;
        }

        if ((form.certificateUri || fileInfo) && !form.password) {
            Alert.alert('Error', 'Password is required for certificate encryption');
            return;
        }

        const success = await emitCertificate();
        if (success) {
            router.back();
        }
    };

    const validation = validateCertificateForm(form);
    const fieldErrors = showValidationErrors ? validation.errors || {} : {};

    return (
        <Background
            noScroll
            headerStyle={styles.backgroundHeader}
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.appbarHeader} statusBarHeight={0}>
                        <Appbar.BackAction onPress={() => router.back()} />
                        <Appbar.Content title="Certificate Issuance" titleStyle={styles.headerTitle} />
                    </Appbar.Header>

                    <View style={styles.headerImageContainer}>
                        <HeaderImage imageSource={Images.splashScreenImage} />
                    </View>
                </View>
            }
            body={
                <View style={styles.container}>
                    <Text variant="titleLarge" style={styles.title}>
                        Issue or Update Certificate
                    </Text>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.section}>
                            <Text variant="titleLarge" style={styles.sectionTitle}>
                                Student Information
                            </Text>

                            <FormField
                                label="Student Wallet Address"
                                value={form.walletAddr}
                                onChange={text => setField('walletAddr', text)}
                                icon="wallet"
                                error={fieldErrors.walletAddr}
                                required
                                autoCapitalize="none"
                                placeholder="0x..."
                                helperText="The student's blockchain wallet address"
                            />
                        </View>

                        <View style={styles.section}>
                            <Text variant="titleLarge" style={styles.sectionTitle}>
                                Academic Information
                            </Text>

                            <FormField
                                label="Course ID"
                                value={form.courseID}
                                onChange={text => setField('courseID', text)}
                                icon="school"
                                error={fieldErrors.courseID}
                                required
                                keyboardType="numeric"
                                placeholder="e.g., 123"
                                helperText="Unique identifier for the course"
                            />

                            <FormField
                                label="Grade/Degree Level"
                                value={form.grade}
                                onChange={text => setField('grade', text)}
                                icon="trophy"
                                error={fieldErrors.grade}
                                required
                                placeholder="e.g., Licenciado, Mestre, Doutor"
                                helperText="Academic degree or grade level"
                            />

                            <FormField
                                label="Registration Code"
                                value={form.registrationCode}
                                onChange={text => setField('registrationCode', text)}
                                icon="card-text"
                                error={fieldErrors.registrationCode}
                                required
                                keyboardType="numeric"
                                placeholder="e.g., 456789"
                                helperText="Certificate registration number"
                            />
                        </View>

                        <View style={styles.section}>
                            <Text variant="titleLarge" style={styles.sectionTitle}>
                                Certificate Information
                            </Text>

                            <FormField
                                label="Certificate URL"
                                value={form.certificateUri}
                                onChange={text => setField('certificateUri', text)}
                                icon="link"
                                error={fieldErrors.certificateUri}
                                autoCapitalize="none"
                                placeholder="https://..."
                                editable={!fileInfo}
                                helperText="Direct link to the certificate file (optional if uploading file)"
                            />

                            <View style={styles.uploadSection}>
                                <Button
                                    mode="outlined"
                                    onPress={handleUpload}
                                    icon="upload"
                                    style={styles.uploadButton}
                                    labelStyle={styles.uploadButtonLabel}
                                >
                                    {fileInfo ? 'Change File' : 'Upload Certificate'}
                                </Button>

                                {fileInfo && (
                                    <View style={styles.fileInfo}>
                                        <Text variant="titleLarge" style={styles.fileName}>
                                            {fileInfo.name}
                                        </Text>
                                        <Text variant="bodyMedium" style={styles.fileSize}>
                                            {fileInfo.size ? `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB` : 'Size unavailable'}
                                        </Text>
                                        <Text variant="bodyMedium" style={styles.fileHint}>
                                            The uploaded file will be used instead of a URL.
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <FormField
                                label="Encryption Password"
                                value={form.password}
                                onChange={text => setField('password', text)}
                                icon="lock"
                                required
                                secureTextEntry
                                placeholder="Enter encryption password"
                                helperText="Password to encrypt the certificate data"
                            />
                        </View>

                        {error && (
                            <View style={styles.errorContainer}>
                                <Text variant="bodyMedium" style={styles.errorText}>
                                    {error}
                                </Text>
                            </View>
                        )}

                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={isLoading}
                            disabled={isLoading}
                            style={styles.submitButton}
                            labelStyle={styles.submitButtonLabel}
                            icon="send"
                        >
                            {isLoading ? 'Submitting Certificate...' : 'Submit Certificate'}
                        </Button>
                    </ScrollView>
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
    backgroundHeader: {
        height: 250,
        minHeight: 250,
    },
    header: {
        backgroundColor: Colors.backgroundColor,
        width: '100%',
        alignSelf: 'stretch',
    },
    appbarHeader: {
        width: '100%',
        alignSelf: 'stretch',
        backgroundColor: Colors.backgroundColor,
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        color: Colors.primary,
    },
    headerImageContainer: {
        alignSelf: 'center',
        marginVertical: 8,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 24,
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 20,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: Colors.darkGray,
        marginBottom: 12,
    },
    uploadSection: {
        marginBottom: 16,
    },
    uploadButton: {
        borderColor: Colors.primary,
        borderWidth: 1,
        marginBottom: 12,
    },
    uploadButtonLabel: {
        fontFamily: 'Poppins-Medium',
        color: Colors.primary,
    },
    fileInfo: {
        backgroundColor: Colors.lightGray,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.success,
    },
    fileName: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: Colors.success,
        marginBottom: 4,
    },
    fileSize: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: Colors.gray,
    },
    fileHint: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: Colors.darkGray,
        marginTop: 4,
    },
    errorContainer: {
        backgroundColor: Colors.error,
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    errorText: {
        fontFamily: 'Poppins-Medium',
        color: Colors.white,
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 20,
    },
    submitButtonLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: Colors.white,
    },
});

export default EmissionScreen;
