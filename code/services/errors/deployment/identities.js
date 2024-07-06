class IdentityDeploymentError extends Error {
    constructor(message) {
        super(message);
        this.name = 'IdentityDeploymentError';
    }
}

module.exports = { IdentityDeploymentError };