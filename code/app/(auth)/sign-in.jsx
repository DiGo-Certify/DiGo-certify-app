import { View, Text, StyleSheet, Alert } from 'react-native';
import React, { useState, useReducer } from 'react';
import Background from '@/components/Background';
import HeaderImage from '@/components/HeaderImage';
import Images from '@/constants/images';
import Colors from '@/constants/Colors';
import FormField from '@/components/FormField';
import ClickableText from '@/components/ClickableText';
import ActionButton from '@/components/ActionButton';
import { router } from 'expo-router';

const ACTIONS = {
    EDIT: 'edit',
    SUBMIT: 'submit',
    ERROR: 'error',
    SUCCESS: 'success',
};

const initialState = {
    tag: 'editing',
    error: undefined,
    inputs: {
        email: '',
        password: '',
    },
};

function reducer(state, action) {
    switch (action.type) {
        case ACTIONS.EDIT:
            return {
                ...state,
                tag: 'editing',
                inputs: {
                    ...state.inputs,
                    [action.inputName]: action.inputValue,
                },
            };
        case ACTIONS.SUBMIT:
            return { tag: 'submitting', email: state.inputs.email };
        case ACTIONS.ERROR:
            return { tag: 'editing', error: action.message, inputs: state.inputs };
        case ACTIONS.SUCCESS:
            return { tag: 'redirect' };
        default:
            return state;
    }
}

//Simulating function

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

// const SignIn = () => {
//     const [state, dispatch] = useReducer(reducer, initialState);
//     const [isSubmitting, setSubmitting] = useState(false);
//     const [form, setForm] = useState({
//         email: '',
//         password: '',
//     });

//     if (state.tag === 'redirect') {
//         router.push('/profile');
//     }

//     const handleSubmit = async () => {
//         if (form.email === '' || form.password === '') {
//             Alert.alert('Error', 'Please fill in all fields');
//             return;
//         }

//         setSubmitting(true);
//         try {
//             // const result = await createUser(form.email, form.password, form.username);
//             // setUser(result);
//             // setIsLogged(true);

//             router.push('/profile');
//         } catch (error) {
//             Alert.alert('Error', error.message);
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     return (
//         <Background
//             header={
//                 <View style={{ flex: 1, justifyContent: 'center' }}>
//                     <HeaderImage imageSource={Images.splashScreenImage} />
//                 </View>
//             }
//             body={
//                 <View style={{ width: '100%', paddingHorizontal: 30 }}>
//                     <Text style={styles.loginText}>Login</Text>
//                     <FormField
//                         label="Email"
//                         icon="email"
//                         onChange={text => setForm({ ...form, email: text })}
//                         style={styles.inputField}
//                     />
//                     <FormField
//                         label="Password"
//                         icon="lock"
//                         onChange={text => setForm({ ...form, password: text })}
//                         secure={true}
//                         style={styles.inputField}
//                     />
//                 </View>
//             }
//             footer={
//                 <View style={{ width: '100%', alignItems: 'flex-end', paddingHorizontal: 30, marginTop: -200 }}>
//                     <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
//                         <ClickableText
//                             text="Create an account"
//                             onPress={() => router.replace('/sign-up')}
//                             style={styles.dontHaveAccountText}
//                         />
//                         <Text style={{ marginHorizontal: 3, fontSize: 20 }}> • </Text>
//                         <ClickableText text="Can't Login?" onPress={() => {}} style={styles.forgotPasswordText} />
//                     </View>
//                     <ActionButton
//                         text="Login"
//                         onPress={handleSubmit}
//                         buttonStyle={styles.loginButton}
//                         textStyle={styles.loginButtonText}
//                         isLoading={isSubmitting}
//                         color={Colors.green}
//                     />
//                 </View>
//             }
//         />
//     );
// };

const SignIn = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    if (state.tag === 'redirect') {
        router.push('/profile');
    }
    console.log(state);
    function handleChange(name, value) {
        dispatch({ type: ACTIONS.EDIT, inputName: name, inputValue: value });
    }

    function handleSubmit() {
        if (state.tag !== 'editing') {
            return;
        }
        dispatch({ type: ACTIONS.SUBMIT });
        const email = state.inputs.email;
        const password = state.inputs.password;
        authenticate(email, password)
            .then(res => {
                console.log('res', res);
                if (res) {
                    //setUser(res);
                    dispatch({ type: ACTIONS.SUCCESS });
                } else {
                    console.log('Invalid credentials');
                    dispatch({ type: ACTIONS.ERROR, message: 'Invalid credentials' });
                }
            })
            .catch(err => {
                dispatch({ type: ACTIONS.ERROR, message: err.message });
            });
    }

    const email = state.tag === 'submitting' ? state.email : state.inputs.email;
    const password = state.tag === 'submitting' ? '' : state.inputs.password;
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
                    {state.tag === 'editing' && <Text style={{ color: 'red' }}>{state.error}</Text>}
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
                        isLoading={state.tag === 'submitting'}
                        color={Colors.green}
                    />
                </View>
            }
        />
    );
};

export default SignIn;

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
