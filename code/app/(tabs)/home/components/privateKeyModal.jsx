import { StyleSheet } from 'react-native';
import { Text, Portal, Modal } from 'react-native-paper';
import Colors from '@/constants/colors';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';

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
                <Text style={styles.modalTitle}>Private Key</Text>
                <Text style={styles.modalSubtitleText}>Don't Share with anyone that you don't trust!</Text>
                <FormField
                    label="Private Key"
                    value={privateKey}
                    onChange={onChangePrivateKey}
                    style={styles.modalInput}
                />
                <ActionButton
                    text="Add"
                    onPress={onSubmitPrivateKey}
                    textStyle={styles.modalButtonText}
                    buttonStyle={styles.modalSubmitButton}
                    mode={'elevated'}
                    color={Colors.backgroundColor}
                />
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
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    modalSubtitleText: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        color: Colors.caution,
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
});

export default PrivateKeyModal;
