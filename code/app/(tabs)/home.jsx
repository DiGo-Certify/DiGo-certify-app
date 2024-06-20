import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, Searchbar, List, IconButton, Card } from 'react-native-paper';
import Background from '@/components/Background';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Simulate fetching data from the blocchain
async function getCertificates() {
    /*
    On the future 7will probably be used, some async store aproach to store data after the first search or any update, because requests to the blockchain are expensive and slow
    */
    //delay(1000);
    return [
        { id: 1, title: 'Certificate 1' },
        { id: 2, title: 'Certificate 2' },
        { id: 3, title: 'Certificate 3' },
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
                    <Appbar.Header>
                        <Appbar.BackAction onPress={() => {}} />
                        <Appbar.Content title="My Certificates" />
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
                                                <IconButton icon="arrow-up-circle" onPress={() => {}} />
                                                <IconButton icon="arrow-down-circle" onPress={() => {}} />
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
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    header: {
        flex: 1,
        width: '100%',
        marginTop: -200,
        justifyContent: 'center',
    },
    body: {
        width: '100%',
        paddingHorizontal: 30,
        marginTop: -155,
    },
    searchBar: {
        elevation: 2,
    },
    certificateList: {
        padding: 16,
    },
    certificateItem: {
        marginBottom: 16,
        elevation: 2,
    },
    certificateContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    certificateActions: {
        flexDirection: 'row',
    },
});

export default HomeScreen;
