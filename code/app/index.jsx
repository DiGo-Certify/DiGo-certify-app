import '@walletconnect/react-native-compat';
import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import SignIn from './(auth)/sign-in';
import Profile from './(tabs)/profile';
import InitialScreen from './initial-screen/initial-screen';

// A possibility of the decision to decide what the first screen should be
function App() {
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        getValueFor('user_info').then(info => setUserInfo(info));
    }, []);

    return userInfo ? <Profile /> : <SignIn />;
}

async function save(key, value) {
    await SecureStore.setItemAsync(key, value);
}

async function getValueFor(key) {
    let result = await SecureStore.getItemAsync(key);
    if (result) {
        return JSON.parse(result);
    } else {
        return null;
    }
}

export default App;
