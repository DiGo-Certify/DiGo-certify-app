import { View, Text, StyleSheet, Alert } from 'react-native';
import React, { useReducer, useEffect } from 'react';
import Background from '@/components/Background';
import HeaderImage from '@/components/HeaderImage';
import Images from '@/constants/images';
import Colors from '@/constants/colors';
import FormField from '@/components/FormField';
import ClickableText from '@/components/ClickableText';
import ActionButton from '@/components/ActionButton';
import { router } from 'expo-router';
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
            switch (action.type) {
                case ACTIONS.EDIT:
                    return {
                        ...state,
                        inputs: {
                            ...state.inputs,
                            [action.inputName]: action.inputValue,
                        },
                    };
                case ACTIONS.SUBMIT:
                    return { ...state, tag: STATES.SUBMITTING, email: state.inputs.email };
                default:
                    logUnexpectedAction(state, action);
                    return state;
            }
        case STATES.SUBMITTING:
            switch (action.type) {
                case ACTIONS.ERROR:
                    return {
                        ...state,
                        tag: STATES.EDITING,
                        error: action.message,
                        inputs: { ...state.inputs, password: '' },
                    };
                case ACTIONS.SUCCESS:
                    return { ...state, tag: STATES.REDIRECT, email: state.email };
                default:
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

function delay(delayInMs) {
    return new Promise(resolve => {
        setTimeout(() => resolve(undefined), delayInMs);
    });
}

async function authenticate(email, password) {
    await delay(3000);
    if (email === 'admin' && password === 'admin') {
        return { email: 'admin' };
    } else {
        throw new Error('Invalid credentials');
    }
}

const SignIn = () => {
    const [state, dispatch] = useReducer(reduce, {
        tag: STATES.EDITING,
        inputs: {
            email: '',
            password: '',
        },
    });

    useEffect(() => {
        if (state.tag === STATES.REDIRECT) {
            save('user_info', JSON.stringify({ user: state.email })).then(() => {
                router.push('/profile');
            });
        }
    }, [state.tag]);

    const handleChange = (name, value) => {
        dispatch({ type: ACTIONS.EDIT, inputName: name, inputValue: value });
    };

    const handleSubmit = () => {
        if (state.tag !== STATES.EDITING) {
            return;
        }
        dispatch({ type: ACTIONS.SUBMIT });
        const { email, password } = state.inputs;
        authenticate(email, password)
            .then(res => {
                if (res) {
                    dispatch({ type: ACTIONS.SUCCESS });
                } else {
                    dispatch({ type: ACTIONS.ERROR, message: 'Invalid credentials' });
                }
            })
            .catch(err => {
                dispatch({ type: ACTIONS.ERROR, message: err.message });
            });
    };

    const email = state.tag === STATES.SUBMITTING ? state.email : state.inputs.email;
    const password = state.tag === STATES.SUBMITTING ? '' : state.inputs.password;

    return (
        <Background
            header={
                <View style={styles.header}>
                    <HeaderImage imageSource={Images.splashScreenImage} />
                </View>
            }
            body={
                <View style={styles.body}>
                    <Text style={styles.loginText}>Login</Text>
                    <FormField
                        label="Email"
                        icon="email"
                        value={email}
                        onChange={e => handleChange('email', e)}
                        style={styles.inputField}
                    />
                    <FormField
                        label="Password"
                        icon="lock"
                        value={password}
                        onChange={e => handleChange('password', e)}
                        secure={true}
                        style={styles.inputField}
                    />
                    {state.tag === STATES.EDITING && <Text style={{ color: 'red' }}>{state.error}</Text>}
                </View>
            }
            footer={
                <View style={styles.footer}>
                    <View style={{flexDirection:'row'}}>
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
                        isLoading={state.tag === STATES.SUBMITTING}
                        color={Colors.green}
                    />
                </View>
            }
        />
    );
};

export default SignIn;

const styles = StyleSheet.create({
    header: { flex: 1, justifyContent: 'center' },
    body: { width: '100%', paddingHorizontal: 30 },
    footer: { width: '100%', alignItems: 'flex-end', paddingHorizontal: 30, marginTop: -230},
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
