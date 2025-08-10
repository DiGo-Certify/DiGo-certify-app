// Refactored Home Screen with better organization and error handling
import React, { useReducer, useEffect } from 'react';
import { View, StyleSheet, FlatList, Linking, Alert } from 'react-native';
import { Appbar, Searchbar, ActivityIndicator } from 'react-native-paper';
import Background from '@/components/Background';
import Colors from '@/constants/colors';
import { getValueFor } from '@/services/storage/storage';
import { USER_TYPES, VALIDATION_MESSAGES } from '@/constants/app';
import BlockchainService from '@/services/blockchain/BlockchainService';
import ErrorHandler from '@/services/errors/ErrorHandler';
import CertificateFormModal from './components/certificateFormModal';
import PrivateKeyModal from './components/privateKeyModal';
import PasswordModal from './components/certificateModal';
import CertificateCard from './components/CertificateCard';
import EmptyState from './components/EmptyState';
import { ethers } from 'ethers';

// Action types for reducer
const ACTIONS = {
    SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
    SET_CERTIFICATES: 'SET_CERTIFICATES',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_SUBMITTING: 'SET_SUBMITTING',
    TOGGLE_MODAL: 'TOGGLE_MODAL',
    SET_SELECTED_CERTIFICATE: 'SET_SELECTED_CERTIFICATE',
    ADD_CERTIFICATE: 'ADD_CERTIFICATE',
    CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
    searchQuery: '',
    certificates: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
    modals: {
        certificateForm: false,
        privateKey: false,
        certificate: false,
    },
    selectedCertificate: null,
};

// Reducer function
const homeReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_SEARCH_QUERY:
            return { ...state, searchQuery: action.payload };

        case ACTIONS.SET_CERTIFICATES:
            return { ...state, certificates: action.payload, isLoading: false };

        case ACTIONS.SET_LOADING:
            return { ...state, isLoading: action.payload };

        case ACTIONS.SET_ERROR:
            return { ...state, error: action.payload, isLoading: false, isSubmitting: false };

        case ACTIONS.SET_SUBMITTING:
            return { ...state, isSubmitting: action.payload };

        case ACTIONS.TOGGLE_MODAL:
            return {
                ...state,
                modals: {
                    ...state.modals,
                    [action.payload.modalName]: action.payload.isVisible,
                },
            };

        case ACTIONS.SET_SELECTED_CERTIFICATE:
            return { ...state, selectedCertificate: action.payload };

        case ACTIONS.ADD_CERTIFICATE:
            return {
                ...state,
                certificates: [...state.certificates, action.payload],
                modals: { ...state.modals, certificateForm: false },
                isSubmitting: false,
            };

        case ACTIONS.CLEAR_ERROR:
            return { ...state, error: null };

        default:
            return state;
    }
};

// Email template generator
const generateEmailRequest = (name, studentNumber, institutionCode, OID) => {
    return `
Olá,

Venho por este meio solicitar o certificado de conclusão de curso. Seguem os meus dados para que possam ser verificados:

Nome: ${name}
Número de Estudante: ${studentNumber}
Código da Instituição: ${institutionCode}
Identidade: ${OID}

Com os melhores cumprimentos,
${name}
`;
};

