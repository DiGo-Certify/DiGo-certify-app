import React, { useEffect, useReducer } from 'react';
import { View, StyleSheet, Text, Alert, Dimensions } from 'react-native';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import Background from '@/components/Background';
import Images from '@/constants/images';
import HeaderImage from '@/components/HeaderImage';
import { save } from '@/services/storage/storage';

const ACTIONS = {
    EDIT: 'edit',
    SUBMIT: 'submit',
    ERROR: 'error',
    SUCCESS: 'success',
};

const STATES = {
    EDITING: 'editing',
    SUBMITTING: 'submitting',
    REDIRECT: 'redirect',
};

function reduce(state, action) {
    switch (state.tag) {
        case STATES.EDITING:
            if (action.type === ACTIONS.EDIT) {
                return {
                    ...state,
                    inputs: {
                        ...state.inputs,
                        [action.inputName]: action.inputValue,
                    },
                };
            } else if (action.type === ACTIONS.SUBMIT) {
                return { ...state, tag: STATES.SUBMITTING, email: state.inputs.email };
            } else {
                logUnexpectedAction(state, action);
                return state;
            }
        case STATES.SUBMITTING:
            if (action.type === ACTIONS.ERROR) {
                return {
                    ...state,
                    tag: STATES.EDITING,
                    error: action.message,
                    inputs: { ...state.inputs, password: '' },
                };
            } else if (action.type === ACTIONS.SUCCESS) {
                return { ...state, tag: STATES.REDIRECT, email: state.email };
            } else {
                logUnexpectedAction(state, action);
                return state;
            }
        case STATES.REDIRECT:
            logUnexpectedAction(state, action);
            return state;
        default:
            return state;
    }
}

function logUnexpectedAction(state, action) {
    console.log('Unexpected action', action, 'for state', state);
}

const firstState = {
    tag: STATES.EDITING,
    inputs: {
        username: '',
        email: '',
    },
};

function SignUp() {
    const [state, dispatch] = useReducer(reduce, firstState);

    if (state.tag === STATES.REDIRECT) {
        // Redirect to a specific page after successful registration
        router.replace('/profile');
    }

    async function register(form) {
        try {
            if (username === '' || email === '') {
                dispatch({ type: ACTIONS.ERROR, message: 'Please fill in all fields.' });
                return;
            }

            const year = new Date().getFullYear();
            const data = { ...form, year };
            await save('user_info', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            console.error('Error during registration:', error, { form });
            return { success: false, error };
        }
    }

    const handleSubmit = () => {
        if (state.tag !== STATES.EDITING) {
            return;
        }

        dispatch({ type: ACTIONS.SUBMIT });
        const { username, email } = state.inputs;
        register({ username, email })
            .then(res => {
                if (res.success) {
                    dispatch({ type: ACTIONS.SUCCESS });
                } else {
                    dispatch({ type: ACTIONS.ERROR, message: 'Registration failed. Please try again.' });
                }
            })
            .catch(err => {
                dispatch({ type: ACTIONS.ERROR, message: err.message });
            });
    };

    function handleChange(name, value) {
        dispatch({ type: ACTIONS.EDIT, inputName: name, inputValue: value });
    }

    const { username, email } =
        state.tag === STATES.SUBMITTING ? { username: state.username, email: state.email } : state.inputs;
    const isSubmitting = state.tag === STATES.SUBMITTING;
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
                        onChange={e => handleChange('username', e)}
                        value={username}
                        style={styles.inputField}
                    />
                    <FormField
                        label="Email"
                        icon="email"
                        onChange={e => handleChange('email', e)}
                        value={email}
                        style={styles.inputField}
                    />
                    {state.tag === STATES.EDITING && state.error && <Text style={{ color: 'red' }}>{state.error}</Text>}
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
