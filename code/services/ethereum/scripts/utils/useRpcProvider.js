const ethers = require('ethers');
const { getWallet } = require('../utils/ethers');

/**
 * Auxiliary function that connects to the RPC provider
 * and sets the deployer wallet.
 * see @file {code/config.json}
 */
function useRpcProvider(url, signerPrivateKey) {
    const provider = new ethers.JsonRpcProvider(url);
    signer = getWallet(signerPrivateKey, provider); // app owner private key
    return signer;
}

module.exports = { useRpcProvider };
