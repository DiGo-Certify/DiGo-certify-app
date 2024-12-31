import { View, Text, StyleSheet, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import Images from '@/constants/images';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import colors from '@/constants/colors';
import Background from '@/components/Background';
import HeaderImage from '@/components/HeaderImage';
import ValidatedModal from '@/components/ValidatedModal';
import FeatureUnderDev from '@/components/FeatureUnderDev';
import { CLAIM_TOPICS_OBJ } from '@/services/ethereum/scripts/claims/claimTopics';
import { getContractAt } from '@/services/ethereum/scripts/utils/ethers';
import config from '@/config.json';
import { getIdentity } from '@/services/ethereum/scripts/identities/getIdentity';
import hash from '@/services/ethereum/scripts/utils/encryption/hash';
import { getClaimsByTopic } from '@/services/ethereum/scripts/claims/getClaimsByTopic';
import { useRpcProvider } from '@/services/ethereum/scripts/utils/useRpcProvider';
import { IconButton } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getValueFor } from '@/services/storage/storage';
// import QRCodeScanner from 'react-native-qrcode-scanner';

const Validation = () => {
    const [valid, setValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [certificateLink, setCertificateLink] = useState('');
    const [content, setContent] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

    const handleQRCodeScan = event => {
        // Process the scanned QR code (event.data) as needed
        console.log('Scanned QR code:', event.data);
        setCertificateLink(event.data);
    };

    useEffect(() => {
        const isUserAuthenticated = async () => {
            const userWallet = await getValueFor('wallet');
            console.log(userWallet);
            userWallet.address ? setIsUserAuthenticated(true) : setIsUserAuthenticated(false);
        };
        isUserAuthenticated();
    }, []);

    // If the input of link is empty, clean the content
    useEffect(() => {
        if (!certificateLink) {
            setContent('');
        }
    }, [certificateLink]);

    const handleValidate = async () => {
        // Validate the claiom that has the link to the certificate (claimTopic CERTIFICATE)
        // If the claim is valid, and hash of the certificate is the same as the hash of the certificate in the claim uri field, setValid(true)
        // Otherwise, setValid(false)
        try {
            if (!userAddress || !certificateLink) {
                Alert.alert('Error', 'Please fill in all fields');
                return;
            } else if (!content && !certificateLink) {
                Alert.alert('Error', 'Please upload a certificate or insert a URL');
                return;
            }
            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);

            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            console.log(userAddress);
            const userIdentity = await getIdentity(userAddress, identityFactory, signer);
            if (userIdentity) {
                const certificates = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.CERTIFICATE);
                console.log('Certificates:', certificates);
                if (certificates.length === 0) {
                    Alert.alert('Error', 'No certificates found');
                    return;
                }
                let valid = false;
                for (const certificate of certificates) {
                    const claimUri = certificate.uri;
                    if (claimUri === hash(certificateLink) || claimUri === hash(content)) {
                        setValid(true);
                        valid = true;
                        break;
                    }
                }
                if (!valid) {
                    setValid(false);
                }
                setShowModal(true);
            } else {
                Alert.alert('Error', 'User identity not found');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleDocumentPicker = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });
        if (result) {
            const { uri, name } = result.assets[0];
            const fileContents = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            setContent(fileContents);
            setCertificateLink(name);
            onChange(result.uri);
        }
    };

    const handleImportOwnWallet = async () => {
        const userWallet = await getValueFor('wallet');
        if (userWallet) {
            setUserAddress(userWallet.address);
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
                        <View style={{ marginTop: 16 }}>
                            <FormField
                                label="Insert Student Address"
                                icon="account"
                                value={userAddress}
                                onChange={address => setUserAddress(address)}
                                outSideIconComponent={
                                    <IconButton
                                        icon={isUserAuthenticated ? 'account-plus' : ''}
                                        color="black"
                                        size={20}
                                        onPress={handleImportOwnWallet}
                                    />
                                }
                            />
                            <FormField
                                label="Insert Certificate Link"
                                icon="certificate"
                                value={certificateLink}
                                onChange={link => setCertificateLink(link)}
                                outSideIconComponent={
                                    <IconButton
                                        icon="file-upload"
                                        color="black"
                                        size={20}
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
                                onPress={() => FeatureUnderDev()}
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
    },
    title: {
        fontSize: 30,
        fontFamily: 'Poppins-ExtraBold',
    },
    or: {
        textAlign: 'center',
        marginTop: 16,
        fontFamily: 'Poppins-ExtraBold',
        fontSize: 24,
    },
    qrButton: {
        marginTop: 24,
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
        marginTop: -25,
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
