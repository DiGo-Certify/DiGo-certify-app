import React from 'react';
import { Icon, TextInput } from 'react-native-paper';
import { LogBox, View } from 'react-native';

LogBox.ignoreLogs([
    'Warning: TextInput.Icon: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

const FormField = ({
    label,
    mode = 'outlined',
    style,
    secure = false,
    value,
    onChange,
    icon,
    outSideIconComponent,
}) => {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
                label={label}
                mode={mode}
                secureTextEntry={secure}
                value={value}
                multiline={false}
                onChangeText={onChange}
                right={icon ? <Icon source={'eye'} color="black" size={20} /> : null}
                style={[style, { flex: 1 }]}
            />
            {outSideIconComponent}
        </View>
    );
};

export default FormField;
