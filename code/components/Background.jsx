import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export default function Background({ header, body, footer, noScroll = false }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.header}>{header}</View>

                <View style={styles.bodyContainer}>
                    {noScroll ? (
                        <View style={styles.bodyContent}>
                            {body}
                            <View style={styles.footer}>{footer}</View>
                        </View>
                    ) : (
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.bodyWrapper}>{body}</View>

                            <View style={styles.footer}>{footer}</View>
                        </ScrollView>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    container: {
        flex: 1,
    },
    header: {
        height: '35%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    bodyContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.backgroundColor,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    bodyWrapper: {
        paddingHorizontal: 20,
    },
    bodyContent: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
});
