import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { Tabs } from 'expo-router';
import Colors from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import icons from '@/constants/icons';
import { BottomNavigation, Text } from 'react-native-paper';
import ProfileScreen from './profile';
import CertificateScreen from './certificate';

const HomeRoute = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Home</Text>
    </View>
);

//! There must be another way to render the ProfileScreen
const ProfileRoute = () => <ProfileScreen />;

const CertificateRoute = () => <CertificateScreen />;

function TabLayout() {
    const [idx, setIdx] = useState(0);
    const [routes] = useState([
        { key: 'home', title: 'Home', focusedIcon: icons.home },
        { key: 'profile', title: 'Profile', focusedIcon: icons.profile },
        { key: 'certificate', title: 'Certificate', focusedIcon: icons.certificate },
    ]);

    const renderScene = BottomNavigation.SceneMap({
        home: HomeRoute,
        profile: ProfileRoute,
        certificate: CertificateRoute,
    });

    const validIdx = idx >= 0 && idx < routes.length ? idx : 0;

    return (
        <>
            <BottomNavigation
                navigationState={{ index: validIdx, routes }}
                onIndexChange={setIdx}
                renderScene={renderScene}
                barStyle={{ backgroundColor: Colors.grey }}
                activeIndicatorStyle={{ backgroundColor: Colors.white }}
            />
            <StatusBar backgroundColor={Colors.grey} style="light" />
        </>
    );
}

export default TabLayout;

//? Alternative way

// const TabIcon = ({ icon, color, name, focused }) => {
//     return (
//         <>
//             <Image source={icon} resizeMode="contain" tintColor={color} className="w-6 h-6" />
//             <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs`} style={{ color: color }}>
//                 {name}
//             </Text>
//         </>
//     );
// };

// function TabLayout() {
//     // const { loading, isLogged} = useGlobalContext();
//     // if (!loading && !isLogged) return <Redirect href="/initial-screen" />;

//     return (
//         <>
//             <Tabs
//                 screenOptions={{
//                     tabBarShowLabel: false,
//                     tabBarStyle: {
//                         backgroundColor: 'transparent',
//                         borderTopWidth: 0,
//                         elevation: 0,
//                     },
//                     tabBarActiveTintColor: '#000',
//                     tabBarInactiveTintColor: '#ccc',
//                 }}
//             >
//                 <Tabs.Screen
//                     name="profile"
//                     options={{
//                         title: 'Profile',
//                         headerShown: false,
//                         tabBarIcon: ({ color, focused }) => (
//                             <TabIcon icon={icons.profile} color={color} name="Profile" focused={focused} />
//                         ),
//                     }}
//                 />
//             </Tabs>

//             {/* <Loader isLoading={loading} /> */}
//             <StatusBar backgroundColor={Colors.grey} style="light" />
//         </>
//     );
// }
