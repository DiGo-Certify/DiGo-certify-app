const { ethers } = require("hardhat");
const {
    contracts: { Identity, Factory, ImplementationAuthority }
} = require("@onchain-id/solidity");

async function deploy_onchainid_suite(deployer) {
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
        `\n[✓] Deployed OnChainId Identity: ${await identityImplementation.getAddress()}`
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
        `\n[✓] Deployed OnChainId Implementaton Authority: ${await implementationAuthority.getAddress()}`
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
        `\n[✓] Deployed OnChainId Factory: ${await identityFactory.getAddress()}`
    );

    return { identityImplementation, implementationAuthority, identityFactory };
}

async function createIdentity(identityFactory, managementKey, deployer, salt) {
    console.log(`\n[!] Started Creating Identity ...`);

    // Create an identity using the factory
    const tx = await identityFactory.createIdentity(managementKey, salt);
    const txReceipt = await tx.wait();
    const event = txReceipt.logs.find(e => e.eventName === "Deployed");

    console.log(
        `\n[✓] Identity "${event.args}" created by for wallet ${deployer.address}`
    );

    return event.args;
}

async function main() {
    const [deployer, aliceWallet, bobWallet] = await ethers.getSigners();
    const { identityFactory } = await deploy_onchainid_suite(deployer);
    await createIdentity(
        identityFactory,
        aliceWallet.address,
        deployer,
        "alice-salt"
    );
    await createIdentity(
        identityFactory,
        bobWallet.address,
        deployer,
        "bob-salt"
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
