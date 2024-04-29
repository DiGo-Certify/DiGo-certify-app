import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, Alert } from 'react-native';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import FormField from '@/components/FormField';
import ClickableText from '@/components/ClickableText';
import ActionButton from '@/components/ActionButton';

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
        }
        if (form.password !== form.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
        }

        setSubmitting(true);
        try {
            // const result = await createUser(form.email, form.password, form.username);
            // setUser(result);
            // setIsLogged(true);

            router.replace('/home');
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
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
            <ClickableText text="Forgot Password?" onPress={() => {}} style={styles.forgotPasswordText} />
            <ActionButton
                text="Register"
                onPress={handleSubmit}
                buttonStyle={styles.registerButton}
                textStyle={styles.registerButtonText}
                isLoading={isSubmitting}
            />
        </View>
    );
}

export default SignUp;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.backgroundColor,
    },
    inputField: {
        width: '85%',
        marginTop: 24,
        borderBottomWidth: 2,
        borderBottomColor: Colors.sonicSilver,
    },
    registerText: {
        marginTop: 90,
        fontSize: 40,
        fontWeight: '900',
    },
    forgotPasswordText: {
        textDecorationLine: 'underline',
        alignSelf: 'flex-end',
        marginTop: 20,
        marginRight: 30,
        fontSize: 20,
    },
    registerButton: {
        alignSelf: 'flex-end',
        marginTop: 75,
        marginRight: 20,
        backgroundColor: Colors.green,
        padding: 10,
        borderRadius: 10,
        width: '45%',
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '900',
    },
});
