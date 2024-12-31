class IdentityDeploymentError extends Error {
    constructor(message) {
        super(message);
        this.name = 'IdentityDeploymentError';
    }
}

class SaltAlreadyTaken extends IdentityDeploymentError {
    constructor() {
        super('[!] The salt is already taken.');
        this.name = 'SaltAlreadyTaken';
    }
}

class WalletAlreadyLinked extends IdentityDeploymentError {
    constructor(idAddr) {
        if (idAddr === undefined) {
            super('[!] The wallet is already linked to an identity.');
        } else {
            super('[!] The wallet is already linked to identity: ' + idAddr + '.');
        }
        this.name = 'WalletAlreadyLinked';
    }
}

class EmptyString extends IdentityDeploymentError {
    constructor() {
        super('[!] The Salt or Adress cannot be empty.');
        this.name = 'EmptySaltOrAddress';
    }
}

module.exports = { IdentityDeploymentError, SaltAlreadyTaken, WalletAlreadyLinked, EmptyString };
