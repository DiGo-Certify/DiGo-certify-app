// Enhanced loading components for better UX
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Title, Paragraph, Surface } from 'react-native-paper';
import Colors from '@/constants/colors';

// Basic loading indicator
export const LoadingIndicator = ({ size = 'large', color = Colors.primary, style }) => (
    <ActivityIndicator size={size} color={color} style={[styles.indicator, style]} />
);

// Full screen loading overlay
export const LoadingOverlay = ({
    visible = true,
    message = 'Loading...',
    subMessage = null,
    backgroundColor = 'rgba(0,0,0,0.5)',
}) => {
    if (!visible) return null;

    return (
        <View style={[styles.overlay, { backgroundColor }]}>
            <Surface style={styles.loadingCard} elevation={4}>
                <LoadingIndicator size="large" />
                <Title style={styles.loadingTitle}>{message}</Title>
                {subMessage && <Paragraph style={styles.loadingSubtitle}>{subMessage}</Paragraph>}
            </Surface>
        </View>
    );
};

// Inline loading state
export const InlineLoading = ({ message = 'Loading...', style, compact = false }) => (
    <View style={[styles.inlineContainer, compact && styles.compactContainer, style]}>
        <LoadingIndicator size={compact ? 'small' : 'medium'} />
        <Paragraph style={[styles.inlineMessage, compact && styles.compactMessage]}>{message}</Paragraph>
    </View>
);

// Skeleton loading for cards/lists
export const SkeletonCard = ({ height = 100, style }) => (
    <Surface style={[styles.skeleton, { height }, style]} elevation={1}>
        <View style={styles.skeletonContent}>
            <View style={[styles.skeletonLine, styles.skeletonTitle]} />
            <View style={[styles.skeletonLine, styles.skeletonText]} />
            <View style={[styles.skeletonLine, styles.skeletonTextShort]} />
        </View>
    </Surface>
);

// Multiple skeleton cards
export const SkeletonList = ({ count = 3, itemHeight = 100, style }) => (
    <View style={style}>
        {Array.from({ length: count }, (_, index) => (
            <SkeletonCard
                key={index}
                height={itemHeight}
                style={[styles.skeletonItem, index === count - 1 && { marginBottom: 0 }]}
            />
        ))}
    </View>
);

// Loading button state
export const LoadingButton = ({ loading = false, children, style, labelStyle, ...buttonProps }) => {
    const { Button } = require('react-native-paper');

    return (
        <Button
            {...buttonProps}
            loading={loading}
            disabled={loading || buttonProps.disabled}
            style={[style, loading && styles.loadingButton]}
            labelStyle={[labelStyle, loading && styles.loadingButtonLabel]}
        >
            {loading ? 'Loading...' : children}
        </Button>
    );
};

// Progressive loading with steps
export const StepLoading = ({ steps = [], currentStep = 0, style }) => (
    <Surface style={[styles.stepContainer, style]} elevation={2}>
        <Title style={styles.stepTitle}>Processing...</Title>

        {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
                <View style={styles.stepIndicator}>
                    {index < currentStep ? (
                        <View style={[styles.stepIcon, styles.stepCompleted]}>
                            <Text style={styles.stepCompletedText}>✓</Text>
                        </View>
                    ) : index === currentStep ? (
                        <LoadingIndicator size="small" />
                    ) : (
                        <View style={[styles.stepIcon, styles.stepPending]}>
                            <Text style={styles.stepPendingText}>{index + 1}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.stepContent}>
                    <Paragraph
                        style={[
                            styles.stepText,
                            index === currentStep && styles.stepTextActive,
                            index < currentStep && styles.stepTextCompleted,
                        ]}
                    >
                        {step}
                    </Paragraph>
                </View>
            </View>
        ))}
    </Surface>
);

const styles = StyleSheet.create({
    indicator: {
        margin: 16,
    },

    // Overlay styles
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingCard: {
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: Colors.white,
        minWidth: 200,
    },
    loadingTitle: {
        fontFamily: 'Poppins-SemiBold',
        color: Colors.primary,
        marginTop: 16,
        textAlign: 'center',
    },
    loadingSubtitle: {
        fontFamily: 'Poppins-Regular',
        color: Colors.gray,
        marginTop: 8,
        textAlign: 'center',
    },

    // Inline styles
    inlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    compactContainer: {
        padding: 8,
    },
    inlineMessage: {
        fontFamily: 'Poppins-Regular',
        color: Colors.gray,
        marginLeft: 12,
    },
    compactMessage: {
        fontSize: 12,
        marginLeft: 8,
    },

    // Skeleton styles
    skeleton: {
        borderRadius: 8,
        backgroundColor: Colors.backgroundGray,
        marginBottom: 12,
    },
    skeletonContent: {
        padding: 16,
    },
    skeletonLine: {
        backgroundColor: Colors.lightGray,
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonTitle: {
        height: 20,
        width: '70%',
    },
    skeletonText: {
        height: 16,
        width: '90%',
    },
    skeletonTextShort: {
        height: 16,
        width: '60%',
        marginBottom: 0,
    },
    skeletonItem: {
        marginBottom: 12,
    },

    // Loading button styles
    loadingButton: {
        opacity: 0.7,
    },
    loadingButtonLabel: {
        color: Colors.gray,
    },

    // Step loading styles
    stepContainer: {
        padding: 20,
        borderRadius: 12,
        backgroundColor: Colors.white,
    },
    stepTitle: {
        fontFamily: 'Poppins-SemiBold',
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 20,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepIndicator: {
        marginRight: 16,
    },
    stepIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCompleted: {
        backgroundColor: Colors.success,
    },
    stepPending: {
        backgroundColor: Colors.lightGray,
        borderWidth: 2,
        borderColor: Colors.gray,
    },
    stepCompletedText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    stepPendingText: {
        color: Colors.gray,
        fontWeight: 'bold',
        fontSize: 14,
    },
    stepContent: {
        flex: 1,
    },
    stepText: {
        fontFamily: 'Poppins-Regular',
        color: Colors.gray,
    },
    stepTextActive: {
        color: Colors.primary,
        fontFamily: 'Poppins-Medium',
    },
    stepTextCompleted: {
        color: Colors.success,
    },
});

export default {
    LoadingIndicator,
    LoadingOverlay,
    InlineLoading,
    SkeletonCard,
    SkeletonList,
    LoadingButton,
    StepLoading,
};
