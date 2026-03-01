import React, { useReducer, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Appbar, Searchbar, ActivityIndicator, FAB, Text, Surface } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

// UI Components
import Background from '@/components/Background';
import Colors from '@/constants/colors';
import CertificateFormModal from './components/certificateFormModal';
import PrivateKeyModal from './components/privateKeyModal';
import PasswordModal from './components/certificateModal';
import CertificateCard from './components/CertificateCard';
import EmptyState from './components/EmptyState';

import config from '@/config.json';
import { getContractAt } from '@/services/ethereum/scripts/utils/ethers';
import { useRpcProvider } from '@/services/ethereum/scripts/utils/useRpcProvider';
import { getIdentity } from '@/services/ethereum/scripts/identities/getIdentity';
import { getClaimsByTopic } from '@/services/ethereum/scripts/claims/getClaimsByTopic';
import { CLAIM_TOPICS_OBJ } from '@/services/ethereum/scripts/claims/claimTopics';
import { getValueFor } from '@/services/storage/storage';

const USE_MOCK_DATA = false;
const MOCK_CERTIFICATES = [
    {
        id: 1,
        title: 'BSc Computer Science',
        registrationCode: '2024-CS-001',
        issuer: 'University of Lisbon',
        date: 'May 20, 2024',
        grade: 'Licenciado',
    },
    {
        id: 2,
        title: 'Master in Blockchain Engineering',
        registrationCode: '2026-BC-102',
        issuer: 'Técnico Lisboa',
        date: 'July 15, 2026',
        grade: 'Mestre',
    },
    {
        id: 3,
        title: 'Advanced Cryptography',
        registrationCode: 'CRT-882',
        issuer: 'MIT Online',
        date: 'Aug 10, 2025',
        grade: 'Certificate',
    },
];

// Action types
const ACTIONS = {
    SET_SEARCH: 'SET_SEARCH',
    SET_CERTIFICATES: 'SET_CERTIFICATES',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    TOGGLE_MODAL: 'TOGGLE_MODAL',
};

const initialState = {
    searchQuery: '',
    certificates: [],
    isLoading: false,
    error: null,
    modals: {
        certificateForm: false,
        privateKey: false,
        certificate: false,
    },
};

function reducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_SEARCH:
            return { ...state, searchQuery: action.payload };
        case ACTIONS.SET_CERTIFICATES:
            return { ...state, certificates: action.payload, isLoading: false };
        case ACTIONS.SET_LOADING:
            return { ...state, isLoading: action.value };
        case ACTIONS.SET_ERROR:
            return { ...state, error: action.payload, isLoading: false };
        case ACTIONS.TOGGLE_MODAL:
            return {
                ...state,
                modals: {
                    ...state.modals,
                    [action.modalName]: action.value,
                },
            };
        default:
            return state;
    }
}

