const { ethers } = require('ethers');
const config = require('../../../config.json');
const fs = require('fs');
const path = require('path');
const { deployOnchainIDProxy } = require('./suites/OID');

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const deployer = new ethers.Wallet(config.ownerPrivateKey, provider);

    const { identityFactoryAddress, identityFactoryCode } =
        await deployOnchainIDProxy(deployer);

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

    // Add the factory address to the config object
    configuration.proxy.address = identityFactoryAddress;
    configuration.proxy.bytecode = identityFactoryCode;

    // Write the updated config object to the file
    fs.writeFileSync(
        configFilePath,
        JSON.stringify(configuration, null, 2),
        'utf8'
    );

    console.log(`[✓] Updated config.json with factory address and bytecode`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
