import React from 'react';
import { Text } from 'react-native';

const ClickableText = ({ text, onPress, style }) => {
    return (
        <Text style={style} onPress={onPress}>
            {text}
        </Text>
    );
};

export default ClickableText;
