const config = require('../../../../config.json');

/**
 * Search in the config file if is a wallet with admin permissions (claim issuer)
 *
 * @param {*} address - Wallet address to check if it is an admin wallet
 * @returns {boolean} - True if the wallet is an admin wallet, false otherwise
 */
function isAdminWallet(address) {
    // Check the owner wallet
    if (config.deployer.address.toLowerCase() === address) {
        return true;
    }

    // Check the institution wallets
    for (let i = 0; i < config.institutions.length; i++) {
        const wallet = config.institutions[i].wallet;
        if (wallet.address.toLowerCase() === address) {
            console.log('Is an institution wallet');
            return true;
        }
    }
    return false;
}

module.exports = isAdminWallet;
