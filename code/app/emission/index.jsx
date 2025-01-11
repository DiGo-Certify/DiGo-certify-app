import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import React, { useEffect, useReducer, useState } from 'react';
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
import { encrypt } from '@/services/ethereum/scripts/utils/encryption/aes-256';

const ACTIONS = {
    EDIT: 'EDIT',
    UPLOAD: 'UPLOAD',
    SUBMIT: 'SUBMIT',
    ERROR: 'ERROR',
    SUCCESS: 'SUCCESS',
};

const STATES = {
    EDITING: 'EDITING',
    UPLOADING: 'UPLOADING',
    SUBMITTING: 'SUBMITTING',
    NOTIFYING: 'NOTIFYING',
};

function reduce(state, action) {
    switch (state.tag) {
        case STATES.EDITING:
            if (action.type === ACTIONS.EDIT) {
                return {
                    ...state,
                    error: action.message,
                    inputs: {
                        ...state.inputs,
                        [action.inputName]: action.inputValue,
                    },
                };
            } else if (action.type === ACTIONS.UPLOAD) {
                return { ...state, tag: STATES.UPLOADING };
            } else if (action.type === ACTIONS.SUBMIT) {
                return { ...state, tag: STATES.SUBMITTING };
            } else {
                logUnexpectedAction(state, action);
                return state;
            }
        case STATES.UPLOADING:
            if (action.type === ACTIONS.ERROR) {
                return { ...state, tag: STATES.EDITING, error: action.message, title: action.title };
            } else if (action.type === ACTIONS.SUCCESS) {
                return { ...state, tag: STATES.EDITING, file: action.file };
            } else {
                logUnexpectedAction(state, action);
                return state;
            }
        case STATES.SUBMITTING:
            if (action.type === ACTIONS.ERROR) {
                return { ...state, tag: STATES.EDITING, error: action.message };
            } else if (action.type === ACTIONS.SUCCESS) {
                return { ...state, tag: STATES.NOTIFYING };
            } else {
                logUnexpectedAction(state, action);
                return state;
            }
        case STATES.NOTIFYING:
            logUnexpectedAction(state, action);
            return state;
    }
}

function logUnexpectedAction(state, action) {
    console.log('Unexpected action', action, 'for state', state);
}

const firstState = {
    tag: STATES.EDITING,
    inputs: {
        registrationCode: '',
        courseID: '',
        grade: '',
        walletAddr: '',
        certificateUri: '',
        password: '',
    },
    file: null,
};

function Emission() {
    const [state, dispatch] = useReducer(reduce, firstState);

    console.log('state:', state);

    useEffect(() => {
        if (state.tag === STATES.NOTIFYING) {
            Alert.alert('Success', 'Certificate emitted successfully', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        }
        if (state.error) {
            Alert.alert(state.title || 'Error', state.error, [
                { text: 'OK', onPress: () => dispatch({ type: ACTIONS.EDIT, message: undefined }) },
            ]);
        }
    }, [state.tag, state.error]);

    const handleEmit = async () => {
        try {
            if (state.tag !== STATES.EDITING) {
                return;
            }

            dispatch({ type: ACTIONS.SUBMIT });
            const { inputs, file } = state;
            // Form validation
            const isAllFieldsFilled = Object.values(inputs).every(value => value !== '');
            if (!isAllFieldsFilled) {
                return dispatch({ type: ACTIONS.ERROR, message: 'Please fill all required fields' });
            } else if (isNaN(inputs.courseID) || isNaN(inputs.registrationCode)) {
                return dispatch({ type: ACTIONS.ERROR, message: 'Course ID and Institution ID must be numbers.' });
            } else if (!inputs.walletAddr.startsWith('0x')) {
                return dispatch({
                    type: ACTIONS.ERROR,
                    message: 'Invalid wallet address, must start with 0x.',
                    title: 'Warning',
                });
            } else if (!file && !inputs.certificateUri) {
                return dispatch({ type: ACTIONS.ERROR, message: 'Please insert URL or upload the certificate.' });
            }
            const validAdressSize = 42;
            if (inputs.walletAddr.length !== validAdressSize) {
                return dispatch({ type: ACTIONS.ERROR, message: 'Invalid wallet address.' });
            }

            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);

            // Get the identity of the student
            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            const identity = await getIdentity(inputs.walletAddr, identityFactory);
            if (!identity) {
                dispatch({
                    type: ACTIONS.ERROR,
                    title: 'Warning',
                    message: 'Identity not found.',
                });
                return;
            }

            // Check if the logged wallet is an admin
            const walletAddr = await getValueFor('wallet');
            const institution = searchInstitution(walletAddr.address);
            if (institution.wallet.address === undefined) {
                dispatch({
                    type: ACTIONS.ERROR,
                    title: 'Warning',
                    message: 'You are not allowed to emit certificates.',
                });
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
                institutionID: institution.institutionID.toString(),
                courseID: inputs.courseID,
            });
            const certificateClaim = JSON.stringify({
                registrationCode: inputs.registrationCode,
                certificate: inputs.certificateUri
                    ? encrypt(inputs.certificateUri, inputs.password)
                    : 'Certificate hash',
            });

            const certificateClaimUri = inputs.certificateUri ? inputs.certificateUri : fileInfo.fileContents;

            console.log('certificate claim:', certificateClaim);
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
                inputs.grade // Grade (Licenciado, Mestre, Doutor...)
            );

            await addClaim(
                trustedIR,
                identity,
                claimIssuerContract,
                claimIssuerWallet,
                CLAIM_TOPICS_OBJ.CERTIFICATE,
                certificateClaim,
                1,
                certificateClaimUri,
                inputs.password
            );

            dispatch({ type: ACTIONS.SUCCESS });
        } catch (error) {
            console.error('Error emitting certificate:', error);
            dispatch({ type: ACTIONS.ERROR, message: 'Error emitting certificate' });
        }
    };

    function handleChange(name, value) {
        dispatch({ type: ACTIONS.EDIT, inputName: name, inputValue: value });
    }

    //TODO: Refraction this function, very simmillar to the one in the validation screen
    const handleUpload = async () => {
        try {
            if (state.tag !== STATES.EDITING) {
                return;
            }
            dispatch({ type: ACTIONS.UPLOAD });
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return dispatch({ type: ACTIONS.ERROR, message: 'Document picking cancelled' });
            }

            if (result) {
                const { uri, name, size } = result.assets[0];
                const fileContents = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                dispatch({ type: ACTIONS.SUCCESS, file: { uri, name, size, contents: fileContents } });
            }
        } catch (error) {
            console.error('Error picking document:', error);
            dispatch({ type: ACTIONS.ERROR, message: 'Error picking document' });
        }
    };

    const isSubmitting = state.tag === STATES.SUBMITTING;
    const fileInfo = state.tag === STATES.EDITING && state.file ? state.file.name : 'Upload Certificate';
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
                            onChange={text => handleChange('courseID', text)}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Grade*"
                            icon="book"
                            onChange={text => handleChange('grade', text)}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Registration Code*"
                            icon="school"
                            onChange={text => handleChange('registrationCode', text)}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Student Wallet*"
                            icon="wallet"
                            onChange={text => handleChange('walletAddr', text)}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Certificate URL"
                            icon="file"
                            onChange={text => handleChange('certificateUri', text)}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Password"
                            icon="lock"
                            onChange={text => handleChange('password', text)}
                            style={styles.inputField}
                            secure={true}
                        />
                        <ActionButton
                            text={fileInfo}
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
}

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
        marginTop: -20,
        marginBottom: 40,
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
