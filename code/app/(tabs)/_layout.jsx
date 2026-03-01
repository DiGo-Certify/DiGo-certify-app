import React, { useState, useEffect } from 'react';
import { BottomNavigation } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Constants & Components
import Colors from '@/constants/colors';
import icons from '@/constants/icons';
import ProfileScreen from './profile';
import ValidationScreen from './validation';
import HomeScreen from './home/index';
import AdminScreen from './admin';
import { USER_TYPES, STORAGE_KEYS } from '@/constants/app';
import { getValueFor } from '@/services/storage/storage';

const HomeRoute = () => <HomeScreen />;
const ProfileRoute = () => <ProfileScreen />;
const ValidationRoute = () => <ValidationScreen />;
const AdminRoute = () => <AdminScreen />;

function TabLayout() {
    const [idx, setIdx] = useState(0);

    const [routes, setRoutes] = useState([
        { key: 'home', title: 'Home', focusedIcon: icons.home },
        { key: 'profile', title: 'Profile', focusedIcon: icons.profile },
        { key: 'validation', title: 'Validation', focusedIcon: icons.certificate },
    ]);

    const [userType, setUserType] = useState(null);

    useEffect(() => {
        const getUserType = async () => {
            try {
                let storedType = await getValueFor(STORAGE_KEYS.USER_TYPE);

                try {
                    const parsed = JSON.parse(storedType);
                    if (parsed && parsed.type) storedType = parsed.type;
                } catch (e) {}

                setUserType(storedType || USER_TYPES.DEFAULT);
            } catch (error) {
                console.log('Error loading user type:', error);
                setUserType(USER_TYPES.DEFAULT);
            }
        };
        getUserType();
    }, []);

    useEffect(() => {
        if (!userType) return;

        const typeValue = typeof userType === 'object' && userType.type ? userType.type : userType;

        let availableRoutes;

        console.log('Configuring tabs for user type:', typeValue);

        switch (typeValue) {
            case USER_TYPES.ADMIN:
                availableRoutes = [
                    { key: 'profile', title: 'Profile', focusedIcon: icons.profile },
                    { key: 'admin', title: 'Admin', focusedIcon: icons.admin || 'shield-account' }, // Added fallback icon
                    { key: 'validation', title: 'Validation', focusedIcon: icons.certificate },
                ];
                break;

            case USER_TYPES.GUEST:
                availableRoutes = [{ key: 'validation', title: 'Validation', focusedIcon: icons.certificate }];
                break;

            case USER_TYPES.DEFAULT:
            default: // Fallback for any unknown type
                availableRoutes = [
                    { key: 'home', title: 'Home', focusedIcon: icons.home },
                    { key: 'profile', title: 'Profile', focusedIcon: icons.profile },
                    { key: 'validation', title: 'Validation', focusedIcon: icons.certificate },
                ];
                break;
        }

        setRoutes(availableRoutes);

        // Reset index to 0 to avoid out-of-bounds errors if the new list is shorter
        if (idx >= availableRoutes.length) {
            setIdx(0);
        }
    }, [userType]);

    const renderScene = BottomNavigation.SceneMap({
        home: HomeRoute,
        profile: ProfileRoute,
        validation: ValidationRoute,
        admin: AdminRoute,
    });

    return (
        <>
            <BottomNavigation
                navigationState={{ index: idx, routes }}
                onIndexChange={setIdx}
                renderScene={renderScene}
                barStyle={{ backgroundColor: Colors.grey || '#f0f0f0' }}
                activeIndicatorStyle={{ backgroundColor: Colors.white || '#fff' }}
                sceneAnimationEnabled={false} // Makes switching tabs snappier
            />
            <StatusBar backgroundColor={Colors.grey} style="light" />
        </>
    );
}

export default TabLayout;
