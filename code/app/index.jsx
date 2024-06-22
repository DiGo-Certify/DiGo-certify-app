import '@walletconnect/react-native-compat';
import React, { useState, useEffect } from 'react';
import SignIn from './(auth)/sign-in';
import { Redirect } from 'expo-router';
import { getValueFor } from '@/services/storage/storage';

// A possibility of the decision to decide what the first screen should be
function App() {
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        getValueFor('user_info').then(info => setUserInfo(info));
    }, []);

    return userInfo ? <Redirect to="/(tabs)/profile" /> : <SignIn />;
}

export default App;
