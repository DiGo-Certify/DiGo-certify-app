import React, { useEffect, useReducer } from 'react';
import { View, StyleSheet, FlatList, Linking, Alert } from 'react-native';
import { Appbar, Searchbar, List, IconButton, Card, ActivityIndicator } from 'react-native-paper';
import Background from '@/components/Background';
import Colors from '@/constants/colors';
import { addClaim } from '@/services/ethereum/scripts/claims/add-claim';
import { getContractAt, getWallet } from '@/services/ethereum/scripts/utils/ethers';
import { getValueFor, save } from '@/services/storage/storage';
import { getIdentity } from '@/services/ethereum/scripts/identities/getIdentity';
import config from '@/config.json';
import { ethers } from 'ethers';
import { CLAIM_TOPICS_OBJ } from '@/services/ethereum/scripts/claims/claimTopics';
import { addKeyToIdentity } from '@/services/ethereum/scripts/claimIssuer/addKeyToIdentity';
import CertificateFormModal from './components/certificateFormModal';
import PrivateKeyModal from './components/privateKeyModal';
import { getClaimsByTopic } from '@/services/ethereum/scripts/claims/getClaimsByTopic';
import { useRpcProvider } from '@/services/ethereum/scripts/utils/useRpcProvider';
import PasswordModal from './components/certificateModal';

const ACTIONS = {
    EDIT: 'edit',
    SUBMIT: 'submit',
    TOGGLE_MODAL: 'toggle_modal',
    FETCH_CERTIFICATES: 'fetch_certificates',
    ERROR: 'error',
    SUCCESS: 'success',
    SET_CERTIFICATE: 'set_certificate',
};

const STATES = {
    LOADING: 'loading',
    EDITING: 'editing',
    SUBMITTING: 'submitting',
};

// const emailRequest = (name, studentNumber, institutionCode, OID) => {
//     return `
//        Olá,

//        Venho por este meio solicitar o certificado de conclusão de curso. Seguem os meus dados para que possam ser verificados:

//        Nome: ${name}
//        Número de Estudante: ${studentNumber}
//        Código da Instituição: ${institutionCode}
//        Identidade: ${OID}

//        Com os melhores cumprimentos,
//        ${name}
//        `;
// };

const emailRequest = (name, studentNumber, institutionCode, OID) => {
    return `
       Hello,

       I hereby request the certificate of course completion. Here is my information for verification:

       Name: ${name}
       Student Number: ${studentNumber}
       Institution Code: ${institutionCode}
       Identity: ${OID}

       Best regards,
       ${name}
       `;
};

function reducer(state, action) {
    switch (state.tag) {
        case STATES.LOADING:
            if (action.type === ACTIONS.FETCH_CERTIFICATES) {
                return {
                    ...state,
                    certificates: action.certificates,
                    tag: STATES.EDITING,
                    error: null,
                };
            } else if (action.type === ACTIONS.ERROR) {
                return { ...state, tag: STATES.EDITING, error: action.message };
            }
            return state;

        case STATES.EDITING:
            if (action.type === ACTIONS.EDIT) {
                const newInputs = { ...state.inputs };
                const path = action.inputName.split('.');
                let current = newInputs;
                for (let i = 0; i < path.length - 1; i++) {
                    current = current[path[i]] = { ...current[path[i]] };
                }
                current[path[path.length - 1]] = action.inputValue;
                return { ...state, inputs: newInputs, error: null };
            } else if (action.type === ACTIONS.TOGGLE_MODAL) {
                return {
                    ...state,
                    modals: {
                        ...state.modals,
                        [action.modalName]: !state.modals[action.modalName],
                    },
                };
            } else if (action.type === ACTIONS.SUBMIT) {
                return { ...state, tag: STATES.SUBMITTING, error: null };
            } else if (action.type === ACTIONS.SET_CERTIFICATE) {
                return { ...state, selectedCertificate: action.certificate };
            } else if (action.type === ACTIONS.ERROR) {
                return { ...state, error: action.message };
            }
            return state;

        case STATES.SUBMITTING:
            if (action.type === ACTIONS.SUCCESS) {
                return {
                    ...state,
                    tag: STATES.EDITING,
                    modals: { ...state.modals, isCertificateFormModalVisible: false },
                    inputs: {
                        ...state.inputs,
                        form: { name: '', studentNumber: '', institutionCode: '', OID: '' },
                    },
                };
            } else if (action.type === ACTIONS.ERROR) {
                return { ...state, tag: STATES.EDITING, error: action.message };
            }
            return state;

        default:
            return state;
    }
}

const firstState = {
    tag: STATES.LOADING,
    inputs: {
        searchQuery: '',
        form: {
            name: '',
            studentNumber: '',
            institutionCode: '',
            OID: '',
        },
        privateKey: '',
    },
    certificates: [],
    modals: {
        isCertificateFormModalVisible: false,
        isPrivKeyModalVisible: false,
        isCertificateModalVisible: false,
    },
    selectedCertificate: null,
    error: null,
};

