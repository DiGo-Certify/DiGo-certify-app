import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Linking, Alert } from 'react-native';
import { Appbar, Searchbar, List, IconButton, Card } from 'react-native-paper';
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

// Simulate fetching data from the blockchain
async function getCertificates() {
    /*
    On the future will probably be used, some async store aproach to store data after the first search or any update, because requests to the blockchain are expensive and slow
    */
    return [
        { id: 1, title: 'Certificate 1' },
        { id: 2, title: 'Certificate 2' },
        { id: 3, title: 'Certificate 3' },
        { id: 4, title: 'Certificate 4' },
        { id: 5, title: 'Certificate 5' },
    ];
}

// Função modificada para usar os valores do estado do formulário
const emailRequest = (name, studentNumber, institutionCode, OID) => {
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
    const [searchQuery, setSearchQuery] = useState('');
    const [certificates, setCertificates] = useState([]);
    const [privKeyModalVisible, setPrivKeyModalVisible] = useState(false);
    const [privateKey, setPrivateKey] = useState(''); // Private Key Modal Input
    const [modalVisible, setModalVisible] = useState(false); // Form Modal (Request Certificate)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        studentNumber: '',
        institutionCode: '',
        OID: '',
    });

    useEffect(() => {
        if (!modalVisible) {
            setIsSubmitting(false);
        }
    }, [modalVisible]);

    useEffect(() => {
        async function fetchData() {
            const data = await getCertificates();
            setCertificates(data);
        }

        fetchData();
    }, []);

    const handleChangeForm = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleSearch = query => setSearchQuery(query);

    const filteredCertificates = certificates.filter(certificate =>
        certificate.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onSubmitPrivateKey = async () => {
        const userWallet = await getValueFor('wallet');
        userWallet.privateKey = privateKey;
        await save('wallet', JSON.stringify({ ...userWallet, privateKey: privateKey }));
        setPrivKeyModalVisible(false);
    };

    const requestCertificateHandle = async () => {
        const userWallet = await getValueFor('wallet');
        if (userWallet.privateKey === undefined) {
            Alert.alert(
                'Private Key Required',
                'Please enter your private key to request a certificate and make sure to do not send this to anyone',
                [
                    {
                        text: 'Enter Private Key',
                        onPress: () => setPrivKeyModalVisible(true),
                    },
                ]
            );
        } else {
            setModalVisible(true);
        }
    };

    const handleFormSubmit = async () => {
        try {
            setIsSubmitting(true);
            const { name, studentNumber, institutionCode, OID } = form;
            const emailBody = emailRequest(name, studentNumber, institutionCode, OID);
            const subject = encodeURIComponent('Pedido de Certificado');
            const body = encodeURIComponent(emailBody);
            const url = `mailto:licenciaturas@isel.pt?subject=${subject}&body=${body}`;

            // Get the provider and signer
            const provider = new ethers.JsonRpcProvider(config.rpc);
            const signer = new ethers.Wallet(config.deployer.privateKey, provider);

            // Get the identity factory contract and the trusted issuers registry contract
            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            const trustedIR = getContractAt(
                config.trex.trustedIssuersRegistry.address,
                config.trex.trustedIssuersRegistry.abi,
                signer
            );

            // Get the user wallet info stored in the safe-storage
            const savedWallet = await getValueFor('wallet');

            // Get the identity of the user
            const userIdentity = await getIdentity(savedWallet.address, identityFactory);

            if (!userIdentity) {
                Alert.alert('Warning', `Identity for wallet: ${savedWallet.address} not found.`);
                setIsSubmitting(false);
                return;
            }

            // Create the user wallet object (ethers.Wallet)
            const userWallet = getWallet(savedWallet.privateKey, provider);

            // Add the key of the claim issuer that matches the institution code to the identity of the student that requested the certificate
            // With this the student is allowing the institution to emit certificates on his behalf
            const issuers = await trustedIR.getTrustedIssuersForClaimTopic(ethers.id(CLAIM_TOPICS_OBJ.INSTITUTION));

            console.log('userIdentity', userIdentity);

            for (const issuer of issuers) {
                // Get contract of the issuer, by searching the issuer address in the configuration file
                for (const institution of config.institutions) {
                    if (institution.address === issuer) {
                        const issuerWallet = getWallet(institution.wallet.privateKey, provider);
                        await addKeyToIdentity(userIdentity, userWallet, issuerWallet, 3, 1);
                    }
                }
            }

            // Self assign the student number and name (CLAIM_TOPICS: STUDENT)
            await addClaim(trustedIR, userIdentity, userIdentity, userWallet, CLAIM_TOPICS_OBJ.STUDENT, form.name);
            await addClaim(
                trustedIR,
                userIdentity,
                userIdentity,
                userWallet,
                CLAIM_TOPICS_OBJ.STUDENT,
                form.studentNumber
            );

            Linking.openURL(url);
            setIsSubmitting(false);
            setModalVisible(false); // Fechar o modal após o envio
        } catch (error) {
            console.log(error);
            setIsSubmitting(false);
        }
    };

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.topHeader}>
                        <Appbar.Content title="My Certificates" titleStyle={{ fontFamily: 'Poppins-SemiBold' }} />
                        <Appbar.Action icon="plus" onPress={requestCertificateHandle} />
                    </Appbar.Header>
                </View>
            }
            body={
                <>
                    <CertificateFormModal
                        onDismiss={() => setModalVisible(false)}
                        visible={modalVisible}
                        formData={form}
                        onChangeForm={handleChangeForm}
                        onPress={handleFormSubmit}
                        isSubmitting={isSubmitting}
                    />
                    <PrivateKeyModal
                        visible={privKeyModalVisible}
                        onDismiss={() => setPrivKeyModalVisible(false)}
                        privateKey={privateKey}
                        onChangePrivateKey={text => setPrivateKey(text)}
                        onSubmitPrivateKey={onSubmitPrivateKey}
                    />
                    <View style={styles.body}>
                        <View style={styles.searchBarContainer}>
                            <Searchbar
                                placeholder="Which certificate?"
                                value={searchQuery}
                                onChangeText={handleSearch}
                                style={styles.searchBar}
                            />
                        </View>
                        <FlatList
                            data={filteredCertificates}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <Card style={styles.certificateItem}>
                                    <Card.Content style={styles.certificateContent}>
                                        <List.Item
                                            title={item.title}
                                            right={() => (
                                                <View style={styles.certificateActions}>
                                                    <IconButton icon="pencil" onPress={() => {}} />
                                                    <IconButton
                                                        icon="share"
                                                        onPress={() => {}}
                                                        style={{ alignItems: 'flex-end' }}
                                                    />
                                                    <IconButton
                                                        icon="arrow-down-circle"
                                                        onPress={() => {}}
                                                        style={{ alignItems: 'flex-end' }}
                                                    />
                                                </View>
                                            )}
                                        />
                                    </Card.Content>
                                </Card>
                            )}
                        />
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
        marginTop: -155,
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
    certificateList: {
        padding: 16,
    },
    certificateItem: {
        margin: 8,
        elevation: 2,
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: Colors.white,
    },
    certificateContent: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    certificateActions: {
        flexDirection: 'row',
    },
});

export default HomeScreen;
