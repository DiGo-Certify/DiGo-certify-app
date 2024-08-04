import { View, Text, StyleSheet, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import Images from '@/constants/images';
import Colors from '@/constants/colors';
import ActionButton from '@/components/ActionButton';
import HeaderImage from '@/components/HeaderImage';
import Icons from '@/constants/icons';
import Background from '@/components/Background';
import { List } from 'react-native-paper';
import { router } from 'expo-router';

const Admin = () => {
    return (
        <Background
            header={
                <View style={styles.header}>
                    <HeaderImage imageSource={Images.splashScreenImage} />
                </View>
            }
            body={
                <View style={styles.options}>
                    <ListItem
                        title="Send a New Certificate"
                        onPress={() => router.push('/emission')}
                        icon={Icons.newCertificate}
                    />
                    <ListItem
                        title="View All Certificates"
                        onPress={() => console.log('Certificates')}
                        icon={Icons.certificates}
                    />
                    <ListItem
                        title="Edit A Existinng Certificate"
                        onPress={() => console.log('Edit Certificate')}
                        icon={Icons.editCertificate}
                    />
                </View>
            }
        />
    );
};

export default Admin;

const ListItem = ({ title, onPress, icon }) => (
    <List.Item
        title={title}
        style={styles.item}
        titleStyle={styles.itemTitle}
        onPress={onPress}
        left={() => <List.Icon icon={icon} />}
    />
);

const styles = StyleSheet.create({
    header: {
        flex: 1,
        justifyContent: 'center',
    },
    options: {
        width: '85%',
    },
    body: {
        width: '100%',
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 30,
        fontFamily: 'Poppins-ExtraBold',
        color: Colors.black,
    },
    upload: {
        marginTop: 20,
    },
});
