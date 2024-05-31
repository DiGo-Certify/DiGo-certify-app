import React from 'react';
import { TextInput } from 'react-native-paper';

const FormField = ({ label, icon, style, secure, value, onChange }) => {
    return (
        <TextInput
            label={label}
            mode="outlined"
            style={style}
            secureTextEntry={secure}
            value={value}
            onChangeText={onChange}
            right={<TextInput.Icon icon={icon} />}
        />
    );
};

export default FormField;
