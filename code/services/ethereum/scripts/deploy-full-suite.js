const { ethers } = require('ethers');
const config = require('../../../config.json');
const fs = require('fs');
const path = require('path');
const { deployOnchainIDSuite } = require('./suites/OID');
const { deployTrexSuite } = require('./suites/TREX');

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const deployer = new ethers.Wallet(config.deployer.privateKey, provider);

    const { identityFactoryAbi, identityFactoryAddress } =
        await deployOnchainIDSuite(deployer);

    const {
        trexImplementationAuthority,
        claimTopicsRegistryImplementation,
        trustedIssuersRegistryImplementation,
        identityRegistryImplementation,
        identityRegistryStorageImplementation,
        modularComplianceImplementation,
        tokenImplementation
    } = await deployTrexSuite(deployer);

    // Update the configuration file with the address of the deployed factory
    const configFilePath = path.resolve(__dirname, '../../../config.json');
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

    // Identity Factory configuration
    configuration.identityFactory.address = identityFactoryAddress;
    configuration.identityFactory.abi = identityFactoryAbi;

    // TREX configuration (implementation authority, claims topic registry, trusted issuers registry, identity registry storage, identity registry)
    configuration.trex.implementationAuthority.address =
        trexImplementationAuthority.address;
    configuration.trex.implementationAuthority.abi =
        trexImplementationAuthority.abi;

    configuration.trex.claimsTopicRegistry.address =
        claimTopicsRegistryImplementation.address;
    configuration.trex.claimsTopicRegistry.abi =
        claimTopicsRegistryImplementation.abi;

    configuration.trex.trustedIssuersRegistry.address =
        trustedIssuersRegistryImplementation.address;
    configuration.trex.trustedIssuersRegistry.abi =
        trustedIssuersRegistryImplementation.abi;

    configuration.trex.identityRegistryStorage.address =
        identityRegistryStorageImplementation.address;
    configuration.trex.identityRegistryStorage.abi =
        identityRegistryStorageImplementation.abi;

    configuration.trex.identityRegistry.address =
        identityRegistryImplementation.address;
    configuration.trex.identityRegistry.abi =
        identityRegistryImplementation.abi;

    // Write the updated config object to the file
    fs.writeFileSync(
        configFilePath,
        JSON.stringify(configuration, null, 2),
        'utf8'
    );

    console.log(`[✓] Added the onchainid and trex to configurations`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
