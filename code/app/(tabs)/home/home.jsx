import React, { useState, useEffect } from 'react';
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
    const [certificateModalVisible, setCertificateModalVisible] = useState(false); // Certificate Modal
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Loading state for fetching certificates
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

    const getCertificates = async () => {
        try {
            setSelectedCertificate(null);
            setIsLoading(true);
            const userWallet = await getValueFor('wallet');

            const signer = useRpcProvider(config.rpc, config.deployer.privateKey);

            console.log('User Wallet:', userWallet);

            const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
            const userIdentity = await getIdentity(userWallet.address, identityFactory, signer);

            const certificates = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.CERTIFICATE);
            const institutions = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.INSTITUTION);
            const students = await getClaimsByTopic(userIdentity, CLAIM_TOPICS_OBJ.STUDENT);

            //console.log('Certificates:', certificates);
            //console.log('Institutions:', institutions);
            //console.log('Students:', students);
            setIsLoading(false);
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
            console.log(error);
            throw error;
        }
    };

    const onSubmitPrivateKey = async () => {
        const userWallet = await getValueFor('wallet');
        if (privateKey.startsWith('0x')) {
            userWallet.privateKey = privateKey;
        } else {
            userWallet.privateKey = `0x${privateKey}`;
        }
        await save('wallet', JSON.stringify({ ...userWallet, privateKey: userWallet.privateKey }));
        setPrivKeyModalVisible(false);
    };

    const requestCertificateHandle = async () => {
        const userWallet = await getValueFor('wallet');
        if (!userWallet.privateKey) {
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
            console.log('User Wallet:', userWallet.address);
            console.log('Saved wallet:', savedWallet.address);
            console.log(userWallet.address !== savedWallet.address);
            if (userWallet.address.toLowerCase() !== savedWallet.address) {
                const onCancel = () => {
                    setModalVisible(false);
                    setIsSubmitting(false);
                };
                Alert.alert('Warning', 'Your private key is invalid.', [
                    {
                        text: 'Change Private Key',
                        onPress: () => setPrivKeyModalVisible(true),
                    },
                    {
                        text: 'Cancel',
                        onPress: onCancel,
                    },
                ]);
                setIsSubmitting(false);
                return;
            }

            // Add the key of the claim issuer that matches the institution code to the identity of the student that requested the certificate
            // With this the student is allowing the institution to emit certificates on his behalf
            const issuers = await trustedIR.getTrustedIssuersForClaimTopic(ethers.id(CLAIM_TOPICS_OBJ.INSTITUTION));

            for (const issuer of issuers) {
                for (const institution of config.institutions) {
                    if (
                        institution.address === issuer &&
                        institution.institutionID.toString() === form.institutionCode
                    ) {
                        const issuerWallet = getWallet(institution.wallet.privateKey, provider);
                        console.log('Issuer Wallet:', issuerWallet.address);
                        await addKeyToIdentity(userIdentity, userWallet, issuerWallet, 3, 1);
                    }
                }
            }

            // Self assign the student number and name (CLAIM_TOPICS: STUDENT)
            const studentClaim = JSON.stringify({
                studentNumber: form.studentNumber,
                name: form.name,
            });
            console.log('Student Claim:', studentClaim);

            await addClaim(trustedIR, userIdentity, userIdentity, userWallet, CLAIM_TOPICS_OBJ.STUDENT, studentClaim);

            Linking.openURL(url);
            setIsSubmitting(false);
            setModalVisible(false); // Fechar o modal após o envio
        } catch (error) {
            console.log(error);
            setIsSubmitting(false);
        }
    };

    const handleCertificatePress = certificate => {
        setSelectedCertificate(certificate);
        setCertificateModalVisible(true);
    };

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.topHeader}>
                        <Appbar.Action icon="reload" onPress={getCertificates} disabled={isLoading} />
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
                        {isLoading ? (
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
                                visible={certificateModalVisible}
                                onDismiss={() => setCertificateModalVisible(false)}
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
        marginTop: -155,
    },
    title: {
        flexWrap: 'wrap',
        fontFamily: 'Poppins-SemiBold',
        //width: '80%', // Ajuste a largura conforme necessário
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
