const config = require('../../../config.json');
const { ethers } = require('ethers');
const {
    WalletAlreadyLinked,
    SaltAlreadyTaken,
    EmptyString,
    IdentityDeploymentError,
} = require('../../errors/deployment/identities');

async function deployIdentity(identityFactory, address, salt) {
    console.log('[!] Deploying identity for wallet with address:', address);
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const deployer = new ethers.Wallet(config.deployer.privateKey, provider);

    try {
        const tx_verify = await identityFactory
            .connect(deployer)
            .getIdentity(address);

        if (tx_verify !== ethers.ZeroAddress) {
            throw new WalletAlreadyLinked(tx_verify);
        }

        const tx = await identityFactory
            .connect(deployer)
            .createIdentity(address, salt);
        const tx_receipt = await tx.wait();

        tx_receipt.logs.forEach(item => {
            if (
                item.eventName !== undefined &&
                item.eventName === 'WalletLinked'
            ) {
                console.log('[✓] Identity deployed:', item.args.identity);
                return item.args.identity;
            }
        });
    } catch (error) {
        if (error.reason === 'salt already taken') {
            throw new SaltAlreadyTaken(error.address);
        } else if (error.reason === 'wallet already linked to an identity') {
            throw new WalletAlreadyLinked();
        } else if (error.reason === 'invalid argument - empty string') {
            throw new EmptyString();
        } else {
            throw new IdentityDeploymentError(
                'Error deploying identity: ' + error
            );
        }
    }
}

module.exports = { deployIdentity };
