import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Linking, Modal, TextInput } from 'react-native';
import { Appbar, Searchbar, List, IconButton, Card, Button, Text, Portal } from 'react-native-paper';
import Background from '@/components/Background';
import colors from '@/constants/colors';
import FormField from '@/components/FormField';
import Colors from '@/constants/colors';
import ActionButton from '@/components/ActionButton';

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
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        studentNumber: '',
        institutionCode: '',
        OID: '',
    });

    useEffect(() => {
        async function fetchData() {
            const data = await getCertificates();
            setCertificates(data);
        }

        fetchData();
    }, []);

    const handleSearch = query => setSearchQuery(query);

    const filteredCertificates = certificates.filter(certificate =>
        certificate.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleFormSubmit = () => {
        const { name, studentNumber, institutionCode, OID } = formData;
        const emailBody = emailRequest(name, studentNumber, institutionCode, OID);
        const subject = encodeURIComponent('Pedido de Certificado');
        const body = encodeURIComponent(emailBody);
        const url = `mailto:licenciaturas@isel.pt?subject=${subject}&body=${body}`;
        Linking.openURL(url);
        setModalVisible(false); // Fechar o modal após o envio
    };

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.topHeader}>
                        <Appbar.Content title="My Certificates" titleStyle={{ fontFamily: 'Poppins-SemiBold' }} />
                        <Appbar.Action
                            icon="plus"
                            onPress={() => setModalVisible(true)}
                        />
                    </Appbar.Header>
                </View>
            }
            body={
                <>
                    <CertificateFormModal onDismiss={() => setModalVisible(false)}
                                          visible={modalVisible}
                                          onRequestClose={() => setModalVisible(!modalVisible)}
                                          formData={formData}
                                          onChangeText={text => setFormData({ ...formData, name: text })}
                                          onChangeText1={text => setFormData({ ...formData, studentNumber: text })}
                                          onChangeText2={text => setFormData({ ...formData, institutionCode: text })}
                                          onChangeText3={text => setFormData({ ...formData, OID: text })}
                                          onPress={handleFormSubmit}
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
                                                    <IconButton icon="pencil" onPress={() => {
                                                    }} />
                                                    <IconButton
                                                        icon="share"
                                                        onPress={() => {
                                                        }}
                                                        style={{ alignItems: 'flex-end' }}
                                                    />
                                                    <IconButton
                                                        icon="arrow-down-circle"
                                                        onPress={() => {
                                                        }}
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

export default HomeScreen;

function CertificateFormModal(props) {
    return <Portal>
        <Modal
            animationType="slide"
            onDismiss={props.onDismiss}
            visible={props.visible}
            onRequestClose={props.onRequestClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Request Certificate</Text>
                    <FormField
                        label="Name"
                        value={props.formData.name}
                        onChangeText={props.onChangeText}
                        style={styles.modalInput}
                    >
                    </FormField>
                    <FormField
                        label="Student Number"
                        value={props.formData.studentNumber}
                        onChangeText={props.onChangeText1}
                        style={styles.modalInput}
                    >
                    </FormField>
                    <FormField
                        label="Institution Code"
                        value={props.formData.institutionCode}
                        onChangeText={props.onChangeText2}
                        style={styles.modalInput}
                    >
                    </FormField>
                    <FormField
                        label="OID"
                        value={props.formData.OID}
                        onChangeText={props.onChangeText3}
                        style={styles.modalInput}
                    >
                    </FormField>
                    <ActionButton
                        text="Submit"
                        onPress={props.onPress}
                        textStyle={styles.modalButtonText}
                        buttonStyle={styles.modalSubmitButton}
                        mode={'elevated'}
                        color={Colors.backgroundColor}
                    />
                </View>
            </View>
        </Modal>
    </Portal>;
}

const styles = StyleSheet.create({
    topHeader: {
        backgroundColor: colors.solitudeGrey,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        backgroundColor: colors.solitudeGrey,
        padding: 20,
        marginHorizontal: 20,
        borderRadius: 20,
    },
    modalTitle: {
        fontSize: 28,
        fontFamily: 'Poppins-Bold',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    modalInput: {
        justifyContent: 'center',
        marginTop: 20,
        borderRadius: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.sonicSilver,
    },
    modalSubmitButton: {
        marginTop: 20,
        borderRadius: 16,
        borderWidth: 4,
        borderColor: Colors.white,
        elevation: 5,
        alignSelf: 'center',
        width: '80%',
    },
    modalButtonText: {
        fontSize: 15,
        lineHeight: 20,
        fontFamily: 'Poppins-Bold',
        color: Colors.black,
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
        backgroundColor: colors.solitudeGrey,
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
        backgroundColor: colors.white,
    },
    certificateContent: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    certificateActions: {
        flexDirection: 'row',
    },
});
