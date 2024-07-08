const ethers = require('ethers');

/**
 * Auxiliary function that connects to the RPC provider
 * and sets the deployer wallet.
 * see @file {code/config.json}
 */
function useRpcProvider(url, signerPrivateKey) {
    const provider = new ethers.JsonRpcProvider(url);
    signer = new ethers.Wallet(signerPrivateKey, provider); // app owner private key
    return signer;
}

module.exports = { useRpcProvider };
