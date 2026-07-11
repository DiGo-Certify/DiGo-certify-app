class ErrorHandler {
    static logError(error, context = '') {
        const prefix = context ? `[${context}] ` : '';
        console.error(`${prefix}${error.message || error}`);
    }

    static processError(error, context = '') {
        this.logError(error, context);

        const message = error?.message || 'An unexpected error occurred.';
        const normalizedMessage = message.toLowerCase();
        let userMessage = message;

        if (normalizedMessage.includes('user rejected')) {
            userMessage = 'Transaction was cancelled by user.';
        } else if (normalizedMessage.includes('insufficient funds')) {
            userMessage = 'Insufficient funds to complete the transaction.';
        } else if (normalizedMessage.includes('network')) {
            userMessage = 'Network error. Please check your connection and try again.';
        } else if (normalizedMessage.includes('nonce')) {
            userMessage = 'Transaction nonce error. Please try again.';
        } else if (normalizedMessage.includes('gas')) {
            userMessage = 'Gas estimation failed. Please try again.';
        }

        return { userMessage, originalError: error };
    }
}

export class BlockchainError extends Error {
    constructor(message, code = null) {
        super(message);
        this.name = 'BlockchainError';
        this.code = code;
    }
}

export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
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
}

export default ErrorHandler;
