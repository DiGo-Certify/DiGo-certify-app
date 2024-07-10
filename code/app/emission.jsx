import { View, Text, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Appbar, Title } from 'react-native-paper';
import { router } from 'expo-router';
import Images from '@/constants/images';
import Colors from '@/constants/colors';
import ActionButton from '@/components/ActionButton';
import HeaderImage from '@/components/HeaderImage';
import FormField from '@/components/FormField';
import Background from '@/components/Background';
import addClaim from '@/services/ethereum/scripts/claims/add-claim';
import config from '@/config.json';
import { ethers } from 'ethers';
import { useRpcProvider } from '@/services/ethereum/scripts/utils/useRpcProvider';
import getIdentity from '@/services/ethereum/scripts/identities/getIdentity';
import { getValueFor } from '@/services/storage/storage';
import searchInstitution from '@/services/ethereum/scripts/utils/searchInstitution';
import { CLAIM_TOPICS_OBJ } from '@/services/ethereum/scripts/claims/claimTopics';

const Emission = () => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        registrationCode: '',
        courseID: '',
        institutionID: '',
        walletAddr: '',
        certificateUri: '',
    });

    const handleEmit = async () => {
        setSubmitting(true);
        if (!form.registrationCode || !form.courseID || !form.institutionID || !form.walletAddr) {
            Alert.alert('Warning', 'Please fill the required fields.');
            return;
        }

        const signer = useRpcProvider(config.rpc, config.deployer.privateKey);

        // Get the identity of the student
        const identityFactory = new ethers.Contract(config.identityFactory.address, config.identityFactory.abi, signer);
        const identity = await getIdentity(form.walletAddr, identityFactory);
        if (!identity) {
            Alert.alert('Warning', 'Identity not found.');
            setSubmitting(false);
            return;
        }

        // Check if the logged wallet is an admin
        const walletAddr = await getValueFor('wallet_address');
        const institution = searchInstitution(walletAddr.address);
        if (institution.wallet.address === undefined) {
            setSubmitting(false);
            Alert.alert('Warning', 'You are not allowed to emit certificates.');
            return;
        }

        const claimIssuerContract = new ethers.Contract(institution.address, institution.abi, signer);

        // Get the trusted issuers registry contract
        const trustedIR = new ethers.Contract(
            config.trex.trustedIssuersRegistry.address,
            config.trex.trustedIssuersRegistry.abi,
            signer
        );

        const claimIssuerWallet = new ethers.Wallet(institution.wallet.privateKey, signer.provider);

        // Add claims
        await addClaim(
            trustedIR,
            identity,
            claimIssuerContract,
            claimIssuerWallet,
            CLAIM_TOPICS_OBJ.INSTITUTION,
            form.courseID
        ); // Course ID
        await addClaim(
            trustedIR,
            identity,
            claimIssuerContract,
            claimIssuerWallet,
            CLAIM_TOPICS_OBJ.INSTITUTION,
            form.institutionID
        ); // Institution ID
        await addClaim(
            trustedIR,
            identity,
            claimIssuerContract,
            claimIssuerWallet,
            CLAIM_TOPICS_OBJ.CERTIFICATE,
            form.registrationCode
        ); // Registration Code
        await addClaim(
            trustedIR,
            identity,
            claimIssuerContract,
            claimIssuerWallet,
            CLAIM_TOPICS_OBJ.CERTIFICATE,
            form.certificateUri
        ); // Certificate URI
        setSubmitting(false);
    };

    const handleUpload = () => {
        // Upload certificate
    };

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.topHeader}>
                        <Appbar.BackAction onPress={() => router.back()} />
                        <Appbar.Content title="Certificate Emission" titleStyle={{ fontFamily: 'Poppins-SemiBold' }} />
                    </Appbar.Header>
                    <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
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
                            label="Institution ID*"
                            icon="book"
                            onChange={text => setForm({ ...form, institutionID: text })}
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
                        <ActionButton
                            text="Upload Certificate"
                            mode="contained"
                            icon={'file-upload'}
                            onPress={handleUpload}
                            color={Colors.green}
                            buttonStyle={styles.upload}
                            isLoading={isSubmitting}
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
                    />
                </View>
            }
        />
    );
};

export default Emission;

const styles = StyleSheet.create({
    topHeader: {
        widht: '100%',
        backgroundColor: Colors.solitudeGrey,
    },
    header: { flex: 1, width: '100%', justifyContent: 'center', marginBottom: 20 },
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
        justifyContent: 'center',
        paddingBottom: 20,
        marginBottom: 20,
    },
    title: {
        paddingTop: 5,
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
