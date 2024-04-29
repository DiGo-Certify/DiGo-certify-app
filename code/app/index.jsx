import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import InitialScreen from './initial-screen/initial-screen';
import ProfileScreen from './(tabs)/profile';
import SignUp from '@/app/(auth)/sign-up';
import { PaperProvider } from 'react-native-paper';

// A possibility of the decision to decide what the first screen should be
function App() {
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        getUserInfo().then(info => setUserInfo(info));
    }, []);

    // For now will always go the Initial Screen
    if (userInfo === null) {
        // return <InitialScreen />;
        return (
            <PaperProvider>
                <SignUp />
            </PaperProvider>
        );
    } else {
        return; // <ProfileScreen />; or whatever the main screen will be
    }
}

// async function saveUserInfo(userInfo) {
//     await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));
// }

async function getUserInfo() {
    let result = await SecureStore.getItemAsync('userInfo');
    if (result) {
        return JSON.parse(result);
    } else {
        return null;
    }
}

export default App;
