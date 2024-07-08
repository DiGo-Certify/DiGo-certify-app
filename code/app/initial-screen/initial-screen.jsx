import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { Button } from 'react-native-paper';
import Swiper from 'react-native-swiper';
import Colors from '@/constants/colors.js';
import Images from '../../constants/images.js';
import ClickableText from '@/components/ClickableText.jsx';

function InitialScreen({ handleConnectPress, handleGuestPress, WalletConnectModal }) {
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
            <Button mode="contained" onPress={handleConnectPress} style={styles.button} labelStyle={styles.buttonText}>
                Connect Your Wallet
            </Button>
            <ClickableText text="Join as a guest" onPress={handleGuestPress} style={styles.guestText} />
            {WalletConnectModal}
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
    sliderText: {
        color: '#000',
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 20,
    },
    button: {
        backgroundColor: Colors.green,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 5,
        width: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    guestText: {
        color: Colors.black,
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        textDecorationLine: 'underline',
        marginTop: 20,
    },
});

export default InitialScreen;
