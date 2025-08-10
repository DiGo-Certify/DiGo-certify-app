// Enhanced Error Handling Service
class ErrorHandler {
    static logError(error, context = '') {
        console.error(`[${context}] Error:`, error);

        // In production, you might want to send this to a logging service
        // like Sentry, Crashlytics, etc.
        if (__DEV__) {
            console.trace();
        }
    }

    static handleBlockchainError(error) {
        let userMessage = 'A blockchain error occurred. Please try again.';

        if (error.message.includes('user rejected')) {
            userMessage = 'Transaction was cancelled by user.';
        } else if (error.message.includes('insufficient funds')) {
            userMessage = 'Insufficient funds to complete the transaction.';
        } else if (error.message.includes('network')) {
            userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('nonce')) {
            userMessage = 'Transaction nonce error. Please try again.';
        } else if (error.message.includes('gas')) {
            userMessage = 'Gas estimation failed. Please try again with higher gas limit.';
        }

        return {
            type: 'BLOCKCHAIN_ERROR',
            userMessage,
            originalError: error,
        };
    }

    static handleValidationError(error) {
        return {
            type: 'VALIDATION_ERROR',
            userMessage: error.message || 'Validation failed. Please check your input.',
            originalError: error,
        };
    }

    static handleNetworkError(error) {
        let userMessage = 'Network error. Please check your connection.';

        if (error.message.includes('timeout')) {
            userMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('offline')) {
            userMessage = 'You appear to be offline. Please check your connection.';
        }

        return {
            type: 'NETWORK_ERROR',
            userMessage,
            originalError: error,
        };
    }

    static handleGenericError(error) {
        return {
            type: 'GENERIC_ERROR',
            userMessage: 'An unexpected error occurred. Please try again.',
            originalError: error,
        };
    }

    static processError(error, context = '') {
        this.logError(error, context);

        // Determine error type and return appropriate response
        if (error.message.includes('blockchain') || error.code) {
            return this.handleBlockchainError(error);
        }

        if (error.name === 'ValidationError' || error.type === 'validation') {
            return this.handleValidationError(error);
        }

        if (error.name === 'NetworkError' || error.message.includes('network')) {
            return this.handleNetworkError(error);
        }

        return this.handleGenericError(error);
    }
}

// Custom Error Classes
export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.type = 'validation';
        this.field = field;
    }
}

export class BlockchainError extends Error {
    constructor(message, code = null) {
        super(message);
        this.name = 'BlockchainError';
        this.type = 'blockchain';
        this.code = code;
    }
}

export class NetworkError extends Error {
    constructor(message, status = null) {
        super(message);
        this.name = 'NetworkError';
        this.type = 'network';
        this.status = status;
    }
}

// Retry mechanism for blockchain operations
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            ErrorHandler.logError(error, `Attempt ${attempt}/${maxRetries}`);

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    throw lastError;
};

// Async wrapper with error handling
export const withErrorHandling = (asyncFn, context = '') => {
    return async (...args) => {
        try {
            return await asyncFn(...args);
        } catch (error) {
            const processedError = ErrorHandler.processError(error, context);
            throw processedError;
        }
    };
};

export default ErrorHandler;
