import React from 'react';
// import { Text, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';

// const ActionButton = ({ text, onPress, buttonStyle, textStyle }) => {
//     return (
//         <TouchableOpacity style={buttonStyle} onPress={onPress}>
//             <Text style={textStyle}>{text}</Text>
//         </TouchableOpacity>
//     );
// };

//Using button from rn-paper
const ActionButton = ({ text, onPress, buttonStyle, textStyle, icon, isLoading, color }) => {
    return (
        <Button
            icon={icon}
            mode="contained-tonal"
            onPress={onPress}
            loading={isLoading}
            style={buttonStyle}
            labelStyle={textStyle}
            buttonColor={color}
        >
            {text}
        </Button>
    );
};

export default ActionButton;
