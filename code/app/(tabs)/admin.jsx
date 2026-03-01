import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { List, Surface, TouchableRipple } from 'react-native-paper';
import { router } from 'expo-router';

// Components
import Background from '@/components/Background';
import HeaderImage from '@/components/HeaderImage';

// Constants
import Images from '@/constants/images';
import Colors from '@/constants/colors';
import Icons from '@/constants/icons';

const Admin = () => {
    return (
        <Background
            header={
                <View style={styles.headerContainer}>
                    <HeaderImage imageSource={Images.splashScreenImage} />
                </View>
            }
            body={
                <View style={styles.menuContainer}>
                    <Text style={styles.screenTitle}>Admin Panel</Text>

                    {/* Menu Option 1: Send New Certificate */}
                    <AdminMenuItem
                        title="Send a New Certificate"
                        icon={Icons.newCertificate || 'certificate'} // Fallback to a default icon if yours is missing
                        onPress={() => router.push('/emission')}
                    />

                    {/* Menu Option 2: View All*/}
                    <AdminMenuItem
                        title="View All Certificates"
                        icon={Icons.certificates || 'file-document-multiple'}
                        onPress={() => console.log('View Certificates clicked')}
                    />

                    {/* Menu Option 3: Edit */}
                    <AdminMenuItem
                        title="Edit Existing Certificate"
                        icon={Icons.editCertificate || 'file-edit'}
                        onPress={() => console.log('Edit clicked')}
                    />
                </View>
            }
        />
    );
};

const AdminMenuItem = ({ title, icon, onPress }) => (
    <Surface style={styles.cardSurface} elevation={2}>
        <TouchableRipple onPress={onPress} rippleColor="rgba(0, 0, 0, .1)" style={styles.touchable}>
            <List.Item
                title={title}
                titleStyle={styles.itemTitle}
                left={props => <List.Icon {...props} icon={icon} color={Colors.black} />}
                right={props => <List.Icon {...props} icon="chevron-right" color={Colors.grey} />}
            />
        </TouchableRipple>
    </Surface>
);

export default Admin;

const styles = StyleSheet.create({
    headerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        width: '100%',
        paddingHorizontal: 10,
    },
    screenTitle: {
        fontSize: 24,
        fontFamily: 'Poppins-ExtraBold',
        color: Colors.black,
        textAlign: 'center',
        marginBottom: 20,
    },
    cardSurface: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden', // Ensures the ripple doesn't leak out
    },
    touchable: {
        paddingVertical: 8,
    },
    itemTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: Colors.black,
    },
});
