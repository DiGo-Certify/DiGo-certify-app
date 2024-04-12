const { ethers } = require("hardhat");
const {
    contracts: { Identity, Factory, ImplementationAuthority }
} = require("@onchain-id/solidity");

async function deployOnchainIdSuite(deployer) {
    console.log(`\n[!] Deploying OnChainId Suite ...`);

    // On Chain Id implementation
    const IdentityContract = await new ethers.ContractFactory(
        Identity.abi,
        Identity.bytecode,
        deployer
    );
    const identityImplementation = await IdentityContract.deploy(
        deployer.address, // owner
        true // isLibrary - true for IdentityFactory
    );

    console.log(
        `\n[✓] Deployed OnChainId Identity Contract: ${await identityImplementation.getAddress()}`
    );

    // On Chain Id implementation authority -> Points to the implementation contract
    const ImplementationAuthorityContract = await new ethers.ContractFactory(
        ImplementationAuthority.abi,
        ImplementationAuthority.bytecode,
        deployer
    );

    const implementationAuthority =
        await ImplementationAuthorityContract.deploy(
            await identityImplementation.getAddress()
        );

    console.log(
        `\n[✓] Deployed OnChainId Implementaton Authority Contract: ${await implementationAuthority.getAddress()}`
    );

    // On Chain Id Factory -> Points to the implementation authority
    const IdentityFactory = await new ethers.ContractFactory(
        Factory.abi,
        Factory.bytecode,
        deployer
    );
    const identityFactory = await IdentityFactory.deploy(
        await implementationAuthority.getAddress()
    );

    console.log(
        `\n[✓] Deployed OnChainId Factory Contract: ${await identityFactory.getAddress()}`
    );

    return { identityImplementation, implementationAuthority, identityFactory };
}

module.exports = { deployOnchainIdSuite };