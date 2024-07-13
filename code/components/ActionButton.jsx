import React from 'react';
import { Button } from 'react-native-paper';

const ActionButton = ({ text, onPress, buttonStyle, textStyle, icon, isLoading, color, mode, disabled = false }) => {
    return (
        <Button
            icon={icon}
            mode={mode ?? 'contained-total'}
            onPress={onPress}
            loading={isLoading}
            style={buttonStyle}
            labelStyle={textStyle}
            buttonColor={color}
            disabled={disabled}
        >
            {text}
        </Button>
    );
};

export default ActionButton;
