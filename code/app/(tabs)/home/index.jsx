import React, { useReducer, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Appbar, Searchbar, ActivityIndicator, Text, Surface } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { ethers } from 'ethers';

// UI Components
import Background from '@/components/Background';
import Colors from '@/constants/colors';
import PrivateKeyModal from './components/privateKeyModal';
import PasswordModal from './components/certificateModal';
import CertificateCard from './components/CertificateCard';
import EmptyState from './components/EmptyState';

import * as SecureStore from 'expo-secure-store';
import { authorizeAccreditedIssuersForWallet, getCertificatesForWallet } from '@/services/blockchain';
import { STORAGE_KEYS } from '@/constants/app';

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

    const [privateKey, setPrivateKey] = useState('');
    const [selectedCertificate, setSelectedCertificate] = useState(null);

    const fetchCertificates = useCallback(async () => {
        dispatch({ type: ACTIONS.SET_LOADING, value: true });
        try {
            const storedWallet = await SecureStore.getItemAsync(STORAGE_KEYS.WALLET);
            const walletData = storedWallet ? JSON.parse(storedWallet) : null;
            const userAddress = walletData?.address;

            if (!userAddress) {
                dispatch({ type: ACTIONS.SET_CERTIFICATES, payload: [] });
                return;
            }

            const certificates = await getCertificatesForWallet(userAddress);
            dispatch({ type: ACTIONS.SET_CERTIFICATES, payload: certificates });
        } catch (error) {
            if (error.message?.includes('Identity not found')) {
                dispatch({ type: ACTIONS.SET_CERTIFICATES, payload: [] });
                return;
            }
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

    const handleActivateIdentity = async () => {
        try {
            const wallet = new ethers.Wallet(privateKey.trim());
            const walletData = { address: wallet.address, privateKey: privateKey.trim() };
            await SecureStore.setItemAsync(STORAGE_KEYS.WALLET, JSON.stringify(walletData));
            await authorizeAccreditedIssuersForWallet(walletData);
            setPrivateKey('');
            toggleModal('privateKey', false);
            Alert.alert('Identity Ready', 'Your identity is active and accredited issuers can write certificate claims.');
            fetchCertificates();
        } catch (error) {
            Alert.alert('Identity Setup Failed', error.message);
        }
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

                    <PrivateKeyModal
                        visible={state.modals.privateKey}
                        onDismiss={() => toggleModal('privateKey', false)}
                        privateKey={privateKey}
                        onChangePrivateKey={setPrivateKey}
                        onSubmitPrivateKey={handleActivateIdentity}
                    />
                    <PasswordModal
                        visible={state.modals.certificate}
                        onDismiss={() => toggleModal('certificate', false)}
                        encryptedURI={selectedCertificate?.encryptedReference || ''}
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
});

export default HomeScreen;
