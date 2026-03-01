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
import FeatureUnderDev from '@/components/FeatureUnderDev';

// Services & Config
import { CLAIM_TOPICS_OBJ } from '@/services/ethereum/scripts/claims/claimTopics';
import { getContractAt } from '@/services/ethereum/scripts/utils/ethers';
import config from '@/config.json';
import { getIdentity } from '@/services/ethereum/scripts/identities/getIdentity';
import hash from '@/services/ethereum/scripts/utils/encryption/hash';
import { getClaimsByTopic } from '@/services/ethereum/scripts/claims/getClaimsByTopic';
import { useRpcProvider } from '@/services/ethereum/scripts/utils/useRpcProvider';
import { getValueFor } from '@/services/storage/storage';

const Validation = () => {
    const [valid, setValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [certificateLink, setCertificateLink] = useState('');
    const [content, setContent] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check user auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            const userWallet = await getValueFor('wallet');
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

    const handleValidate = async () => {
        try {
            // 1. Basic Input Validation
            if (!userAddress) {
                Alert.alert('Error', 'Please insert the student address');
                return;
            }
            if (!content && !certificateLink) {
                Alert.alert('Error', 'Please upload a certificate or insert a URL');
                return;
            }

            // 2. Blockchain Connection
            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);
            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);

            // 3. Identity Check
            const userIdentity = await getIdentity(userAddress, identityFactory, signer);
            if (!userIdentity) {
                Alert.alert('Error', 'User identity not found on blockchain');
                return;
            }

            // 4. Certificate Check
            const certificates = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.CERTIFICATE);
            if (!certificates || certificates.length === 0) {
                Alert.alert('Error', 'No certificates found for this student');
                return;
            }

            // 5. Hash Comparison (Simplified Loop)
            const targetHash = certificateLink ? hash(certificateLink) : hash(content);

            const isValid = certificates.some(cert => cert.uri === targetHash);

            setValid(isValid);
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
            setCertificateLink(name); // Display filename in the input
        } catch (err) {
            console.log('Picker Error:', err);
        }
    };

    const handleImportOwnWallet = async () => {
        const userWallet = await getValueFor('wallet');
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
                                onChange={setCertificateLink}
                                outSideIconComponent={
                                    <IconButton
                                        icon="file-upload"
                                        iconColor="black"
                                        size={24}
                                        onPress={handleDocumentPicker}
                                    />
                                }
                            />

                            <Text style={styles.or}>OR</Text>

                            <ActionButton
                                text="Scan QR Code"
                                buttonStyle={styles.qrButton}
                                textStyle={styles.qrButtonText}
                                mode={'elevated'}
                                color={colors.backgroundColor}
                                onPress={() => FeatureUnderDev && FeatureUnderDev()}
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

            <ValidatedModal visible={showModal} onDismiss={() => setShowModal(false)} valid={valid} />
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
    or: {
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
        fontFamily: 'Poppins-ExtraBold',
        fontSize: 24,
    },
    qrButton: {
        marginTop: 16,
        borderRadius: 10,
        borderWidth: 4,
        borderColor: colors.white,
    },
    qrButtonText: {
        fontSize: 24,
        lineHeight: 35,
        color: colors.black,
        fontFamily: 'Poppins-ExtraBold',
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
