const { ethers } = require('ethers');
const config = require('../../../../config.json');
const { useRpcProvider } = require('../utils/useRpcProvider');
 
/**
 * Verifies if a claim issuer is trusted by the Trusted Issuers Registry (TIR)
 * so it can send and sign claims
 * 
 * @param {*} TIR 
 * @param {*} claimIssuer 
 */
async function isTrustedIssuer(TIR, claimIssuer) {
    try {
        console.log('Checking if claim issuer is trusted ...');

        return await TIR.isTrustedIssuer(await claimIssuer.getAddress());
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = isTrustedIssuer