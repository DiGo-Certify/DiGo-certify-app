// Centralized application constants
export const USER_TYPES = {
    ADMIN: 'Admin',
    DEFAULT: 'Default',
    GUEST: 'Guest',
};

export const CLAIM_SCHEMES = {
    ECDSA: 1,
    RSA: 2,
};

export const ROUTES = {
    HOME: '/home',
    PROFILE: '/profile',
    ADMIN: '/admin',
    VALIDATION: '/validation',
    EMISSION: '/emission',
    PROFILE_SETUP: '/profile-setup',
};

export const STORAGE_KEYS = {
    USER_INFO: 'user_info',
    WALLET: 'wallet',
    USER_TYPE: 'user_type',
};

export const VALIDATION_MESSAGES = {
    REQUIRED_FIELDS: 'Please fill in all required fields',
    INVALID_WALLET: 'Invalid wallet address format',
    INVALID_NUMBER: 'Must be a valid number',
    INVALID_URL: 'Invalid URL format',
    IDENTITY_NOT_FOUND: 'Identity not found',
    NOT_AUTHORIZED: 'You are not authorized to perform this action',
    NETWORK_ERROR: 'Network error. Please check your connection',
    TRANSACTION_CANCELLED: 'Transaction was cancelled',
};

export const UI_CONFIG = {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
};

export const BLOCKCHAIN_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
};
