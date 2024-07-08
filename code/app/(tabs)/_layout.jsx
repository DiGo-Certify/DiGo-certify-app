import React, { useState, useEffect } from 'react';
import Colors from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import icons from '@/constants/icons';
import { BottomNavigation } from 'react-native-paper';
import ProfileScreen from './profile';
import ValidationScreen from './validation';
import EmissionScreen from './emission';
import HomeScreen from './home';
import AdminScreen from './admin';
import * as SecureStore from 'expo-secure-store';

const HomeRoute = () => <HomeScreen />;
const ProfileRoute = () => <ProfileScreen />;
const ValidationRoute = () => <ValidationScreen />;
const AdminRoute = () => <AdminScreen />;
const EmissionRoute = () => <EmissionScreen />;

const USER_TYPES = {
    Admin: 'Admin',
    Guest: 'Guest',
    Default: 'Default',
};

function TabLayout() {
    const [idx, setIdx] = useState(0);
    const [routes, setRoutes] = useState([{ key: 'validation', title: 'Validation', focusedIcon: icons.certificate }]);
    const [userType, setUserType] = useState(null);

    useEffect(() => {
        const getUserType = async () => {
            const userType = await SecureStore.getItemAsync('user_type');
            setUserType(JSON.parse(userType));
        };
        getUserType();
    }, []);

    useEffect(() => {
        if (!userType) return;
        const getRoutesForUserType = async () => {
            let availableRoutes;
            switch (userType.type) {
                case USER_TYPES.Admin:
                    availableRoutes = [
                        { key: 'home', title: 'Home', focusedIcon: icons.home },
                        { key: 'profile', title: 'Profile', focusedIcon: icons.profile },
                        { key: 'validation', title: 'Validation', focusedIcon: icons.certificate },
                        { key: 'emission', title: 'Emission', focusedIcon: icons.editCertificate },
                        { key: 'admin', title: 'Admin', focusedIcon: icons.admin },
                    ];
                    break;
                case USER_TYPES.Guest:
                    availableRoutes = [{ key: 'validation', title: 'Validation', focusedIcon: icons.certificate }];
                    break;
                case USER_TYPES.Default:
                    availableRoutes = [
                        { key: 'home', title: 'Home', focusedIcon: icons.home },
                        { key: 'profile', title: 'Profile', focusedIcon: icons.profile },
                        { key: 'validation', title: 'Validation', focusedIcon: icons.certificate },
                    ];
                    break;
            }
            if (availableRoutes) {
                setRoutes(availableRoutes);
            }
        };

        getRoutesForUserType();
    }, [userType]);

    const renderScene = BottomNavigation.SceneMap({
        home: HomeRoute,
        profile: ProfileRoute,
        validation: ValidationRoute,
        emission: EmissionRoute,
        admin: AdminRoute,
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
