import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

/**
 * Generic Background component for the app
 *
 * @param header - Header component to be displayed on background on top
 * @param body - Body component to be displayed on background in the middle
 * @param footer - Footer component to be displayed on background at the bottom. Can be null if not needed
 */
export default function Background({ header, body, footer }) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>{header}</View>
            <View style={styles.body}>{body}</View>
            <View style={styles.footer}>{footer}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    header: {
        flex: 0.4,
        width: '100%',
        alignItems: 'center',
    },
    body: {
        flex: 0.5,
        alignItems: 'center',
        width: '100%',
    },
    footer: {
        flex: 0.1,
        width: '100%',
        alignItems: 'center',
    },
});
