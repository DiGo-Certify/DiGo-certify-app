import React from 'react';
import { Icon, TextInput } from 'react-native-paper';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
    'Warning: TextInput.Icon: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

const FormField = ({ label, mode = 'outlined', style, secure = false, value, onChange, icon }) => (
    <TextInput
        label={label}
        mode={mode}
        secureTextEntry={secure}
        value={value}
        onChangeText={onChange}
        right={icon ? <Icon icon={icon} /> : null}
        style={style}
    />
);

export default FormField;
