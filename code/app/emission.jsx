import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { Appbar, Title } from 'react-native-paper';
import { router } from 'expo-router';
import Images from '@/constants/images';
import Colors from '@/constants/colors';
import ActionButton from '@/components/ActionButton';
import HeaderImage from '@/components/HeaderImage';
import FormField from '@/components/FormField';
import Background from '@/components/Background';
import { addClaim } from '@/services/ethereum/scripts/claims/add-claim';
import config from '@/config.json';
import { useRpcProvider } from '@/services/ethereum/scripts/utils/useRpcProvider';
import { getIdentity } from '@/services/ethereum/scripts/identities/getIdentity';
import { getValueFor } from '@/services/storage/storage';
import searchInstitution from '@/services/ethereum/scripts/utils/searchInstitution';
import { CLAIM_TOPICS_OBJ } from '@/services/ethereum/scripts/claims/claimTopics';
import { getContractAt, getWallet } from '@/services/ethereum/scripts/utils/ethers';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ethers } from 'ethers';
import hash from '@/services/ethereum/scripts/utils/encryption/hash';
import { encrypt } from '@/services/ethereum/scripts/utils/encryption/aes-256';

const Emission = () => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [fileInfo, setFileInfo] = useState(null);
    const [fileHash, setFileHash] = useState(null);
    const [form, setForm] = useState({
        registrationCode: '',
        courseID: '',
        grade: '',
        walletAddr: '',
        certificateUri: '',
        password: '',
    });

    const handleEmit = async () => {
        try {
            setSubmitting(true);
            const formValidations = (form, setForm) => {
                if (!form.registrationCode || !form.courseID || !form.grade || !form.walletAddr) {
                    throw new Error('Please fill the required fields.');
                } else if (!form.certificateUri && !form.password) {
                    throw new Error('Please fill the certificate URL or the password.');
                } else if (isNaN(form.courseID) || isNaN(form.registrationCode)) {
                    throw new Error('Course ID and Institution ID must be numbers.');
                } else if (!form.walletAddr.startsWith('0x')) {
                    setForm({ ...form, walletAddr: '0x' + form.walletAddr });
                    return;
                } else if (!form.certificateUri && !fileInfo) {
                    throw new Error('Please insert URL or upload the certificate.');
                }
            };
            formValidations(form, setForm);

            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);

            // Get the identity of the student
            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            const identity = await getIdentity(form.walletAddr, identityFactory);
            if (!identity) {
                Alert.alert('Warning', 'Identity not found.');
                setSubmitting(false);
                return;
            }

            // Check if the logged wallet is an admin
            const walletAddr = await getValueFor('wallet');
            const institution = searchInstitution(walletAddr.address);
            if (institution.wallet.address === undefined) {
                setSubmitting(false);
                Alert.alert('Warning', 'You are not allowed to emit certificates.');
                return;
            }

            const claimIssuerContract = getContractAt(institution.address, institution.abi, signer);

            // Get the trusted issuers registry contract
            const trustedIR = getContractAt(
                config.trex.trustedIssuersRegistry.address,
                config.trex.trustedIssuersRegistry.abi,
                signer
            );

            const provider = new ethers.JsonRpcProvider(config.rpc);
            const claimIssuerWallet = getWallet(institution.wallet.privateKey, provider);

            const institutionClaim = JSON.stringify({
                institutionID: institution.institutionID,
                courseID: form.courseID,
            }).toString();
            const certificateClaim = JSON.stringify({
                registrationCode: form.registrationCode,
                certificate: fileHash ? fileHash : encrypt(form.certificateUri, form.password),
            }).toString();

            const claimUri = !fileInfo ? hash(form.certificateUri) : hash(fileInfo.fileContents);

            // Claim institution (Institution ID, Course ID)
            await addClaim(
                trustedIR,
                identity,
                claimIssuerContract,
                claimIssuerWallet,
                CLAIM_TOPICS_OBJ.INSTITUTION,
                institutionClaim
            );

            // Claim student (Grade)
            await addClaim(
                trustedIR,
                identity,
                claimIssuerContract,
                claimIssuerWallet,
                CLAIM_TOPICS_OBJ.STUDENT,
                form.grade      // Grade (Licenciado, Mestre, Doutor...)
            );

            // Claim certificate (Registration Code, Certificate)
            await addClaim(
                trustedIR,
                identity,
                claimIssuerContract,
                claimIssuerWallet,
                CLAIM_TOPICS_OBJ.CERTIFICATE,
                certificateClaim,
                1,
                claimUri,
                form.password
            );

            Alert.alert('Success', 'Certificate emitted successfully.', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            setSubmitting(false);
            console.error(error);
            Alert.alert('Error', error.message);
        }
    };

    const handleUpload = async () => {
        try {
            console.log('Uploading certificate...');
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result) {
                const { uri, name, size } = result.assets[0];
                const fileContents = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                setFileInfo({ uri, name, size, fileContents });
                const hash = encrypt(fileContents, form.password);
                setFileHash(hash);
            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header>
                        <Appbar.BackAction onPress={() => router.back()} />
                        <Appbar.Content title="Certificate Emission" titleStyle={{ fontFamily: 'Poppins-SemiBold' }} />
                    </Appbar.Header>
                    <View style={{ alignSelf: 'center', marginTop: 16 }}>
                        <HeaderImage imageSource={Images.splashScreenImage} />
                    </View>
                </View>
            }
            body={
                <View style={styles.body}>
                    <Title style={styles.title}>Send Certificate</Title>
                    <ScrollView contentContainerStyle={styles.body}>
                        <FormField
                            label="Course ID*"
                            icon="registered-trademark"
                            onChange={text => setForm({ ...form, courseID: text })}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Grade*"
                            icon="book"
                            onChange={text => setForm({ ...form, grade: text })}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Registration Code*"
                            icon="school"
                            onChange={text => setForm({ ...form, registrationCode: text })}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Student Wallet*"
                            icon="wallet"
                            onChange={text => setForm({ ...form, walletAddr: text })}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Certificate URL"
                            icon="file"
                            onChange={text => setForm({ ...form, certificateUri: text })}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Password"
                            icon="lock"
                            onChange={text => setForm({ ...form, password: text })}
                            style={styles.inputField}
                        />
                        <ActionButton
                            text="Upload Certificate"
                            mode="contained"
                            icon={'file-upload'}
                            onPress={handleUpload}
                            color={Colors.green}
                            buttonStyle={styles.upload}
                            disabled={isSubmitting}
                        />
                    </ScrollView>
                </View>
            }
            footer={
                <View style={styles.footer}>
                    <ActionButton
                        text="Emit Certificate"
                        onPress={handleEmit}
                        buttonStyle={styles.emitButton}
                        textStyle={styles.emitButtonText}
                        isLoading={isSubmitting}
                        mode={'elevated'}
                        color={Colors.backgroundColor}
                        disabled={isSubmitting}
                    />
                </View>
            }
        />
    );
};

export default Emission;

const styles = StyleSheet.create({
    header: {
        width: '100%',
        justifyContent: 'center',
    },
    inputField: {
        justifyContent: 'center',
        marginTop: 20,
        borderRadius: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.sonicSilver,
    },
    emitButton: {
        marginTop: 50,
        borderRadius: 16,
        borderWidth: 4,
        borderColor: Colors.white,
        elevation: 5,
    },
    emitButtonText: {
        fontSize: 30,
        lineHeight: 40,
        fontFamily: 'Poppins-ExtraBold',
        color: Colors.black,
    },
    body: {
        marginTop: -45,
        marginBottom: 20,
    },
    title: {
        paddingTop: 5,
        marginBottom: 20,
        fontSize: 30,
        fontFamily: 'Poppins-ExtraBold',
        color: Colors.black,
    },
    upload: {
        marginTop: 20,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginTop: -86,
        paddingTop: 20,
    },
});