const HomeScreen = () => {
    const [state, dispatch] = useReducer(homeReducer, initialState);

    const { searchQuery, certificates, isLoading, isSubmitting, error, modals, selectedCertificate } = state;

    // Helper functions for dispatching actions
    const setSearchQuery = query => {
        dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: query });
    };

    const setCertificates = certs => {
        dispatch({ type: ACTIONS.SET_CERTIFICATES, payload: certs });
    };

    const setLoading = loading => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
    };

    const setError = errorMsg => {
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorMsg });
    };

    const setSubmitting = submitting => {
        dispatch({ type: ACTIONS.SET_SUBMITTING, payload: submitting });
    };

    const toggleModal = (modalName, isVisible) => {
        dispatch({
            type: ACTIONS.TOGGLE_MODAL,
            payload: { modalName, isVisible },
        });
    };

    const setSelectedCertificate = cert => {
        dispatch({ type: ACTIONS.SET_SELECTED_CERTIFICATE, payload: cert });
    };

    const addCertificate = cert => {
        dispatch({ type: ACTIONS.ADD_CERTIFICATE, payload: cert });
    };

    const clearError = () => {
        dispatch({ type: ACTIONS.CLEAR_ERROR });
    };
    const [form, setForm] = useState({
        name: '',
        studentNumber: '',
        institutionCode: '',
        OID: '',
    });

    // Initialize data on component mount
    useEffect(() => {
        loadCertificates();
    }, []);

    // Reset submitting state when modal closes
    useEffect(() => {
        if (!modals.certificateForm) {
            setIsSubmitting(false);
        }
    }, [modals.certificateForm]);

    // Load certificates from blockchain
    const loadCertificates = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const userWallet = await getValueFor('wallet');
            if (!userWallet?.address) {
                throw new Error('No wallet found');
            }

            const claims = await BlockchainService.getUserClaims(userWallet.address);
            const formattedCertificates = formatCertificateData(claims);

            setCertificates(formattedCertificates);
        } catch (error) {
            const processedError = ErrorHandler.processError(error, 'loadCertificates');
            setError(processedError.userMessage);
            Alert.alert('Error', processedError.userMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Format certificate data from blockchain claims
    const formatCertificateData = claims => {
        if (!claims?.certificates || claims.certificates.length === 0) {
            return [];
        }

        return claims.certificates.map((certificate, index) => {
            try {
                const institution = claims.institutions?.find(inst => inst.issuer.trim() === certificate.issuer.trim());
                const student = claims.students?.find(std => std.issuer.trim() === certificate.issuer.trim());

                const instData = institution ? JSON.parse(ethers.toUtf8String(institution.data)) : {};
                const certData = JSON.parse(ethers.toUtf8String(certificate.data));
                const studentData = student ? ethers.toUtf8String(student.data) : '';

                return {
                    id: index,
                    title: `Certificate ${certData.registrationCode}`,
                    institution: instData.institutionID || 'Unknown Institution',
                    course: instData.courseID || 'Unknown Course',
                    grade: studentData || 'Unknown Grade',
                    registrationCode: certData.registrationCode,
                    certificate: certData.certificate,
                    issuer: certificate.issuer,
                    uri: certificate.uri || null,
                };
            } catch (error) {
                ErrorHandler.logError(error, `formatCertificateData-${index}`);
                return {
                    id: index,
                    title: `Certificate ${index + 1}`,
                    institution: 'Data parsing error',
                    course: 'Unknown',
                    grade: 'Unknown',
                    registrationCode: 'Unknown',
                    certificate: 'Error',
                    issuer: certificate.issuer,
                    uri: null,
                };
            }
        });
    };

    // Handle form field changes
    const handleFormChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // Handle search
    const handleSearch = query => {
        setSearchQuery(query);
    };

    // Filter certificates based on search
    const filteredCertificates = certificates.filter(
        certificate =>
            certificate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            certificate.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
            certificate.course.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle certificate request submission
    const handleSubmitRequest = async () => {
        try {
            setIsSubmitting(true);

            // Validate form
            const requiredFields = ['name', 'studentNumber', 'institutionCode', 'OID'];
            for (const field of requiredFields) {
                if (!form[field]?.trim()) {
                    throw new Error(`${field} is required`);
                }
            }

            // Generate email content
            const emailContent = generateEmailRequest(form.name, form.studentNumber, form.institutionCode, form.OID);

            // Open email client
            const emailUrl = `mailto:?subject=Certificate Request&body=${encodeURIComponent(emailContent)}`;

            const canOpen = await Linking.canOpenURL(emailUrl);
            if (canOpen) {
                await Linking.openURL(emailUrl);

                Alert.alert('Success', 'Email client opened. Please send the email to your institution.', [
                    { text: 'OK', onPress: () => toggleModal('certificateForm', false) },
                ]);
            } else {
                throw new Error('Cannot open email client');
            }
        } catch (error) {
            const processedError = ErrorHandler.processError(error, 'handleSubmitRequest');
            Alert.alert('Error', processedError.userMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle certificate selection
    const handleCertificatePress = certificate => {
        setSelectedCertificate(certificate);
        toggleModal('certificate', true);
    };

    // Render certificate item
    const renderCertificateItem = ({ item }) => (
        <CertificateCard certificate={item} onPress={() => handleCertificatePress(item)} />
    );

    // Render empty state
    const renderEmptyState = () => (
        <EmptyState
            title="No Certificates Found"
            message={searchQuery ? 'No certificates match your search' : "You don't have any certificates yet"}
            actionText={searchQuery ? 'Clear Search' : 'Request Certificate'}
            onAction={searchQuery ? () => setSearchQuery('') : () => toggleModal('certificateForm', true)}
        />
    );

    // Loading state
    if (isLoading && certificates.length === 0) {
        return (
            <Background
                header={
                    <Appbar.Header>
                        <Appbar.Content title="Certificates" />
                    </Appbar.Header>
                }
                body={
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                }
            />
        );
    }

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header>
                        <Appbar.Content title="My Certificates" titleStyle={styles.headerTitle} />
                        <Appbar.Action
                            icon="plus"
                            onPress={() => toggleModal('certificateForm', true)}
                            accessibilityLabel="Request new certificate"
                        />
                        <Appbar.Action
                            icon="refresh"
                            onPress={loadCertificates}
                            accessibilityLabel="Refresh certificates"
                        />
                    </Appbar.Header>

                    <View style={styles.searchContainer}>
                        <Searchbar
                            placeholder="Search certificates..."
                            onChangeText={handleSearch}
                            value={searchQuery}
                            style={styles.searchBar}
                            inputStyle={styles.searchInput}
                        />
                    </View>
                </View>
            }
            body={
                <View style={styles.container}>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <FlatList
                        data={filteredCertificates}
                        renderItem={renderCertificateItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={renderEmptyState}
                        refreshing={isLoading}
                        onRefresh={loadCertificates}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Certificate Request Modal */}
                    <CertificateFormModal
                        visible={modals.certificateForm}
                        onClose={() => toggleModal('certificateForm', false)}
                        form={form}
                        onFormChange={handleFormChange}
                        onSubmit={handleSubmitRequest}
                        isSubmitting={isSubmitting}
                    />

                    {/* Private Key Modal */}
                    <PrivateKeyModal visible={modals.privateKey} onClose={() => toggleModal('privateKey', false)} />

                    {/* Certificate Details Modal */}
                    <PasswordModal
                        visible={modals.certificate}
                        onClose={() => toggleModal('certificate', false)}
                        certificate={selectedCertificate}
                    />
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: Colors.white,
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        color: Colors.primary,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    searchBar: {
        backgroundColor: Colors.lightGray,
        elevation: 0,
    },
    searchInput: {
        fontFamily: 'Poppins-Regular',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        backgroundColor: Colors.error,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: Colors.white,
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
    },
    listContainer: {
        paddingBottom: 20,
    },
});

export default HomeScreen;
