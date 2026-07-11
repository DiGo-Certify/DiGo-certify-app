import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import React from 'react';

export default function HeaderImage({ imageSource }) {
    const { width } = useWindowDimensions();
    const size = Math.min(160, width * 0.4);

    return (
        <View style={[styles.header, { width: size, height: size, borderRadius: size / 2 }]}>
            <Image source={imageSource} style={styles.headerImage} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        aspectRatio: 1,
        borderWidth: 5,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});
