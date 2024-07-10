const config = require('../../../../config.json');
const { ethers } = require('ethers');
const {
    WalletAlreadyLinked,
    SaltAlreadyTaken,
    EmptyString,
    IdentityDeploymentError
} = require('../../../errors/deployment/identities');
const {
    contracts: { Identity }
} = require('@onchain-id/solidity');
const { useRpcProvider } = require('../utils/useRpcProvider');

async function deployIdentity(
    identityFactory,
    address,
    salt,
    deployer = undefined
) {
    console.log('[!] Deploying identity for wallet with address:', address);
    const logs = [];

    const identityContract = new ethers.ContractFactory(
        Identity.abi,
        Identity.bytecode,
        deployer
    );

    if (deployer === undefined) {
        deployer = useRpcProvider(config.rpc, config.deployer.privateKey);
    }

    try {
        const tx_verify = await identityFactory.getIdentity(address);

        if (tx_verify !== ethers.ZeroAddress) {
            return new ethers.Contract(
                tx_verify,
                identityContract.interface.fragments,
                deployer
            );
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
                logs.push(item.args.identity);
            }
        });

        return new ethers.Contract(
            logs[0],
            identityContract.interface.fragments,
            deployer
        );
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
