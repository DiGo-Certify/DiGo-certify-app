import { View, Text, StyleSheet, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import Images from '@/constants/images';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import colors from '@/constants/colors';
import Background from '@/components/Background';
import HeaderImage from '@/components/HeaderImage';
import ValidatedModal from '@/components/ValidatedModal';
import FeatureUnderDev from '@/components/FeatureUnderDev';
// import QRCodeScanner from 'react-native-qrcode-scanner';

const Validation = () => {
    const [valid, setValid] = useState(false);
    const [certificateLink, setCertificateLink] = useState('');

    const handleQRCodeScan = event => {
        // Process the scanned QR code (event.data) as needed
        console.log('Scanned QR code:', event.data);
        setCertificateLink(event.data);
    };

    const handleValidate = () => {
        // Validate the claiom that has the link to the certificate (claimTopic CERTIFICATE)
        

        setValid(true);
    };

    return (
        <>
            <Background
                header={
                    <View style={styles.header}>
                        <HeaderImage imageSource={Images.splashScreenImage} />
                    </View>
                }
                body={
                    <View>
                        <Text style={styles.title}>Certificate Validation</Text>
                        <View style={{ marginTop: 16 }}>
                            <FormField
                                label="Insert Certificate Link"
                                icon="certificate"
                                value={certificateLink}
                                onChange={link => setCertificateLink(link)}
                            />
                            <Text style={styles.or}>OR</Text>
                            {/* <QRCodeScanner
                                onRead={handleQRCodeScan}
                                showMarker={true}
                                containerStyle={{ marginTop: 16 }}
                                markerStyle={{ borderColor: 'red', borderRadius: 10 }}
                                reactivate={true}
                                permissionDialogMessage="Need permission to access camera"
                                reactivateTimeout={2000}
                                bottomContent={
                                    <Text style={{ color: 'white', fontSize: 20, marginBottom: 50 }}>
                                        Scan QR code to insert link
                                    </Text>
                                }
                            /> */}
                            <ActionButton
                                text="Scan QR Code"
                                buttonStyle={styles.qrButton}
                                textStyle={styles.qrButtonText}
                                mode={'elevated'}
                                color={colors.backgroundColor}
                                onPress={() => FeatureUnderDev()}
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
    header: {
        flex: 1,
        justifyContent: 'center',
    },
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
        marginTop: 24,
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
        marginTop: -25,
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
