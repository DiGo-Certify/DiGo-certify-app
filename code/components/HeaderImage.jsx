import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import React from 'react';

export default function HeaderImage({ imageSource }) {
    return (
        <View style={styles.header}>
            <Image source={imageSource} style={styles.headerImage} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        aspectRatio: 1,
        borderRadius: Dimensions.get('window').width * 0.325,
        borderWidth: 5,
        width: '65%',
        height: '65%',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});
