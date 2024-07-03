const { ethers } = require('ethers');
const {
    contracts: { Identity, Factory, ImplementationAuthority }
} = require('@onchain-id/solidity');

async function deployOnchainIDProxy(deployer) {
    // Deploy OnchainID proxy
    console.log(`[!] Deploying OnchainID proxy...`);

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

    const identityFactoryAddress = await identityFactory.getAddress();
    const identityFactoryCode = await identityFactory.getDeployedCode();

    console.log(`[✓] Deployed OnchainID factory at ${identityFactoryAddress}`);

    return { identityFactoryAddress, identityFactoryCode };
}

module.exports = { deployOnchainIDProxy };
