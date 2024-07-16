import { Linking, StyleSheet } from 'react-native';
import { Text, Portal, Modal } from 'react-native-paper';
import Colors from '@/constants/colors';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
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
                <ActionButton
                    text="Show"
                    onPress={handleDecrypt}
                    textStyle={styles.modalButtonText}
                    buttonStyle={styles.modalSubmitButton}
                    mode={'elevated'}
                    color={Colors.backgroundColor}
                />
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
        padding: 20,
        marginHorizontal: 20,
        borderRadius: 20,
    },
    modalTitle: {
        fontSize: 28,
        fontFamily: 'Poppins-Bold',
    },
    modalSubtitleText: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        color: Colors.caution,
        marginBottom: 15,
        textAlign: 'center',
    },
    modalInput: {
        justifyContent: 'center',
        marginTop: 20,
        borderRadius: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.sonicSilver,
    },
    modalSubmitButton: {
        marginTop: 20,
        borderRadius: 16,
        borderWidth: 4,
        borderColor: Colors.white,
        backgroundColor: Colors.green,
        elevation: 5,
        alignSelf: 'center',
        width: '80%',
    },
    modalButtonText: {
        fontSize: 15,
        lineHeight: 20,
        fontFamily: 'Poppins-Bold',
        color: Colors.black,
    },
    uriText: {
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default PasswordModal;
