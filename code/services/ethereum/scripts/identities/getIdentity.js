const { ethers } = require('ethers');
const {
    contracts: { Identity }
} = require('@onchain-id/solidity');
const { useRpcProvider } = require('../utils/useRpcProvider');
const config = require('../../../../config.json');

async function getIdentity(address, identityFactory, signer = undefined) {
    try {
        if (signer === undefined) {
            signer = useRpcProvider(config.url, config.deployer.privateKey);
        }

        console.log('[!] Getting identity for wallet with address:', address);
        const identity = await identityFactory.getIdentity(address);

        if (identity !== ethers.ZeroAddress) {
            console.log('[✓] Identity found:', identity);

            const identityContract = new ethers.ContractFactory(
                Identity.abi,
                Identity.bytecode,
                signer
            );

            return new ethers.Contract(
                identity,
                identityContract.interface.fragments,
                signer
            );
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = { getIdentity };
