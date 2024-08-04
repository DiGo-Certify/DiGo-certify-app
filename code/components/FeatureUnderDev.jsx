import { Alert } from 'react-native';
import React from 'react';

const FeatureUnderDev = () => {
    return Alert.alert(
        'Feature under development',
        'This feature is currently under development. Please check back later.'
    );
};

export default FeatureUnderDev;
