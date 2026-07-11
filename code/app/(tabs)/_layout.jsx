import React, { useEffect, useMemo, useState } from 'react';
import { BottomNavigation } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import Colors from '@/constants/colors';
import icons from '@/constants/icons';
import ProfileScreen from './profile';
import ValidationScreen from './validation';
import HomeScreen from './home/index';
import AdminScreen from './admin';
import { USER_TYPES } from '@/constants/app';
import { useSession } from '@/contexts/SessionContext';

const HomeRoute = () => <HomeScreen />;
const ProfileRoute = () => <ProfileScreen />;
const ValidationRoute = () => <ValidationScreen />;
const AdminRoute = () => <AdminScreen />;

function TabLayout() {
    const [idx, setIdx] = useState(0);
    const { userType } = useSession();
    const type = userType?.type || userType || USER_TYPES.DEFAULT;

    const routes = useMemo(() => {
        switch (type) {
            case USER_TYPES.ADMIN:
                return [
                    { key: 'profile', title: 'Profile', focusedIcon: icons.profile },
                    { key: 'admin', title: 'Admin', focusedIcon: icons.admin },
                    { key: 'validation', title: 'Validation', focusedIcon: icons.certificate },
                ];
            case USER_TYPES.GUEST:
                return [{ key: 'validation', title: 'Validation', focusedIcon: icons.certificate }];
            case USER_TYPES.DEFAULT:
            default:
                return [
                    { key: 'home', title: 'Home', focusedIcon: icons.home },
                    { key: 'profile', title: 'Profile', focusedIcon: icons.profile },
                    { key: 'validation', title: 'Validation', focusedIcon: icons.certificate },
                ];
        }
    }, [type]);

    useEffect(() => {
        if (idx >= routes.length) {
            setIdx(0);
        }
    }, [idx, routes.length]);

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
                sceneAnimationEnabled={false}
            />
            <StatusBar backgroundColor={Colors.grey} style="light" />
        </>
    );
}

export default TabLayout;
