const { ethers } = require('ethers');
const {
    contracts: { Identity, Factory, ImplementationAuthority }
} = require('@onchain-id/solidity');

async function deployOnchainIDSuite(deployer) {
    // Deploy OnchainID proxy
    console.log(`[!] Deploying OnchainID suite...`);

    const identityImplementation = await new ethers.ContractFactory(
        Identity.abi,
        Identity.bytecode,
        deployer
    ).deploy(deployer.address, true);

    // Wait for implementation transaction to be deployed
    await identityImplementation.waitForDeployment();

    console.log(`[+] Deployed OnchainID implementation`);

    const identityImplementationAuthority = await new ethers.ContractFactory(
        ImplementationAuthority.abi,
        ImplementationAuthority.bytecode,
        deployer
    ).deploy(await identityImplementation.getAddress());

    // Wait for authority transaction to be deployed
    await identityImplementationAuthority.waitForDeployment();

    console.log(`[+] Deployed OnchainID implementation authority`);

    const identityFactory = await new ethers.ContractFactory(
        Factory.abi,
        Factory.bytecode,
        deployer
    ).deploy(await identityImplementationAuthority.getAddress());

    // Wait for factory transaction to be deployed
    await identityFactory.waitForDeployment();

    const identityFactoryAddress = await identityFactory.getAddress();

    console.log(`[✓] Deployed OnchainID factory at ${identityFactoryAddress}`);

    return { identityFactoryAddress };
}

module.exports = { deployOnchainIDSuite };
