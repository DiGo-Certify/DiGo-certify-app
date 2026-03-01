import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

const CertificateCard = ({ certificate, onPress }) => {
    // Helper to pick color based on grade/status
    const getStatusColor = grade => {
        if (!grade) return Colors.gray;
        const g = grade.toLowerCase();
        if (g.includes('licenciado') || g.includes('bachelor')) return '#4CAF50'; // Green
        if (g.includes('mestre') || g.includes('master')) return '#2196F3'; // Blue
        if (g.includes('doutor') || g.includes('phd')) return '#9C27B0'; // Purple
        return Colors.primary;
    };

    const statusColor = getStatusColor(certificate.grade);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ marginBottom: 16 }}>
            <Surface style={styles.card} elevation={2}>
                {/* Left Colored Strip */}
                <View style={[styles.colorStrip, { backgroundColor: statusColor }]} />

                <View style={styles.contentContainer}>
                    {/* Header: Icon + Institution */}
                    <View style={styles.headerRow}>
                        <View style={[styles.iconBox, { backgroundColor: statusColor + '20' }]}>
                            <MaterialCommunityIcons name="certificate" size={24} color={statusColor} />
                        </View>
                        <View style={styles.institutionInfo}>
                            <Text style={styles.institutionName} numberOfLines={1}>
                                {certificate.issuer || 'Unknown Institution'}
                            </Text>
                            <Text style={styles.dateText}>{certificate.date || 'Issued Recently'}</Text>
                        </View>
                        {/* Verified Badge */}
                        <MaterialCommunityIcons name="check-decagram" size={20} color={statusColor} />
                    </View>

                    {/* Main Title */}
                    <Text style={styles.title} numberOfLines={2}>
                        {certificate.title}
                    </Text>

                    {/* Footer: Grade & ID */}
                    <View style={styles.footer}>
                        <View style={styles.tagContainer}>
                            <Text style={[styles.tagText, { color: Colors.darkGray }]}>
                                {certificate.grade || 'Certificate'}
                            </Text>
                        </View>
                        <Text style={styles.idText}>#{certificate.registrationCode || certificate.id}</Text>
                    </View>
                </View>
            </Surface>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        minHeight: 110,
    },
    colorStrip: {
        width: 6,
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    institutionInfo: {
        flex: 1,
    },
    institutionName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: Colors.gray,
        textTransform: 'uppercase',
    },
    dateText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10,
        color: Colors.lightGray,
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
        color: Colors.black,
        marginBottom: 12,
        lineHeight: 24,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10,
    },
    tagContainer: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 11,
    },
    idText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: Colors.gray,
    },
});

export default CertificateCard;
