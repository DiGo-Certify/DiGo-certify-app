class ClaimIssuerDeploymentError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ClaimIssuerDeploymentError';
    }
}

class MissingProviderError extends ClaimIssuerDeploymentError {
    constructor() {
        super('Provider is missing');
        this.name = 'MissingProviderError';
    }
}

