import React from 'react';
import { Image, StyleSheet, Text, Dimensions, View } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import Images from '@/constants/images';
import colors from '@/constants/colors';

const ValidationCheck = ({ label, passed }) => (
    <View style={styles.checkRow}>
        <Text style={styles.checkLabel}>{label}</Text>
        <Text style={[styles.checkValue, passed ? styles.passText : styles.failText]}>
            {passed ? 'Passed' : 'Failed'}
        </Text>
    </View>
);

const ValidatedModal = ({ visible, onDismiss, valid, result }) => {
    const validatedImage = valid ? Images.validated : Images.invalid;
    const validatedText = valid ? 'Certificate validated with success!' : 'Certificate is invalid!';
    const checks = result?.checks || {};

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
                <Text style={styles.title}>Certificate Validation</Text>
                <Image source={validatedImage} style={styles.validatedImage} />
                <Text style={styles.text}>{validatedText}</Text>
                {result?.reason ? <Text style={styles.reason}>{result.reason}</Text> : null}
                <View style={styles.checks}>
                    <ValidationCheck label="Certificate digest" passed={!!checks.digestMatch} />
                    <ValidationCheck label="Accredited issuer" passed={!!checks.issuerTrusted} />
                    <ValidationCheck label="Claim signature" passed={!!checks.signatureValid} />
                </View>
                {result?.issuer?.institutionID ? (
                    <Text style={styles.issuer}>Institution #{result.issuer.institutionID}</Text>
                ) : null}
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
        textAlign: 'center',
    },
    reason: {
        marginTop: 8,
        textAlign: 'center',
        fontSize: 14,
        color: colors.grey,
        fontFamily: 'Poppins-Regular',
    },
    checks: {
        width: '100%',
        marginTop: 16,
        gap: 8,
    },
    checkRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    checkLabel: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: colors.black,
    },
    checkValue: {
        fontSize: 14,
        fontFamily: 'Poppins-Bold',
    },
    passText: {
        color: colors.green,
    },
    failText: {
        color: colors.error || '#D32F2F',
    },
    issuer: {
        marginTop: 12,
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: colors.grey,
    },
});
