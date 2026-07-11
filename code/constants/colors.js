// Enhanced color palette for better consistency
const backgroundColor = '#DBDBDB';
const green = '#74B395';
const black = '#000000';
const white = '#FFFFFF';
const grey = '#A9A9A9';
const sonicSilver = '#787D8C';
const solitudeGrey = '#F2F5FC';
const caution = '#FFA500';
const url = '#0000FF';

export default {
    // Legacy colors (keeping for compatibility)
    backgroundColor,
    green,
    black,
    white,
    grey,
    sonicSilver,
    solitudeGrey,
    caution,
    url,

    // Enhanced color system
    primary: green,
    secondary: sonicSilver,
    background: backgroundColor,
    surface: white,

    // Text colors
    onPrimary: white,
    onSecondary: white,
    onBackground: black,
    onSurface: black,

    // Semantic colors
    success: '#4CAF50',
    warning: caution,
    error: '#F44336',
    info: '#2196F3',

    // Light variants
    successLight: '#E8F5E8',
    warningLight: '#FFF3E0',
    errorLight: '#FFEBEE',
    infoLight: '#E3F2FD',

    // Gray scale
    gray: grey,
    lightGray: '#E0E0E0',
    darkGray: '#424242',
    backgroundGray: solitudeGrey,
};
