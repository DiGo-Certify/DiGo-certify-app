import { View, Text, StyleSheet, Alert } from 'react-native';
import React from 'react';
import { useState } from 'react';
import Background from '@/components/Background';
import HeaderImage from '@/components/HeaderImage';
import Images from '@/constants/images';
import Colors from '@/constants/colors';
import FormField from '@/components/FormField';
import ClickableText from '@/components/ClickableText';
import ActionButton from '@/components/ActionButton';
import { router } from 'expo-router';

const SignIn = () => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async () => {
        if (form.email === '' || form.password === '') {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            // const result = await createUser(form.email, form.password, form.username);
            // setUser(result);
            // setIsLogged(true);

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
                <View style={{ width: '100%', paddingHorizontal: 30 }}>
                    <Text style={styles.loginText}>Login</Text>
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
                </View>
            }
            footer={
                <View style={{ width: '100%', alignItems: 'flex-end', paddingHorizontal: 30, marginTop: -200 }}>
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                        <ClickableText
                            text="Create an account"
                            onPress={() => router.replace('/sign-up')}
                            style={styles.dontHaveAccountText}
                        />
                        <Text style={{ marginHorizontal: 3, fontSize: 20 }}> • </Text>
                        <ClickableText text="Can't Login?" onPress={() => {}} style={styles.forgotPasswordText} />
                    </View>
                    <ActionButton
                        text="Login"
                        onPress={handleSubmit}
                        buttonStyle={styles.loginButton}
                        textStyle={styles.loginButtonText}
                        isLoading={isSubmitting}
                        color={Colors.green}
                    />
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
    inputField: {
        justifyContent: 'center',
        marginTop: 20,
        borderRadius: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.sonicSilver,
    },
    loginText: {
        fontSize: 40,
        fontWeight: '900',
        alignSelf: 'flex-start',
    },
    forgotPasswordText: {
        textDecorationLine: 'underline',
        alignSelf: 'flex-end',
        fontSize: 20,
    },
    loginButton: {
        alignSelf: 'flex-end',
        marginTop: 20,
        borderRadius: 10,
    },

    loginButtonText: {
        fontSize: 20,
        lineHeight: 50,
        fontFamily: 'Poppins-Bold',
        color: '#FFF',
    },
    dontHaveAccountText: {
        textDecorationLine: 'underline',
        alignSelf: 'flex-start',
        fontSize: 20,
    },
});

export default SignIn;
