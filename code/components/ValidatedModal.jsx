import React from 'react';
import { Image, StyleSheet, Text, Dimensions } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import Images from '@/constants/images';

const ValidatedModal = ({ visible, onDismiss, valid }) => {
    const validatedImage = valid ? Images.validated : Images.invalid;
    const validatedText = valid ? 'Certificate validated with success!' : 'Certificate is invalid!';
    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
                <Text style={styles.title}>Certificate Validation</Text>
                <Image source={validatedImage} style={styles.validatedImage} />
                <Text style={styles.text}>{validatedText}</Text>
            </Modal>
        </Portal>
    );
};

export default ValidatedModal;

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    title: {
        fontSize: 28,
        fontFamily: 'Poppins-Bold',
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        marginHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    validatedImage: {
        width: windowWidth * 0.35,
        height: windowWidth * 0.35,
        marginVertical: 10,
    },
    text: {
        fontSize: 20,
        fontFamily: 'Poppins-Regular',
    },
});
