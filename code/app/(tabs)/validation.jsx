import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// Components & Constants
import Images from '@/constants/images';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import colors from '@/constants/colors';
import Background from '@/components/Background';
import HeaderImage from '@/components/HeaderImage';
import ValidatedModal from '@/components/ValidatedModal';

import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants/app';
import { validateValidationForm } from '@/utils/validation';
import { validateCertificate } from '@/services/blockchain';

const Validation = () => {
    const [valid, setValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [certificateLink, setCertificateLink] = useState('');
    const [content, setContent] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [validationResult, setValidationResult] = useState(null);

    // Check user auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedWallet = await SecureStore.getItemAsync(STORAGE_KEYS.WALLET);
            const userWallet = storedWallet ? JSON.parse(storedWallet) : null;
            setIsAuthenticated(!!(userWallet && userWallet.address));
        };
        checkAuth();
    }, []);

    // Clear content if link is cleared manually
    useEffect(() => {
        if (!certificateLink) {
            setContent('');
        }
    }, [certificateLink]);

    const handleCertificateLinkChange = value => {
        setCertificateLink(value);
        if (content) {
            setContent('');
        }
    };

    const handleValidate = async () => {
        try {
            if (!content && !certificateLink) {
                Alert.alert('Error', 'Please upload a certificate or insert a URL');
                return;
            }

            const validation = validateValidationForm({
                userAddress,
                certificateProvided: !!(content || certificateLink),
                certificateLink: content ? '' : certificateLink,
            });
            if (!validation.isValid) {
                Alert.alert('Error', Object.values(validation.errors).join('\n'));
                return;
            }

            const result = await validateCertificate(userAddress, content || certificateLink);
            setValid(result.isValid);
            setValidationResult(result);
            setShowModal(true);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.message || 'Validation failed');
        }
    };

    const handleDocumentPicker = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const { uri, name } = result.assets[0];
            const fileContents = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            setContent(fileContents);
            setCertificateLink(name);
        } catch (err) {
            console.log('Picker Error:', err);
        }
    };

    const handleImportOwnWallet = async () => {
        const storedWallet = await SecureStore.getItemAsync(STORAGE_KEYS.WALLET);
        const userWallet = storedWallet ? JSON.parse(storedWallet) : null;
        if (userWallet?.address) {
            setUserAddress(userWallet.address);
        } else {
            Alert.alert('No Wallet', 'Could not find a connected wallet on this device.');
        }
    };

    return (
        <>
            <Background
                header={
                    <View style={styles.header}>
                        <HeaderImage imageSource={Images.splashScreenImage} />
                    </View>
                }
                body={
                    <View>
                        <Text style={styles.title}>Certificate Validation</Text>

                        <View style={styles.formContainer}>
                            <FormField
                                label="Insert Student Address"
                                icon="account"
                                value={userAddress}
                                onChange={setUserAddress}
                                outSideIconComponent={
                                    <IconButton
                                        icon={isAuthenticated ? 'account-plus' : 'account-off'}
                                        iconColor="black"
                                        size={24}
                                        onPress={handleImportOwnWallet}
                                        disabled={!isAuthenticated}
                                    />
                                }
                            />

                            <FormField
                                label="Insert Certificate Link"
                                icon="certificate"
                                value={certificateLink}
                                onChange={handleCertificateLinkChange}
                                outSideIconComponent={
                                    <IconButton
                                        icon="file-upload"
                                        iconColor="black"
                                        size={24}
                                        onPress={handleDocumentPicker}
                                    />
                                }
                            />
                        </View>
                    </View>
                }
                footer={
                    <ActionButton
                        text="Validate"
                        buttonStyle={styles.validateButton}
                        textStyle={styles.validateButtonText}
                        mode={'elevated'}
                        onPress={handleValidate}
                        color={colors.backgroundColor}
                    />
                }
            />

            <ValidatedModal
                visible={showModal}
                onDismiss={() => setShowModal(false)}
                valid={valid}
                result={validationResult}
            />
        </>
    );
};

export default Validation;

const styles = StyleSheet.create({
    header: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center', 
    },
    title: {
        fontSize: 30,
        fontFamily: 'Poppins-ExtraBold',
        textAlign: 'center',
        marginBottom: 10,
    },
    formContainer: {
        marginTop: 16,
    },
    validateButton: {
        borderRadius: 16,
        borderWidth: 4,
        borderColor: colors.white,
        elevation: 5,
    },
    validateButtonText: {
        fontSize: 30,
        lineHeight: 40,
        width: '70%',
        fontFamily: 'Poppins-ExtraBold',
        color: colors.black,
    },
});
