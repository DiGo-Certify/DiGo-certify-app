import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import Colors from '@/constants/colors';

const FormField = ({
    label,
    value,
    onChange,
    icon,
    outSideIconComponent,
    style,
    error,
    helperText,
    required = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    autoComplete = 'off',
    secure = false,
    secureTextEntry = false,
    multiline = false,
    numberOfLines = 1,
    disabled = false,
    testID,
    accessibilityLabel,
    accessibilityHint,
    ...props
}) => {
    const inputLabel = required ? `${label} *` : label;
    const accessibilityLabelText = accessibilityLabel || inputLabel;
    const accessibilityHintText = accessibilityHint || (required ? `Required field: ${label}` : label);

    return (
        <View style={[styles.container, style]}>
            <View style={styles.inputRow}>
            <TextInput
                label={inputLabel}
                value={value}
                onChangeText={onChange}
                mode="outlined"
                left={icon ? <TextInput.Icon icon={icon} /> : undefined}
                style={styles.input}
                outlineColor={error ? Colors.error : Colors.lightGray}
                activeOutlineColor={error ? Colors.error : Colors.primary}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoComplete={autoComplete}
                secureTextEntry={secure || secureTextEntry}
                multiline={multiline}
                numberOfLines={numberOfLines}
                disabled={disabled}
                error={!!error}
                testID={testID}
                accessibilityLabel={accessibilityLabelText}
                accessibilityHint={accessibilityHintText}
                accessibilityRole="text"
                {...props}
            />
                {outSideIconComponent}
            </View>
            {(error || helperText) && (
                <HelperText type={error ? 'error' : 'info'} visible={!!(error || helperText)} style={styles.helperText}>
                    {error || helperText}
                </HelperText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.white,
        fontFamily: 'Poppins-Regular',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helperText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
    },
});

export default FormField;
