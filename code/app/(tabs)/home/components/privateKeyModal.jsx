import { StyleSheet } from 'react-native';
import { Button, Text, Portal, Modal } from 'react-native-paper';
import Colors from '@/constants/colors';
import FormField from '@/components/FormField';

/**
 * Component that renders a modal to input a private key
 */
function PrivateKeyModal({ visible, onDismiss, privateKey, onChangePrivateKey, onSubmitPrivateKey }) {
    return (
        <Portal>
            <Modal
                animationType="slide"
                onDismiss={onDismiss}
                visible={visible}
                contentContainerStyle={styles.modalView}
            >
                <Text style={styles.modalTitle}>Activate Identity</Text>
                <Text style={styles.modalSubtitleText}>Import your private key to create your identity and authorize issuers.</Text>
                <FormField
                    label="Private Key"
                    value={privateKey}
                    onChange={onChangePrivateKey}
                    secure={true}
                    style={styles.modalInput}
                />
                <Button
                    mode="contained"
                    onPress={onSubmitPrivateKey}
                    style={styles.modalSubmitButton}
                    labelStyle={styles.modalButtonText}
                >
                    Activate
                </Button>
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
});

export default PrivateKeyModal;
