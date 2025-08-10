// Validation utilities
export const VALIDATION_MESSAGES = {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_WALLET: 'Please enter a valid wallet address (0x...)',
    INVALID_NUMBER: 'Please enter a valid number',
    INVALID_URL: 'Please enter a valid URL',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    FILE_TOO_LARGE: 'File size must be less than 10MB',
    INVALID_FILE_TYPE: 'Invalid file type',
};

export const isValidEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidWalletAddress = address => {
    if (!address) return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidUrl = url => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const isValidNumber = value => {
    return !isNaN(value) && !isNaN(parseFloat(value));
};

export const validateRequired = (value, fieldName) => {
    if (!value || value.toString().trim() === '') {
        return `${fieldName} is required`;
    }
    return null;
};

export const validateEmail = email => {
    if (!email) return VALIDATION_MESSAGES.REQUIRED_FIELD;
    if (!isValidEmail(email)) return VALIDATION_MESSAGES.INVALID_EMAIL;
    return null;
};

export const validateWalletAddress = address => {
    if (!address) return VALIDATION_MESSAGES.REQUIRED_FIELD;
    if (!isValidWalletAddress(address)) return VALIDATION_MESSAGES.INVALID_WALLET;
    return null;
};

export const validateNumber = (value, fieldName) => {
    if (!value) return `${fieldName} is required`;
    if (!isValidNumber(value)) return `${fieldName} must be a valid number`;
    return null;
};

export const validateUrl = url => {
    if (!url) return null; // URL is optional in most cases
    if (!isValidUrl(url)) return VALIDATION_MESSAGES.INVALID_URL;
    return null;
};

export const validatePassword = password => {
    if (!password) return VALIDATION_MESSAGES.REQUIRED_FIELD;
    if (password.length < 8) return VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
    return null;
};

export const validateCertificateForm = form => {
    const errors = {};

    // Required fields validation
    const requiredFields = ['registrationCode', 'courseID', 'grade', 'walletAddr'];
    requiredFields.forEach(field => {
        const error = validateRequired(form[field], field);
        if (error) errors[field] = error;
    });

    // Specific validations
    if (form.walletAddr) {
        const walletError = validateWalletAddress(form.walletAddr);
        if (walletError) errors.walletAddr = walletError;
    }

    if (form.courseID) {
        const courseIdError = validateNumber(form.courseID, 'Course ID');
        if (courseIdError) errors.courseID = courseIdError;
    }

    if (form.registrationCode) {
        const regCodeError = validateNumber(form.registrationCode, 'Registration Code');
        if (regCodeError) errors.registrationCode = regCodeError;
    }

    if (form.certificateUri) {
        const urlError = validateUrl(form.certificateUri);
        if (urlError) errors.certificateUri = urlError;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateRequestForm = form => {
    const errors = {};

    // Required fields for certificate request
    const requiredFields = ['name', 'studentNumber', 'institutionCode', 'OID'];
    requiredFields.forEach(field => {
        const error = validateRequired(form[field], field);
        if (error) errors[field] = error;
    });

    // Specific validations
    if (form.studentNumber) {
        const studentNumberError = validateNumber(form.studentNumber, 'Student Number');
        if (studentNumberError) errors.studentNumber = studentNumberError;
    }

    if (form.institutionCode) {
        const instCodeError = validateNumber(form.institutionCode, 'Institution Code');
        if (instCodeError) errors.institutionCode = instCodeError;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateValidationForm = form => {
    const errors = {};

    if (!form.userAddress && !form.certificateLink) {
        errors.general = 'Please provide either a user address or certificate link';
        return { isValid: false, errors };
    }

    if (form.userAddress) {
        const walletError = validateWalletAddress(form.userAddress);
        if (walletError) errors.userAddress = walletError;
    }

    if (form.certificateLink) {
        const urlError = validateUrl(form.certificateLink);
        if (urlError) errors.certificateLink = urlError;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
