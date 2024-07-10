import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Linking } from 'react-native';
import { Appbar, Searchbar, List, IconButton, Card } from 'react-native-paper';
import Background from '@/components/Background';
import colors from '@/constants/colors';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Simulate fetching data from the blocchain
async function getCertificates() {
    /*
    On the future will probably be used, some async store aproach to store data after the first search or any update, because requests to the blockchain are expensive and slow
    */
    //delay(1000);
    return [
        { id: 1, title: 'Certificate 1' },
        { id: 2, title: 'Certificate 2' },
        { id: 3, title: 'Certificate 3' },
        { id: 4, title: 'Certificate 4' },
        { id: 5, title: 'Certificate 5' },
    ];
}

const HomeScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [certificates, setCertificates] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const data = await getCertificates();
            setCertificates(data);
        }
        fetchData();
    }, []);

    const handleSearch = query => setSearchQuery(query);

    const filteredCertificates = certificates.filter(certificate =>
        certificate.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    function askCertificate(name, studentNumber, institutionCode, OID) {
        // Send an email to the institution asking for the certificate to be added to the blockchain
        // This will have the following fields: Name, Email, Institution Code, Onchain ID, Student Number

        const emailBody = emailRequest(name, studentNumber, institutionCode, OID);
        const subject = encodeURIComponent('Pedido de Certificado');
        const body = encodeURIComponent(emailBody);
        const url = `mailto:licenciaturas@isel.pt?subject=${subject}&body=${body}`;

        Linking.openURL(url);
    }

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.topHeader}>
                        <Appbar.Content title="My Certificates" titleStyle={{ fontFamily: 'Poppins-SemiBold' }} />
                        <Appbar.Action
                            icon="plus"
                            // Change for form values
                            onPress={() => askCertificate('João Silva', '49513', '3118', '0x123a121231231231231')}
                        />
                    </Appbar.Header>
                </View>
            }
            body={
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
            }
        />
    );
};

const styles = StyleSheet.create({
    topHeader: {
        backgroundColor: colors.solitudeGrey,
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

export default HomeScreen;
