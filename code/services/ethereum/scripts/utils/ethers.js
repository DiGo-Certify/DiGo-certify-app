const { ethers } = require('ethers');

/**
 * Auxiliary function to get a contract instance at a given address
 *
 * @param {*} address - The address of the contract
 * @param {*} abi - The ABI of the contract
 * @param {*} signer - The signer to use for the contract
 * @returns
 */
function getContractAt(address, abi, signer) {
    try {
        return new ethers.Contract(address, abi, signer);
    } catch (error) {
        console.error('Error getting contract at address: ', address);
        return null;
    }
}

/**
 * Auxiliary function to get a wallet instance
 * @param {*} privateKey - The private key of the wallet
 * @param {*} provider - The provider associated to the wallet
 * @returns
 */
function getWallet(privateKey, provider) {
    try {
        return new ethers.Wallet(privateKey, provider);
    } catch (error) {
        console.error('Error getting wallet with private key: ', privateKey);
        return null;
    }
}

/**
 * Auxiliary function to get a provider instance for a given node address
 */
function jsonRpcProvider(nodeAddress) {
    try {
        return new ethers.JsonRpcProvider(nodeAddress);
    } catch (error) {
        console.error('Error getting provider for node address: ', nodeAddress);
        throw error;
    }
}

module.exports = { getContractAt, getWallet, jsonRpcProvider };
