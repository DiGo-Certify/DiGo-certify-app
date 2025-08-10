// Certificate Card Component
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Chip, Avatar } from 'react-native-paper';
import Colors from '@/constants/colors';
import Icons from '@/constants/icons';

const CertificateCard = ({ certificate, onPress }) => {
    const getGradeColor = grade => {
        const gradeColors = {
            Licenciado: Colors.success,
            Mestre: Colors.warning,
            Doutor: Colors.primary,
            default: Colors.gray,
        };
        return gradeColors[grade] || gradeColors.default;
    };

    const formatInstitutionId = institutionId => {
        if (typeof institutionId === 'number') {
            return `Institution ${institutionId}`;
        }
        return institutionId || 'Unknown Institution';
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={styles.card} elevation={2}>
                <Card.Content>
                    <View style={styles.header}>
                        <Avatar.Icon size={40} icon={Icons.certificate} style={styles.avatar} color={Colors.white} />
                        <View style={styles.titleContainer}>
                            <Title style={styles.title} numberOfLines={1}>
                                {certificate.title}
                            </Title>
                            <Paragraph style={styles.registrationCode}>#{certificate.registrationCode}</Paragraph>
                        </View>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Institution:</Paragraph>
                            <Paragraph style={styles.value} numberOfLines={1}>
                                {formatInstitutionId(certificate.institution)}
                            </Paragraph>
                        </View>

                        <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Course:</Paragraph>
                            <Paragraph style={styles.value} numberOfLines={1}>
                                {certificate.course}
                            </Paragraph>
                        </View>

                        <View style={styles.footer}>
                            <Chip
                                mode="outlined"
                                style={[styles.gradeChip, { borderColor: getGradeColor(certificate.grade) }]}
                                textStyle={[styles.gradeText, { color: getGradeColor(certificate.grade) }]}
                            >
                                {certificate.grade}
                            </Chip>

                            <View style={styles.statusContainer}>
                                <View style={[styles.statusDot, styles.verifiedDot]} />
                                <Paragraph style={styles.statusText}>Verified</Paragraph>
                            </View>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        backgroundColor: Colors.white,
        borderRadius: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        backgroundColor: Colors.primary,
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: Colors.primary,
        marginBottom: 2,
    },
    registrationCode: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: Colors.gray,
        marginTop: 0,
    },
    content: {
        marginLeft: 52, // Align with title
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: Colors.darkGray,
        width: 80,
    },
    value: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: Colors.black,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    gradeChip: {
        backgroundColor: Colors.white,
    },
    gradeText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    verifiedDot: {
        backgroundColor: Colors.success,
    },
    statusText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: Colors.success,
    },
});

export default CertificateCard;