const HomeScreen = () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Form Inputs
    const [form, setForm] = useState({ name: '', studentNumber: '', institutionCode: '' });
    const [privateKey, setPrivateKey] = useState('');
    const [selectedCertificate, setSelectedCertificate] = useState(null);

    const fetchCertificates = useCallback(async () => {
        dispatch({ type: ACTIONS.SET_LOADING, value: true });
        try {
            if (USE_MOCK_DATA) {
                setTimeout(() => {
                    dispatch({ type: ACTIONS.SET_CERTIFICATES, payload: MOCK_CERTIFICATES });
                }, 1000); // Fake delay
                return;
            }

            // 1. Get User Address
            const walletData = await getValueFor('wallet');
            if (!walletData) {
                dispatch({ type: ACTIONS.SET_CERTIFICATES, payload: [] });
                return;
            }

            let userAddress = walletData?.address;

            // Handle if stored as JSON string
            if (!userAddress && typeof walletData === 'string') {
                try {
                    const parsed = JSON.parse(walletData);
                    userAddress = parsed.address;
                } catch (e) {
                    console.log('Error parsing wallet data');
                }
            }

            if (!userAddress) {
                console.log('No wallet address found.');
                dispatch({ type: ACTIONS.SET_CERTIFICATES, payload: [] });
                return;
            }

            // 2. Setup Provider & Signer (Using Read-Only or Deployer for fetching)
            // We use the deployer key just to get read access to the blockchain quickly
            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);

            // 3. Get Identity Contract
            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            const userIdentity = await getIdentity(userAddress, identityFactory, signer);

            if (!userIdentity) {
                console.log('Identity not deployed yet for:', userAddress);
                dispatch({ type: ACTIONS.SET_CERTIFICATES, payload: [] });
                return;
            }

            // 4. Get Claims (Certificates)
            console.log('Fetching certificates for identity:', userIdentity.address);
            const claims = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.CERTIFICATE);

            // 5. Format Data for UI
            const formattedCertificates = claims.map((claim, index) => ({
                id: claim.claimId || index,
                title: claim.title || `Certificate #${index + 1}`, // Fallback title
                uri: claim.uri, // This is the Encrypted URI
                issuer: claim.issuer,
                data: claim.data,
            }));

            dispatch({ type: ACTIONS.SET_CERTIFICATES, payload: formattedCertificates });
        } catch (error) {
            console.error('Fetch Error:', error);
            dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        } finally {
            dispatch({ type: ACTIONS.SET_LOADING, value: false });
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCertificates();
        }, [fetchCertificates])
    );

    // --- Handlers ---

    const toggleModal = (modalName, value) => {
        dispatch({ type: ACTIONS.TOGGLE_MODAL, modalName, value });
    };

    const filteredCertificates = state.certificates.filter(cert =>
        (cert.title || '').toLowerCase().includes(state.searchQuery.toLowerCase())
    );

    return (
        <Background
            noScroll={true}
            header={
                <Surface style={styles.headerContainer} elevation={0}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.welcomeText}>Welcome back,</Text>
                            <Text style={styles.headerTitle}>My Certificates</Text>
                        </View>
                        <Appbar.Action
                            icon="key-plus"
                            style={{ backgroundColor: Colors.green }}
                            color={Colors.black}
                            onPress={() => toggleModal('privateKey', true)}
                        />
                    </View>

                    <Searchbar
                        placeholder="Search your credentials..."
                        onChangeText={q => dispatch({ type: ACTIONS.SET_SEARCH, payload: q })}
                        value={state.searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        iconColor={Colors.gray}
                        placeholderTextColor={Colors.gray}
                    />
                </Surface>
            }
            body={
                <View style={styles.bodyContainer}>
                    {state.isLoading ? (
                        <View style={styles.centerState}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredCertificates}
                            renderItem={({ item }) => (
                                <CertificateCard
                                    certificate={item}
                                    onPress={() => {
                                        setSelectedCertificate(item);
                                        toggleModal('certificate', true);
                                    }}
                                />
                            )}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <EmptyState
                                    title="No Certificates"
                                    message="You haven't received any digital credentials yet."
                                />
                            }
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={state.isLoading} onRefresh={fetchCertificates} />
                            }
                        />
                    )}

                    <FAB
                        style={styles.fab}
                        icon="plus"
                        color="black"
                        label=""
                        uppercase={false}
                        onPress={() => toggleModal('certificateForm', true)}
                    />

                    {/* MODALS */}
                    <CertificateFormModal
                        visible={state.modals.certificateForm}
                        onDismiss={() => toggleModal('certificateForm', false)}
                        formData={form}
                        onChangeForm={(name, val) => setForm(p => ({ ...p, [name]: val }))}
                        onPress={() => {
                            Alert.alert('Sent', 'Certificate request simulated!');
                            toggleModal('certificateForm', false);
                        }}
                        isSubmitting={false}
                    />
                    <PrivateKeyModal
                        visible={state.modals.privateKey}
                        onDismiss={() => toggleModal('privateKey', false)}
                        privateKey={privateKey}
                        onChangePrivateKey={setPrivateKey}
                        onSubmitPrivateKey={() => toggleModal('privateKey', false)}
                    />
                    <PasswordModal
                        visible={state.modals.certificate}
                        onDismiss={() => toggleModal('certificate', false)}
                        encryptedURI={selectedCertificate?.uri || ''}
                    />
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        width: '90%',
        backgroundColor: Colors.background,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    welcomeText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: Colors.black,
    },
    headerTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 26,
        color: Colors.black,
        lineHeight: 32,
    },
    searchBar: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        elevation: 0,
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    searchInput: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        alignSelf: 'center',
    },
    bodyContainer: {
        flex: 1,
        width: '100%',
    },
    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.primary,
    },
});

export default HomeScreen;
