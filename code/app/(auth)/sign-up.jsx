import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Alert, Dimensions } from 'react-native';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import Background from '@/components/Background';
import Images from '@/constants/images';
import HeaderImage from '@/components/HeaderImage';
import { save } from '@/services/storage/storage';

function SignUp() {
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        username: '',
        email: '',
    });

    const handleSubmit = async () => {
        if (form.username === '' || form.email === '') {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            const year = new Date().getFullYear();
            const data = { ...form, year };
            await save('user_info', JSON.stringify(data));
            router.replace('/profile');
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Background
            header={
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <HeaderImage imageSource={Images.splashScreenImage} />
                </View>
            }
            body={
                <View style={{ width: '100%', paddingHorizontal: 30, marginTop: -35 }}>
                    <Text style={styles.registerText}>Register</Text>
                    <FormField
                        label="Username"
                        icon="account"
                        onChange={text => setForm({ ...form, username: text })}
                        style={styles.inputField}
                    />
                    <FormField
                        label="Email"
                        icon="email"
                        onChange={text => setForm({ ...form, email: text })}
                        style={styles.inputField}
                    />
                </View>
            }
            footer={
                <View style={{ width: '100%', alignItems: 'flex-end', paddingHorizontal: 30, marginTop: -150 }}>
                    <ActionButton
                        text="Register"
                        onPress={handleSubmit}
                        buttonStyle={styles.registerButton}
                        textStyle={styles.registerButtonText}
                        isLoading={isSubmitting}
                        color={Colors.green}
                    />
                </View>
            }
        />
    );
}

export default SignUp;

const styles = StyleSheet.create({
    inputField: {
        justifyContent: 'center',
        marginTop: 20,
        borderRadius: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.sonicSilver,
    },
    registerText: {
        fontSize: 40,
        fontWeight: '900',
        alignSelf: 'flex-start',
    },
    forgotPasswordText: {
        textDecorationLine: 'underline',
        alignSelf: 'flex-end',
        fontSize: 20,
    },
    registerButton: {
        alignSelf: 'flex-end',
        marginTop: 20,
        borderRadius: 10,
    },

    registerButtonText: {
        fontSize: 20,
        lineHeight: 50,
        fontFamily: 'Poppins-Bold',
        color: '#FFF',
    },
});
