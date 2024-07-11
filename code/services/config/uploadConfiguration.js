const fs = require('fs');
const path = require('path');

/**
 * Update the configuration file with all the addresses and ABIs of the deployed contracts
 * before app initialization.
 */
function uploadConfig(
    identityFactoryAddress,
    identityFactoryAbi,
    trexImplementationAuthority,
    claimTopicsRegistry,
    trustedIssuersRegistry,
    identityRegistryStorage,
    identityRegistry,
    modularCompliance,
    token,
    initialTrustedIssuers
) {
    // Update the configuration file with the address of the deployed factory
    const configFilePath = path.resolve(__dirname, '../../config.json');
    let configuration;

    // Read the existing configuration file
    try {
        const configFile = fs.readFileSync(configFilePath, 'utf8');
        configuration = JSON.parse(configFile);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // File does not exist, create a new config object
            configuration = {};
        } else {
            throw err;
        }
    }

    try {
        // Identity Factory configuration
        configuration.identityFactory.address = identityFactoryAddress;
        configuration.identityFactory.abi = identityFactoryAbi;

        // TREX configuration (implementation authority, claims topic registry, trusted issuers registry, identity registry storage, identity registry)
        configuration.trex.implementationAuthority.address =
            trexImplementationAuthority.address;
        configuration.trex.implementationAuthority.abi =
            trexImplementationAuthority.abi;

        configuration.trex.claimsTopicRegistry.address =
            claimTopicsRegistry.address;
        configuration.trex.claimsTopicRegistry.abi = claimTopicsRegistry.abi;

        configuration.trex.trustedIssuersRegistry.address =
            trustedIssuersRegistry.address;
        configuration.trex.trustedIssuersRegistry.abi =
            trustedIssuersRegistry.abi;

        configuration.trex.identityRegistryStorage.address =
            identityRegistryStorage.address;
        configuration.trex.identityRegistryStorage.abi =
            identityRegistryStorage.abi;

        configuration.trex.identityRegistry.address = identityRegistry.address;
        configuration.trex.identityRegistry.abi = identityRegistry.abi;

        configuration.trex.modularCompliance.address =
            modularCompliance.address;
        configuration.trex.modularCompliance.abi = modularCompliance.abi;

        configuration.trex.token.address = token.address;
        configuration.trex.token.abi = token.abi;

        // Add the initial trusted issuers to the configuration

        // ISEL
        configuration.institutions[0].address =
            initialTrustedIssuers[0].claimIssuerContract.target;
        configuration.institutions[0].abi = initialTrustedIssuers[0]
            .claimIssuerContract.interface.fragments;

        // IST
        configuration.institutions[1].address =
            initialTrustedIssuers[1].claimIssuerContract.target;
        configuration.institutions[1].abi =
            initialTrustedIssuers[1].claimIssuerContract.interface.fragments;

        // UL
        configuration.institutions[2].address =
            initialTrustedIssuers[2].claimIssuerContract.target;
        configuration.institutions[2].abi =
            initialTrustedIssuers[2].claimIssuerContract.interface.fragments;

        // Write the updated config object to the file
        fs.writeFileSync(
            configFilePath,
            JSON.stringify(configuration, null, 2),
            'utf8'
        );
    } catch (err) {
        console.error(`[x] Error updating the configuration file: ${err}`);
        return;
    }

    console.log(`[✓] Added the onchainid and trex to configurations`);
}

module.exports = { uploadConfig };
