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
    certificateVerifier
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
        configuration.identityFactory ??= {};
        configuration.trex ??= {};
        configuration.trex.implementationAuthority ??= {};
        configuration.trex.claimsTopicRegistry ??= {};
        configuration.trex.trustedIssuersRegistry ??= {};
        configuration.trex.identityRegistryStorage ??= {};
        configuration.trex.identityRegistry ??= {};
        configuration.trex.modularCompliance ??= {};
        configuration.trex.token ??= {};

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

        // Certificate verification configuration
        configuration.certificateVerifier = {
            address: certificateVerifier.address,
            abi: certificateVerifier.abi
        };

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

    console.log(`[✓] Added the onchainid, trex and certificate verifier to configurations`);
}

module.exports = { uploadConfig };
