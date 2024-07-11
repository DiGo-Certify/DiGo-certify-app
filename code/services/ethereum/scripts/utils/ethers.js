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
    return new ethers.Contract(address, abi, signer);
}

/**
 * Auxiliary function to get a wallet instance
 * @param {*} privateKey - The private key of the wallet
 * @param {*} provider - The provider associated to the wallet
 * @returns 
 */
function getWallet(privateKey, provider) {
    return new ethers.Wallet(privateKey, provider);
}

/**
 * Auxiliary function to get a provider instance for a given node address 
 */
function jsonRpcProvider(nodeAddress) {
    return new ethers.JsonRpcProvider(nodeAddress);
}

module.exports = { getContractAt, getWallet, jsonRpcProvider };
