import { View, Text, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Appbar, Title } from 'react-native-paper';
import { router } from 'expo-router';
import Images from '@/constants/images';
import Colors from '@/constants/colors';
import ActionButton from '@/components/ActionButton';
import HeaderImage from '@/components/HeaderImage';
import FormField from '@/components/FormField';
import Background from '@/components/Background';
import App from '.';

const Emission = () => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        studentNumber: '',
        registerNumber: '',
        courseID: '',
        institutionID: '',
        walletID: '',
    });

    const handleEmit = () => {
        if (!Object.values(form).every(field => field !== '')) {
            Alert.alert('Warning', 'Please fill in all fields');
            return;
        }
        // Emit certificate
        setSubmitting(true);
    };

    const handleUpload = () => {
        // Upload certificate
    };

    useEffect(() => {
        if (isSubmitting) {
            // Simulate certificate emission
            setTimeout(() => {
                setSubmitting(false);
            }, 2000);
        }
    }, [isSubmitting]);

    return (
        <Background
            header={
                <View style={styles.header}>
                    <Appbar.Header style={styles.topHeader}>
                        <Appbar.BackAction onPress={() => router.back()} />
                        <Appbar.Content title="Certificate Emission" titleStyle={{ fontFamily: 'Poppins-SemiBold' }} />
                    </Appbar.Header>
                    <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <HeaderImage imageSource={Images.splashScreenImage} />
                    </View>
                </View>
            }
            body={
                <View style={styles.body}>
                    <Title style={styles.title}>Send Certificate</Title>
                    <ScrollView contentContainerStyle={styles.body}>
                        <FormField
                            label="Student Number"
                            icon="account-check"
                            onChange={text => setForm({ ...form, studentNumber: text })}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Register Number"
                            icon="registered-trademark"
                            onChange={text => setForm({ ...form, registerNumber: text })}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Course ID"
                            icon="book"
                            onChange={text => setForm({ ...form, courseID: text })}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Institution ID"
                            icon="school"
                            onChange={text => setForm({ ...form, institutionID: text })}
                            style={styles.inputField}
                        />
                        <FormField
                            label="Wallet ID"
                            icon="wallet"
                            onChange={text => setForm({ ...form, walletID: text })}
                            style={styles.inputField}
                        />
                        <ActionButton
                            text="Upload Certificate"
                            mode="contained"
                            icon={'file-upload'}
                            onPress={handleUpload}
                            color={Colors.green}
                            buttonStyle={styles.upload}
                        />
                    </ScrollView>
                </View>
            }
            footer={
                <View style={styles.footer}>
                    <ActionButton
                        text="Emit Certificate"
                        onPress={handleEmit}
                        buttonStyle={styles.emitButton}
                        textStyle={styles.emitButtonText}
                        isLoading={isSubmitting}
                        mode={'elevated'}
                        color={Colors.backgroundColor}
                    />
                </View>
            }
        />
    );
};

export default Emission;

const styles = StyleSheet.create({
    topHeader: {
        widht: '100%',
        backgroundColor: Colors.solitudeGrey,
    },
    header: { flex: 1, width: '100%', justifyContent: 'center', marginBottom: 20 },
    inputField: {
        justifyContent: 'center',
        marginTop: 20,
        borderRadius: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.sonicSilver,
    },
    emitButton: {
        marginTop: 50,
        borderRadius: 16,
        borderWidth: 4,
        borderColor: Colors.white,
        elevation: 5,
    },
    emitButtonText: {
        fontSize: 30,
        lineHeight: 40,
        fontFamily: 'Poppins-ExtraBold',
        color: Colors.black,
    },
    body: {
        justifyContent: 'center',
        paddingBottom: 20,
        marginBottom: 20,
    },
    title: {
        paddingTop: 5,
        fontSize: 30,
        fontFamily: 'Poppins-ExtraBold',
        color: Colors.black,
    },
    upload: {
        marginTop: 20,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginTop: -86,
        paddingTop: 20,
    },
});