const HomeScreen = () => {
    const [state, dispatch] = useReducer(reducer, firstState);
    const { inputs, certificates, modals, selectedCertificate } = state;
    const { searchQuery, form, privateKey } = inputs;

    const getCertificates = async () => {
        try {
            const userWallet = await getValueFor('wallet');
            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);
            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            const userIdentity = await getIdentity(userWallet.address, identityFactory, signer);

            const certificates = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.CERTIFICATE);
            const institutions = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.INSTITUTION);
            const students = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.STUDENT);

            return certificates.map((certificate, index) => {
                const institution = institutions.find(inst => inst.issuer.trim() === certificate.issuer.trim());
                const instData = JSON.parse(ethers.toUtf8String(institution.data));
                const studentFirstClaim = students.find(std => std.issuer.trim() != certificate.issuer.trim());
                const studentFirstClaimData = JSON.parse(ethers.toUtf8String(studentFirstClaim.data));
                const student = students.find(std => std.issuer.trim() === certificate.issuer.trim());
                const studentData = ethers.toUtf8String(student.data);
                const certData = JSON.parse(ethers.toUtf8String(certificate.data));
                return {
                    id: index,
                    title: `${studentFirstClaimData.name} ${studentData} em ${instData.courseID} na ${instData.institutionID}`,
                    uri: certData.certificate,
                };
            });
        } catch (error) {
            dispatch({ type: ACTIONS.ERROR, message: error.message });
            throw error;
        }
    };

    useEffect(() => {
        if (state.tag === STATES.LOADING) {
            const fetchData = async () => {
                try {
                    const data = await getCertificates();
                    dispatch({ type: ACTIONS.FETCH_CERTIFICATES, certificates: data });
                } catch (error) {
                    dispatch({ type: ACTIONS.ERROR, message: error.message });
                }
            };
            fetchData();
        }
    }, [state.tag]);

    useEffect(() => {
        if (state.error) {
            Alert.alert('Error', state.error, [{ text: 'OK' }]);
        }
    }, [state.error]);

    const onSubmitPrivateKey = async () => {
        const userWallet = await getValueFor('wallet');
        const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        await save('wallet', JSON.stringify({ ...userWallet, privateKey: formattedKey }));
        dispatch({ type: ACTIONS.TOGGLE_MODAL, modalName: 'isPrivKeyModalVisible' });
    };

    const requestCertificateHandle = async () => {
        const userWallet = await getValueFor('wallet');
        if (!userWallet?.privateKey) {
            Alert.alert(
                'Private Key Required',
                'Please enter your private key to request a certificate and make sure to do not send this to anyone',
                [
                    {
                        text: 'Enter Private Key',
                        onPress: () => dispatch({ type: ACTIONS.TOGGLE_MODAL, modalName: 'isPrivKeyModalVisible' }),
                    },
                ]
            );
        } else {
            dispatch({ type: ACTIONS.TOGGLE_MODAL, modalName: 'isCertificateFormModalVisible' });
        }
    };

    const handleFormSubmit = async () => {
        dispatch({ type: ACTIONS.SUBMIT });
        try {
            const { name, studentNumber, institutionCode, OID } = form;
            const emailBody = emailRequest(name, studentNumber, institutionCode, OID);
            const subject = encodeURIComponent('Pedido de Certificado');
            const body = encodeURIComponent(emailBody);
            const url = `mailto:licenciaturas@isel.pt?subject=${subject}&body=${body}`;

            const provider = new ethers.JsonRpcProvider(config.rpc);
            const signer = new ethers.Wallet(config.deployer.privateKey, provider);

            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            const trustedIR = getContractAt(
                config.trex.trustedIssuersRegistry.address,
                config.trex.trustedIssuersRegistry.abi,
                signer
            );

            const savedWallet = await getValueFor('wallet');
            const userIdentity = await getIdentity(savedWallet.address, identityFactory, signer);

            if (!userIdentity) {
                throw new Error(`Identity for wallet: ${savedWallet.address} not found.`);
            }

            const userWallet = getWallet(savedWallet.privateKey, provider);
            if (!userWallet || userWallet.address.toLowerCase() !== savedWallet.address) {
                throw new Error('Your private key is invalid.');
            }

            const issuers = await trustedIR.getTrustedIssuersForClaimTopic(ethers.id(CLAIM_TOPICS_OBJ.INSTITUTION));
            let issuerFound = false;

            for (const issuer of issuers) {
                for (const institution of config.institutions) {
                    if (institution.address === issuer && institution.institutionID === form.institutionCode) {
                        issuerFound = true;
                        const issuerWallet = getWallet(institution.wallet.privateKey, provider);
                        const issuerContract = getContractAt(institution.address, institution.abi, issuerWallet);
                        const issuerKeys = await issuerContract.getKeysByPurpose(3);
                        const userKeys = await userIdentity.getKeysByPurpose(3);
                        if (!userKeys.includes(issuerKeys[0])) {
                            await addKeyToIdentity(userIdentity, userWallet, issuerWallet, 3, 1);
                        }
                    }
                }
            }

            if (!issuerFound) {
                throw new Error('Institution not found.');
            }

            const studentClaim = JSON.stringify({
                studentNumber: form.studentNumber,
                name: form.name,
            });

            await addClaim(trustedIR, userIdentity, userIdentity, userWallet, CLAIM_TOPICS_OBJ.STUDENT, studentClaim);

            Linking.openURL(url);
            dispatch({ type: ACTIONS.SUCCESS });
        } catch (error) {
            dispatch({ type: ACTIONS.ERROR, message: error.message });
        }
    };

    const handleCertificatePress = certificate => {
        if (certificate.uri === 'Certificate hash') {
            Alert.alert('Warning', 'URL not available yet. Contact the institution for more information.');
            return;
        }
        dispatch({ type: ACTIONS.SET_CERTIFICATE, certificate });
        dispatch({ type: ACTIONS.TOGGLE_MODAL, modalName: 'isCertificateModalVisible' });
    };

    const filteredCertificates = certificates.filter(certificate =>
        certificate.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.topHeader}>
                        <Appbar.Action
                            icon="reload"
                            onPress={() => dispatch({ type: ACTIONS.FETCH_CERTIFICATES })}
                            disabled={state.tag === STATES.LOADING}
                        />
                        <Appbar.Content
                            title="My Certificates"
                            titleStyle={{ fontFamily: 'Poppins-SemiBold', justifyContent: 'center' }}
                        />
                        <Appbar.Action icon="plus" onPress={requestCertificateHandle} />
                    </Appbar.Header>
                </View>
            }
            body={
                <>
                    <CertificateFormModal
                        onDismiss={() =>
                            dispatch({ type: ACTIONS.TOGGLE_MODAL, modalName: 'isCertificateFormModalVisible' })
                        }
                        visible={modals.isCertificateFormModalVisible}
                        formData={form}
                        onChangeForm={(field, value) =>
                            dispatch({ type: ACTIONS.EDIT, inputName: `form.${field}`, inputValue: value })
                        }
                        onPress={handleFormSubmit}
                        isSubmitting={state.tag === STATES.SUBMITTING}
                    />
                    <PrivateKeyModal
                        visible={modals.isPrivKeyModalVisible}
                        onDismiss={() => dispatch({ type: ACTIONS.TOGGLE_MODAL, modalName: 'isPrivKeyModalVisible' })}
                        privateKey={privateKey}
                        onChangePrivateKey={text =>
                            dispatch({ type: ACTIONS.EDIT, inputName: 'privateKey', inputValue: text })
                        }
                        onSubmitPrivateKey={onSubmitPrivateKey}
                    />
                    <View style={styles.body}>
                        <View style={styles.searchBarContainer}>
                            <Searchbar
                                placeholder="Which certificate?"
                                value={searchQuery}
                                onChangeText={text =>
                                    dispatch({ type: ACTIONS.EDIT, inputName: 'searchQuery', inputValue: text })
                                }
                                style={styles.searchBar}
                            />
                        </View>
                        {state.tag === STATES.LOADING ? (
                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator animating={true} color={Colors.green} size="large" />
                            </View>
                        ) : (
                            <FlatList
                                data={filteredCertificates}
                                keyExtractor={item => item.id.toString()}
                                renderItem={({ item }) => (
                                    <Card style={styles.certificateItem}>
                                        <Card.Content style={styles.certificateContent}>
                                            <List.Item title={item.title} titleStyle={styles.title} />
                                            <View style={styles.certificateActions}>
                                                <IconButton
                                                    icon="eye"
                                                    onPress={() => handleCertificatePress(item)}
                                                    style={{ marginRight: 8 }}
                                                />
                                            </View>
                                        </Card.Content>
                                    </Card>
                                )}
                            />
                        )}
                        {selectedCertificate && (
                            <PasswordModal
                                visible={modals.isCertificateModalVisible}
                                onDismiss={() => {
                                    dispatch({ type: ACTIONS.TOGGLE_MODAL, modalName: 'isCertificateModalVisible' });
                                    dispatch({ type: ACTIONS.SET_CERTIFICATE, certificate: null });
                                }}
                                encryptedURI={selectedCertificate.uri}
                            />
                        )}
                    </View>
                </>
            }
        />
    );
};

const styles = StyleSheet.create({
    topHeader: {
        backgroundColor: Colors.solitudeGrey,
    },
    header: {
        width: '100%',
        justifyContent: 'center',
    },
    body: {
        width: '100%',
        paddingHorizontal: 16,
        marginTop: -200,
    },
    title: {
        flexWrap: 'wrap',
        fontFamily: 'Poppins-SemiBold',
    },
    searchBar: {
        elevation: 2,
        backgroundColor: Colors.solitudeGrey,
    },
    searchBarContainer: {
        borderRadius: 10,
        display: 'flex',
        padding: 16,
    },
    certificateItem: {
        margin: 8,
        elevation: 2,
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: Colors.white,
    },
    certificateActions: {
        flexDirection: 'row',
    },
    certificateContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default HomeScreen;
