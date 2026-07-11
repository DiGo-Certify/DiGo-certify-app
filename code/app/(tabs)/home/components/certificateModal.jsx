import { Linking, StyleSheet } from 'react-native';
import { Button, Text, Portal, Modal } from 'react-native-paper';
import Colors from '@/constants/colors';
import FormField from '@/components/FormField';
import { decrypt } from '@/services/ethereum/scripts/utils/encryption/aes-256';
import { useState } from 'react';
import ClickableText from '@/components/ClickableText';

/**
 * Component that renders a modal to input a private key
 */
function PasswordModal({ visible, onDismiss, encryptedURI }) {
    const [password, setPassword] = useState('');
    const [decryptedURI, setDecryptedURI] = useState('');

    const handleDecrypt = () => {
        const decrypted = decrypt(encryptedURI, password);
        setDecryptedURI(decrypted);
    };

    return (
        <Portal>
            <Modal
                animationType="slide"
                onDismiss={onDismiss}
                visible={visible}
                contentContainerStyle={styles.modalView}
            >
                <Text style={styles.modalTitle}>Enter Password</Text>
                <Text style={styles.modalSubtitleText}>Enter your password to decrypt the URI</Text>
                <FormField
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    secure={true}
                    style={styles.modalInput}
                />
                <Button
                    mode="contained"
                    onPress={handleDecrypt}
                    style={styles.modalSubmitButton}
                    labelStyle={styles.modalButtonText}
                >
                    Show certificate
                </Button>
                {decryptedURI ? (
                    <ClickableText
                        text={decryptedURI}
                        style={styles.uriText}
                        onPress={() => Linking.openURL(decryptedURI)}
                    />
                ) : null}
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modalView: {
        backgroundColor: Colors.solitudeGrey,
        padding: 24,
        marginHorizontal: 24,
        borderRadius: 8,
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: Colors.black,
    },
    modalSubtitleText: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: 'Poppins-Regular',
        color: Colors.darkGray,
        marginTop: 4,
    },
    modalInput: {
        marginTop: 16,
    },
    modalSubmitButton: {
        marginTop: 20,
        borderRadius: 8,
        backgroundColor: Colors.green,
        width: '100%',
    },
    modalButtonText: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'Poppins-Bold',
        color: Colors.black,
    },
    uriText: {
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
        marginTop: 20,
        color: Colors.url,
    },
});

export default PasswordModal;
