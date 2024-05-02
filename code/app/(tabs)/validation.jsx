import { View, Text, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import Images from '@/constants/images';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import colors from '@/constants/colors';
import Background from '@/components/Background';
import HeaderImage from '@/components/HeaderImage';
import ValidatedModal from '@/components/ValidatedModal';

const Validation = () => {
    const [valid, setValid] = useState(false);

    const handleValidate = () => {
        // validate certificate
        //! Needs to be implemented
        // ...
        const valid = true;
        //
        setValid(true);
    };

    useEffect(() => {
        if (valid) {
            ValidatedModal({ visible: true, onDismiss: () => setValid(false), valid });
        }
    }, [valid]);

    return (
        <>
            <Background
                header={
                    <View style={{ marginTop: 65, height: '100%' }}>
                        <HeaderImage imageSource={Images.splashScreenImage} />
                    </View>
                }
                body={
                    <View style={{ marginTop: -25 }}>
                        <Text style={styles.title}>Certificate Validation</Text>
                        <View style={{ marginTop: 16 }}>
                            <FormField label="Insert Certificate Link" icon="certificate" />
                            <Text style={styles.or}>OR</Text>
                            <ActionButton
                                text="Scan QR Code"
                                buttonStyle={styles.qrButton}
                                textStyle={styles.qrButtonText}
                                mode={'elevated'}
                                color={colors.backgroundColor}
                            />
                        </View>
                    </View>
                }
                footer={
                    <ActionButton
                        text="Validate"
                        buttonStyle={styles.validateButton}
                        textStyle={styles.validateButtonText}
                        mode={'elevated'}
                        onPress={handleValidate}
                        color={colors.backgroundColor}
                    />
                }
            />
            <ValidatedModal visible={valid} onDismiss={() => setValid(false)} valid={valid} />
        </>
    );
};

export default Validation;

const styles = StyleSheet.create({
    title: {
        fontSize: 30,
        fontFamily: 'Poppins-ExtraBold',
    },
    or: {
        textAlign: 'center',
        marginTop: 16,
        fontFamily: 'Poppins-ExtraBold',
        fontSize: 24,
    },
    qrButton: {
        marginTop: 16,
        borderRadius: 10,
        borderWidth: 4,
        borderColor: colors.white,
    },
    qrButtonText: {
        fontSize: 24,
        lineHeight: 35,
        color: colors.black,
        fontFamily: 'Poppins-ExtraBold',
    },
    validateButton: {
        marginTop: -45,
        borderRadius: 16,
        borderWidth: 4,
        borderColor: colors.white,
        elevation: 5,
    },
    validateButtonText: {
        fontSize: 30,
        lineHeight: 40,
        width: '70%',
        fontFamily: 'Poppins-ExtraBold',
        color: colors.black,
    },
});
