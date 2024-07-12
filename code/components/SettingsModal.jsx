import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Portal, Modal } from 'react-native-paper';
import Colors from '@/constants/colors';
import ActionButton from '@/components/ActionButton';

const SettingsModal = ({ isVisible, onDismiss, onChangeWallet, onRequestAdmin }) => {
    return (
        <Portal>
            <Modal visible={isVisible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
                <Text style={styles.title}>Settings</Text>
                <View style={styles.body}>
                    <ActionButton
                        icon="wallet"
                        text="Change Wallet"
                        onPress={onChangeWallet}
                        textStyle={styles.buttonText}
                        buttonStyle={styles.button}
                    />
                    <ActionButton
                        icon="shield"
                        text="Request Admin Permissions"
                        onPress={onRequestAdmin}
                        textStyle={styles.buttonText}
                        buttonStyle={styles.button}
                    />
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 10,
    },
    header: {
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 20,
        alignSelf: 'center',
        fontFamily: 'Poppins-Bold',
    },
    body: {
        marginTop: 20,
    },
    button: {
        marginTop: 10,
        backgroundColor: Colors.green,
    },
    buttonText: {
        color: Colors.black,
    },
});

export default SettingsModal;
