import { Text, Portal, Modal } from 'react-native-paper';
import FormField from '@/components/FormField';
import Colors from '@/constants/colors';
import ActionButton from '@/components/ActionButton';
import { StyleSheet } from 'react-native';

function CertificateFormModal({ visible, onDismiss, formData, onChangeForm, onPress, isSubmitting }) {
    return (
        <Portal>
            <Modal
                animationType="slide"
                onDismiss={onDismiss}
                visible={visible}
                contentContainerStyle={styles.modalView}
            >
                <Text style={styles.modalTitle}>Request Certificate</Text>
                <FormField
                    label="Name"
                    value={formData.name}
                    onChange={text => onChangeForm('name', text)}
                    style={styles.modalInput}
                />
                <FormField
                    label="Student Number"
                    value={formData.studentNumber}
                    onChange={text => onChangeForm('studentNumber', text)}
                    style={styles.modalInput}
                />
                <FormField
                    label="Institution Code"
                    value={formData.institutionCode}
                    onChange={text => onChangeForm('institutionCode', text)}
                    style={styles.modalInput}
                />
                <ActionButton
                    text="Submit"
                    onPress={onPress}
                    textStyle={styles.modalButtonText}
                    buttonStyle={styles.modalSubmitButton}
                    mode={'elevated'}
                    color={Colors.backgroundColor}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
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

export default CertificateFormModal;
