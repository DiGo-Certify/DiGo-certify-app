import { View, Text, StyleSheet, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import Images from '@/constants/images';
import Colors from '@/constants/colors';
import ActionButton from '@/components/ActionButton';
import HeaderImage from '@/components/HeaderImage';
import FormField from '@/components/FormField';
import Background from '@/components/Background';

const Emission = () => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        studentNumber: '',
        registerNumber: '',
        walletID: '',
    });

    const handleEmit = () => {
        if (form.studentNumber === '' || form.registerNumber === '' || form.walletID === '') {
            Alert.alert('Warning', 'Please fill in all fields');
            return;
        }
        // Emit certificate
        setSubmitting(true);
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
                    <HeaderImage imageSource={Images.splashScreenImage} />
                </View>
            }
            body={
                <View style={styles.body}>
                    <Text style={styles.title}>Certificate Emission</Text>
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
                        secure={true}
                        style={styles.inputField}
                    />
                    <FormField
                        label="Wallet ID"
                        icon="wallet"
                        onChange={text => setForm({ ...form, walletID: text })}
                        style={styles.inputField}
                    />
                </View>
            }
            footer={
                <View style={{ width: '100%', alignItems: 'center', paddingHorizontal: 30, marginTop: -120 }}>
                    <ActionButton
                        text="Upload Certificate"
                        mode="contained"
                        icon={'file-upload'}
                        onPress={() => {}}
                        color={Colors.green}
                        buttonStyle={styles.upload}
                    />
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
    header: { flex: 1, justifyContent: 'center' },
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
        width: '100%',
        paddingHorizontal: 30,
        marginTop: -25,
    },
    title: {
        fontSize: 30,
        fontFamily: 'Poppins-ExtraBold',
        color: Colors.black,
    },
    upload: {
        marginTop: 20
    }
});
