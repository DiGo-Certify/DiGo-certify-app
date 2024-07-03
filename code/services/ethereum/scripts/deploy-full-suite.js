const { ethers } = require('ethers');
const config = require('../../../config.json');
const fs = require('fs');
const path = require('path');
const { deployOnchainIDSuite } = require('./suites/OID');
const { deployTrexSuite } = require('./suites/TREX');

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const deployer = new ethers.Wallet(config.ownerPrivateKey, provider);

    const { identityFactoryAddress } = await deployOnchainIDSuite(deployer);

    const { addresses } = await deployTrexSuite(deployer);

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

    configuration.onchainid.address = identityFactoryAddress;
    configuration.trex.implementationAuthority.address =
        addresses.trexImplementationAuthority;
    configuration.trex.claimsTopicRegistry.address =
        addresses.claimTopicsRegistryImplementation;
    configuration.trex.trustedIssuersRegistry.address =
        addresses.trustedIssuersRegistryImplementation;
    configuration.trex.identityRegistryStorage.address =
        addresses.identityRegistryStorageImplementation;
    configuration.trex.identityRegistry.address =
        addresses.identityRegistryImplementation;

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
