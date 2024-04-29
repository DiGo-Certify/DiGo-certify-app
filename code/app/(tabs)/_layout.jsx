import React from 'react';
import { Image, Text, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import Colors from '../../constants/colors';
import Icons from '../../constants/icons';

const TabIcon = ({ icon, color, name, focused }) => {
    return (
        <View className="flex items-center justify-center gap-2">
            <Image source={icon} resizeMode="contain" tintColor={color} className="w-6 h-6" />
            <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs`} style={{ color: color }}>
                {name}
            </Text>
        </View>
    );
};

function TabLayout() {
    // const { loading, isLogged} = useGlobalContext();
    // if (!loading && !isLogged) return <Redirect href="/initial-screen" />;

    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        backgroundColor: 'transparent',
                        borderTopWidth: 0,
                        elevation: 0,
                    },
                    tabBarActiveTintColor: '#000',
                    tabBarInactiveTintColor: '#ccc',
                }}
            >
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon icon={icons.profile} color={color} name="Profile" focused={focused} />
                        ),
                    }}
                />
            </Tabs>

            <Loader isLoading={loading} />
            <StatusBar backgroundColor={Colors.grey} style="light" />
        </>
    );
}

export default TabLayout;
