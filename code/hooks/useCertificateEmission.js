// Custom hook for certificate emission
import { useReducer, useCallback } from 'react';
import { Alert } from 'react-native';
import { getValueFor } from '@/services/storage/storage';
import { addClaim } from '@/services/ethereum/scripts/claims/add-claim';
import { getContractAt, getWallet } from '@/services/ethereum/scripts/utils/ethers';
import { getIdentity } from '@/services/ethereum/scripts/identities/getIdentity';
import { useRpcProvider } from '@/services/ethereum/scripts/utils/useRpcProvider';
import { CLAIM_TOPICS_OBJ } from '@/services/ethereum/scripts/claims/claimTopics';
import searchInstitution from '@/services/ethereum/scripts/utils/searchInstitution';
import { encrypt } from '@/services/ethereum/scripts/utils/encryption/aes-256';
import { ethers } from 'ethers';
import config from '@/config.json';

const ACTIONS = {
    SET_FIELD: 'SET_FIELD',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_FILE: 'SET_FILE',
    RESET: 'RESET',
};

const initialState = {
    form: {
        registrationCode: '',
        courseID: '',
        grade: '',
        walletAddr: '',
        certificateUri: '',
        password: '',
    },
    fileInfo: null,
    isLoading: false,
    error: null,
};

function emissionReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_FIELD:
            return {
                ...state,
                form: {
                    ...state.form,
                    [action.field]: action.value,
                },
                error: null,
            };
        case ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
            };
        case ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            };
        case ACTIONS.SET_FILE:
            return {
                ...state,
                fileInfo: action.payload,
            };
        case ACTIONS.RESET:
            return initialState;
        default:
            return state;
    }
}

// Validation functions
const validateForm = (form, fileInfo) => {
    if (!form.registrationCode || !form.courseID || !form.grade || !form.walletAddr) {
        throw new Error('Please fill in all required fields.');
    }

    if (isNaN(form.courseID) || isNaN(form.registrationCode)) {
        throw new Error('Course ID and Registration Code must be numbers.');
    }

    if (!form.walletAddr.startsWith('0x')) {
        throw new Error('Wallet address must start with 0x');
    }

    if (!form.certificateUri && !fileInfo) {
        throw new Error('Please insert URL or upload the certificate.');
    }
};

export const useCertificateEmission = () => {
    const [state, dispatch] = useReducer(emissionReducer, initialState);

    const setField = useCallback((field, value) => {
        dispatch({ type: ACTIONS.SET_FIELD, field, value });
    }, []);

    const setFile = useCallback(fileInfo => {
        dispatch({ type: ACTIONS.SET_FILE, payload: fileInfo });
    }, []);

    const emitCertificate = useCallback(async () => {
        try {
            dispatch({ type: ACTIONS.SET_LOADING, payload: true });

            // Validate form
            validateForm(state.form, state.fileInfo);

            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);

            // Get the identity of the student
            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);

            const identity = await getIdentity(state.form.walletAddr, identityFactory);

            if (!identity) {
                throw new Error('Identity not found.');
            }

            // Check if the logged wallet is an admin
            const walletAddr = await getValueFor('wallet');
            const institution = searchInstitution(walletAddr.address);

            if (!institution?.wallet?.address) {
                throw new Error('You are not allowed to emit certificates.');
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

            // Prepare claims data
            const institutionClaim = JSON.stringify({
                institutionID: institution.institutionID.toString(),
                courseID: state.form.courseID,
            });

            const certificateClaim = JSON.stringify({
                registrationCode: state.form.registrationCode,
                certificate: state.form.certificateUri
                    ? encrypt(state.form.certificateUri, state.form.password)
                    : 'Certificate hash',
            });

            const certificateClaimUri = state.form.certificateUri || state.fileInfo?.fileContents;

            // Add claims to identity
            await Promise.all([
                addClaim(
                    trustedIR,
                    identity,
                    claimIssuerContract,
                    claimIssuerWallet,
                    CLAIM_TOPICS_OBJ.INSTITUTION,
                    institutionClaim
                ),
                addClaim(
                    trustedIR,
                    identity,
                    claimIssuerContract,
                    claimIssuerWallet,
                    CLAIM_TOPICS_OBJ.STUDENT,
                    state.form.grade
                ),
                addClaim(
                    trustedIR,
                    identity,
                    claimIssuerContract,
                    claimIssuerWallet,
                    CLAIM_TOPICS_OBJ.CERTIFICATE,
                    certificateClaim,
                    1,
                    certificateClaimUri,
                    state.form.password
                ),
            ]);

            dispatch({ type: ACTIONS.SET_LOADING, payload: false });
            Alert.alert('Success', 'Certificate emitted successfully.');
            dispatch({ type: ACTIONS.RESET });

            return true;
        } catch (error) {
            dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
            Alert.alert('Error', error.message);
            return false;
        }
    }, [state.form, state.fileInfo]);

    return {
        ...state,
        setField,
        setFile,
        emitCertificate,
    };
};
