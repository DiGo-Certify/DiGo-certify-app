import Loader from '@/components/Loader';
import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

function AuthLayout() {
    // const { loading, isLogged } = useAppContext();
    // if (!loading && isLogged) return <Redirect href="/home" />;

    return (
        <>
            <Stack>
                <Stack.Screen
                    name="sign-in"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="sign-up"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>

            {/* <Loader isLoading={loading} /> */}
            <StatusBar backgroundColor="#161622" style="light" />
        </>
    );
}

export default AuthLayout;
