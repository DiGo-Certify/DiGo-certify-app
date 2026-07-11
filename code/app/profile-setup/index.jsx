import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Text } from 'react-native-paper';

import ActionButton from '@/components/ActionButton';
import Background from '@/components/Background';
import FormField from '@/components/FormField';
import HeaderImage from '@/components/HeaderImage';
import Colors from '@/constants/colors';
import Images from '@/constants/images';
import { useSession } from '@/contexts/SessionContext';

function ProfileSetup() {
    const { setUserInfo } = useSession();
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        const name = displayName.trim();
        if (!name) {
            setError('Please choose a local profile name.');
            return;
        }

        setError('');
        setIsSaving(true);

        try {
            await setUserInfo({
                name,
                year: new Date().getFullYear(),
            });
            router.replace('/profile');
        } catch (profileError) {
            setError(profileError.message || 'Could not save local profile.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Background
            header={
                <View style={styles.header}>
                    <HeaderImage imageSource={Images.splashScreenImage} />
                </View>
            }
            body={
                <View style={styles.body}>
                    <Text variant="displaySmall" style={styles.title}>
                        Profile Setup
                    </Text>
                    <Text style={styles.subtitle}>
                        This profile is stored locally on this device. Your wallet remains your on-chain identity.
                    </Text>
                    <FormField
                        label="Display Name"
                        icon="account"
                        onChange={setDisplayName}
                        value={displayName}
                        style={styles.inputField}
                    />
                    {!!error && <Text style={styles.warningText}>{error}</Text>}
                </View>
            }
            footer={
                <View style={styles.footer}>
                    <ActionButton
                        text="Save"
                        onPress={handleSubmit}
                        buttonStyle={styles.saveButton}
                        textStyle={styles.saveButtonText}
                        isLoading={isSaving}
                        color={Colors.green}
                    />
                </View>
            }
        />
    );
}

export default ProfileSetup;

const styles = StyleSheet.create({
    header: {
        flex: 1,
        justifyContent: 'center',
    },
    body: {
        width: '100%',
    },
    title: {
        fontFamily: 'Poppins-Bold',
        alignSelf: 'flex-start',
    },
    subtitle: {
        marginTop: 8,
        fontFamily: 'Poppins-Regular',
        color: Colors.sonicSilver,
    },
    inputField: {
        justifyContent: 'center',
        marginTop: 20,
        borderRadius: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.sonicSilver,
    },
    footer: {
        width: '100%',
        alignItems: 'flex-end',
    },
    saveButton: {
        alignSelf: 'flex-end',
        marginTop: 20,
        borderRadius: 10,
    },
    saveButtonText: {
        fontSize: 20,
        lineHeight: 50,
        fontFamily: 'Poppins-Bold',
        color: Colors.white,
    },
    warningText: {
        marginTop: 8,
        fontFamily: 'Poppins-SemiBold',
        color: 'red',
    },
});
