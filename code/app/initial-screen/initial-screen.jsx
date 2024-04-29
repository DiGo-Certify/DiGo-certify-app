import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-swiper';
import Colors from '@/constants/colors.js';
import Images from '../../constants/images.js';
import { router } from 'expo-router';

function InitialScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.swiperContainer}>
                <Swiper
                    showsButtons={false}
                    dotColor={Colors.grey}
                    activeDotColor={Colors.black}
                    loop={false}
                    index={0}
                >
                    <View style={styles.slide}>
                        <Image source={Images.wallet} style={styles.image} />
                        <Text style={styles.sliderText}>Private & Secure</Text>
                    </View>
                    <View style={styles.slide}>
                        <Image source={Images.certificate} style={styles.image} />
                        <Text style={styles.sliderText}>Certificate Validation</Text>
                    </View>
                </Swiper>
            </View>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    router.push('/sign-up');
                }}
            >
                <Text style={styles.buttonText}>Create Wallet</Text>
            </TouchableOpacity>
            <Text style={styles.bottomText}>Already have a wallet</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.backgroundColor,
    },
    swiperContainer: {
        height: 250,
        marginBottom: 20,
    },
    slide: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.backgroundColor,
    },
    image: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
    text: {
        color: '#000',
        fontSize: 20,
        marginTop: 20,
    },
    sliderText: {
        color: '#000',
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 20,
    },
    bottomText: {
        color: Colors.green,
        fontSize: 20,
        marginTop: 20,
    },
    button: {
        backgroundColor: Colors.green,
        padding: 10,
        borderRadius: 5,
        width: 300,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default InitialScreen;
