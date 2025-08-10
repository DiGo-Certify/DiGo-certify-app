// Empty State Component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Paragraph, Button, Avatar } from 'react-native-paper';
import Colors from '@/constants/colors';
import Icons from '@/constants/icons';

const EmptyState = ({ title, message, actionText, onAction, icon = Icons.certificate, showAction = true }) => {
    return (
        <View style={styles.container}>
            <Avatar.Icon size={80} icon={icon} style={styles.icon} color={Colors.lightGray} />

            <Title style={styles.title}>{title}</Title>

            <Paragraph style={styles.message}>{message}</Paragraph>

            {showAction && actionText && onAction && (
                <Button mode="contained" onPress={onAction} style={styles.button} labelStyle={styles.buttonLabel}>
                    {actionText}
                </Button>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
    },
    icon: {
        backgroundColor: Colors.backgroundGray,
        marginBottom: 24,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: Colors.darkGray,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: Colors.gray,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingHorizontal: 16,
    },
    buttonLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: Colors.white,
    },
});

export default EmptyState;
