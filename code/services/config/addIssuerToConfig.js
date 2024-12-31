const fs = require('fs');
const path = require('path');

/**
 * Add claim issuer to the configuration file with the following structure:
 *  {
 *      "intitutionID": "123",
 *      "wallet": {
 *          "address": "0x123",
 *          "privateKey": "0x123",
 *      },
 *      "address": "0x123",
 *      "abi": []
 *  }
 */
function addIssuerToConfig(institutionID, walletAddress, walletPrivateKey, claimIssuerAddress, claimIssuerAbi) {
    try {
        // Update the configuration file with the address of the deployed factory
        const configFilePath = path.resolve(__dirname, '../../config.json');
        let configuration;

        // Read the existing configuration file
        const configFile = fs.readFileSync(configFilePath, 'utf8');
        configuration = JSON.parse(configFile);

        for (const institution of configuration.institutions) {
            if (institution.institutionID.toString() === institutionID) {
                console.log(`Institution with ID ${institutionID} already exists in the configuration file, updating...`);
                institution.wallet.address = walletAddress;
                institution.wallet.privateKey = walletPrivateKey;
                institution.address = claimIssuerAddress;
                institution.abi = claimIssuerAbi;
                fs.writeFileSync(configFilePath, JSON.stringify(configuration, null, 2));
                return;
            }
        }

        configuration.institutions.push({
            institutionID: institutionID,
            wallet: {
                address: walletAddress,
                privateKey: walletPrivateKey,
            },
            address: claimIssuerAddress,
            abi: claimIssuerAbi,
        });

        fs.writeFileSync(configFilePath, JSON.stringify(configuration, null, 2));
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File does not exist, create a new config object
            configuration = {};
        } else {
            console.error(error);
            throw error;
        }
    }
}

module.exports = { addIssuerToConfig };
