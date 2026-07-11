// Custom hook for certificate emission
import { useReducer, useCallback } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { issueCertificate } from '@/services/blockchain';
import { STORAGE_KEYS } from '@/constants/app';

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

            const storedWallet = await SecureStore.getItemAsync(STORAGE_KEYS.WALLET);
            const issuerWallet = storedWallet ? JSON.parse(storedWallet) : null;
            const certificateReference = state.fileInfo?.fileContents || state.form.certificateUri;
            const certificate = {
                issuerWallet,
                receiverWalletAddress: state.form.walletAddr,
                registrationCode: state.form.registrationCode,
                courseID: state.form.courseID,
                grade: state.form.grade,
                certificateReference,
                password: state.form.password,
            };

            await issueCertificate(certificate);

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
