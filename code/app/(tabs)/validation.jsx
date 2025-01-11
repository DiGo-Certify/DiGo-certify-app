import { View, Text, StyleSheet, Alert } from 'react-native';
import React, { useEffect, useReducer } from 'react';
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

const ACTIONS = {
    EDIT: 'edit',
    SUBMIT: 'submit',
    ERROR: 'error',
    SUCCESS: 'success',
};

const STATES = {
    LOADING: 'loading',
    EDITING: 'editing',
    SUBMITTING: 'submitting',
    EVALUATE: 'evaluate',
};

function reduce(state, action) {
    switch (state.tag) {
        case STATES.LOADING:
            if (action.type === ACTIONS.EDIT) {
                return {
                    tag: STATES.EDITING,
                    inputs: {
                        ...state.inputs,
                        [action.inputName]: action.inputValue,
                    },
                    isUserAuthenticated: action.isUserAuthenticated,
                };
            } else {
                logUnexpectedAction(state, action);
                return state;
            }

        case STATES.EDITING:
            if (action.type === ACTIONS.EDIT) {
                return {
                    ...state,
                    error: undefined,
                    inputs: {
                        ...state.inputs,
                        [action.inputName]: action.inputValue,
                    },
                };
            } else if (action.type === ACTIONS.SUBMIT) {
                return { ...state, tag: STATES.SUBMITTING, error: '' };
            } else {
                logUnexpectedAction(state, action);
                return state;
            }

        case STATES.SUBMITTING:
            if (action.type === ACTIONS.ERROR) {
                return {
                    ...state,
                    tag: STATES.EDITING,
                    error: action.message,
                    inputs: { ...state.inputs, password: '' },
                };
            } else if (action.type === ACTIONS.SUCCESS) {
                return { ...state, tag: STATES.EVALUATE, valid: state.valid };
            } else {
                logUnexpectedAction(state, action);
                return state;
            }

        case STATES.EVALUATE:
            logUnexpectedAction(state, action);
            return state;
    }
}

function logUnexpectedAction(state, action) {
    console.log(`Unexpected action '${action.type} on state '${state.tag}'`);
}

const firstState = {
    tag: STATES.LOADING,
    inputs: {
        certificateLink: '',
        userAdress: '',
    },
    error: '',
};

const Validation = () => {
    const [state, dispatch] = useReducer(reduce, firstState);

    useEffect(() => {
        if (state.tag === STATES.LOADING) {
            const isUserAuthenticated = async () => {
                const userWallet = await getValueFor('wallet');
                dispatch({
                    type: ACTIONS.EDIT,
                    inputName: 'userAddress',
                    inputValue: '0x',
                    isUserAuthenticated: !!userWallet,
                });
            };
            isUserAuthenticated();
        }
    }, [state.tag]);

    useEffect(() => {
        if (state.tag === STATES.EDITING && state.error) {
            Alert.alert('Error', state.error, [{ text: 'OK', onPress: () => dispatch({ type: ACTIONS.EDIT }) }]);
        }
    }, [state.error]);

    // HANDLERS

    const handleValidate = async () => {
        if (state.tag !== STATES.EDITING) {
            return;
        }
        dispatch({ type: ACTIONS.SUBMIT });
        const { userAddress, certificateLink } = state.inputs;

        if (!userAddress || userAddress === '0x') {
            return dispatch({ type: ACTIONS.ERROR, message: 'User address is required' });
        }
        if (!certificateLink) {
            return dispatch({ type: ACTIONS.ERROR, message: 'Certificate link is required' });
        }

        try {
            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);
            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            const userIdentity = await getIdentity(userAddress, identityFactory, signer);

            if (!userIdentity) {
                return dispatch({ type: ACTIONS.ERROR, message: 'User identity not found' });
            }

            const certificates = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.CERTIFICATE);

            if (certificates.length === 0) {
                return dispatch({ type: ACTIONS.ERROR, message: 'No certificates found' });
            }

            const isValidCertificate = certificates.some(certificate => certificate.uri === hash(certificateLink));

            dispatch({ type: ACTIONS.SUCCESS, valid: isValidCertificate });
        } catch (error) {
            dispatch({ type: ACTIONS.ERROR, message: error.message });
        }
    };

    const handleDocumentPicker = async () => {
        if (state.tag !== STATES.EDITING) {
            return;
        }
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });
        if (result) {
            const { uri, name } = result.assets[0];
            const fileContents = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            dispatch({
                type: ACTIONS.EDIT,
                inputs: {
                    ...state.inputs,
                    content: fileContents,
                    certificateLink: name,
                },
            });
        }
    };

    const handleImportOwnWallet = async () => {
        const userWallet = await getValueFor('wallet');
        if (userWallet) {
            dispatch({ type: ACTIONS.EDIT, inputName: 'userAddress', inputValue: userWallet.address });
        }
    };

    const handleChange = (name, value) => {
        dispatch({ type: ACTIONS.EDIT, inputName: name, inputValue: value });
    };

    const userAdress = state.tag === STATES.EDITING ? state.inputs.userAddress : '';
    const certificateLink = state.tag === STATES.EDITING ? state.inputs.certificateLink : '';
    const valid = state.tag === STATES.EVALUATE ? state.valid : false;
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
                                value={userAdress}
                                onChange={address => handleChange('userAddress', address)}
                                outSideIconComponent={
                                    <IconButton
                                        icon={state.isUserAuthenticated ? 'account-plus' : ''}
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
                                onChange={link => handleChange('certificateLink', link)}
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
            <ValidatedModal
                visible={state.tag === STATES.EVALUATE}
                onDismiss={() => dispatch({ type: ACTIONS.EDIT })}
                valid={valid}
            />
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
