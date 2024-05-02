import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, Dimensions } from 'react-native';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import FormField from '@/components/FormField';
import ClickableText from '@/components/ClickableText';
import ActionButton from '@/components/ActionButton';
import Background from '@/components/Background';
import Images from '@/constants/images';
import HeaderImage from '@/components/HeaderImage';

function SignUp() {
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async () => {
        if (form.username === '' || form.email === '' || form.password === '' || form.confirmPassword === '') {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (form.password !== form.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setSubmitting(true);
        try {
            // const result = await createUser(form.email, form.password, form.username);
            // setUser(result);
            // setIsLogged(true);

            router.push('/profile');
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
                        label="Full Name"
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
                    <FormField
                        label="Password"
                        icon="lock"
                        onChange={text => setForm({ ...form, password: text })}
                        secure={true}
                        style={styles.inputField}
                    />
                    <FormField
                        label="Confirm Password"
                        icon="lock"
                        onChange={text => setForm({ ...form, confirmPassword: text })}
                        secure={true}
                        style={styles.inputField}
                    />
                </View>
            }
            footer={
                <View style={{ width: '100%', alignItems: 'flex-end', paddingHorizontal: 30, marginTop: -98 }}>
                    <ClickableText
                        text="Already have an Account?"
                        onPress={() => router.replace('/sign-in')}
                        style={styles.forgotPasswordText}
                    />
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
