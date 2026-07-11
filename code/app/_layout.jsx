import '@walletconnect/react-native-compat';
import 'react-native-get-random-values';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { PaperProvider } from 'react-native-paper';
import { AppKit, AppKitProvider } from '@reown/appkit-react-native';
import { SessionProvider } from '@/contexts/SessionContext';
import { appKit } from '@/services/web3/app-kit';

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
    const [fontsLoaded, error] = useFonts({
        'Poppins-Black': require('../assets/fonts/Poppins-Black.ttf'),
        'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
        'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
        'Poppins-ExtraLight': require('../assets/fonts/Poppins-ExtraLight.ttf'),
        'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
        'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
        'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-Thin': require('../assets/fonts/Poppins-Thin.ttf'),
    });

    useEffect(() => {
        if (error) throw error;

        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, error]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <AppKitProvider instance={appKit}>
            <SessionProvider>
                <PaperProvider>
                    <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="initial-screen/index" options={{ headerShown: false }} />
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="profile-setup/index" options={{ headerShown: false }} />
                        <Stack.Screen name="emission/index" options={{ headerShown: false }} />
                        <Stack.Screen name="revoke/index" options={{ headerShown: false }} />
                    </Stack>
                    <AppKit />
                </PaperProvider>
            </SessionProvider>
        </AppKitProvider>
    );
};

export default RootLayout;
