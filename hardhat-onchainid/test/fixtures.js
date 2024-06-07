const { ethers } = require('hardhat');
const {
    contracts: { Factory, Identity, ImplementationAuthority }
} = require('@onchain-id/solidity');

async function deployFactoryFixture() {
    const [deployerWallet, aliceWallet, bobWallet] = await ethers.getSigners();

    console.log(`\n[!] Deploying OnChainId Suite ...`);

    // On Chain Id implementation
    const IdentityContract = await new ethers.ContractFactory(
        Identity.abi,
        Identity.bytecode,
        deployerWallet
    );
    const identityImplementation = await IdentityContract.deploy(
        deployerWallet.address, // owner
        true // isLibrary - true for IdentityFactory
    );

    // On Chain Id implementation authority -> Points to the implementation contract
    const ImplementationAuthorityContract = await new ethers.ContractFactory(
        ImplementationAuthority.abi,
        ImplementationAuthority.bytecode,
        deployerWallet
    );

    const implementationAuthority =
        await ImplementationAuthorityContract.deploy(
            await identityImplementation.getAddress()
        );

    // On Chain Id Factory -> Points to the implementation authority
    const IdentityFactory = await new ethers.ContractFactory(
        Factory.abi,
        Factory.bytecode,
        deployerWallet
    );
    const identityFactory = await IdentityFactory.deploy(
        await implementationAuthority.getAddress()
    );

    console.log(
        `\n[✓] Deployed OnChainId Factory Contract: ${await identityFactory.getAddress()}`
    );

    return {
        deployerWallet,
        aliceWallet,
        bobWallet,
        identityImplementation,
        implementationAuthority,
        identityFactory
    };
}

module.exports = {
    deployFactoryFixture
};
