import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
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

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.topHeader}>
                        {/* <Appbar.BackAction onPress={() => {}} /> */}
                        <Appbar.Content title="My Certificates" titleStyle={{ fontFamily: 'Poppins-SemiBold' }} />
                        <Appbar.Action icon="plus" onPress={() => {}} />
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
                                                    icon="arrow-up-circle"
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
    searchBarContainer: {
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        padding: 16,
    },
    topHeader: {
        backgroundColor: colors.solitudeGrey,
    },
    header: {
        flex: 1,
        width: '100%',
        marginTop: -150,
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
