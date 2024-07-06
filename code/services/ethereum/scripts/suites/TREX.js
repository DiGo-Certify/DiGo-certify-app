const { ethers } = require('hardhat');

async function deployTrexLogicSuite(deployer) {
    // Deploy T-Rex proxy
    console.log(`[!] Deploying T-Rex suite...`);

    // Deploy implementations
    const claimTopicsRegistryImplementation = await ethers.deployContract(
        'ClaimTopicsRegistry',
        deployer
    );

    await claimTopicsRegistryImplementation.waitForDeployment();

    const trustedIssuersRegistryImplementation = await ethers.deployContract(
        'TrustedIssuersRegistry',
        deployer
    );

    await trustedIssuersRegistryImplementation.waitForDeployment();

    const identityRegistryStorageImplementation = await ethers.deployContract(
        'IdentityRegistryStorage',
        deployer
    );

    await identityRegistryStorageImplementation.waitForDeployment();

    const identityRegistryImplementation = await ethers.deployContract(
        'IdentityRegistry',
        deployer
    );

    await identityRegistryImplementation.waitForDeployment();

    const modularComplianceImplementation = await ethers.deployContract(
        'ModularCompliance',
        deployer
    );

    await modularComplianceImplementation.waitForDeployment();

    const tokenImplementation = await ethers.deployContract('Token', deployer);

    await tokenImplementation.waitForDeployment();

    console.log(
        `[+] Deployed Claim Topic Registry at ${await claimTopicsRegistryImplementation.getAddress()}`
    );

    console.log(
        `[+] Deployed Trusted Issuers Registry at ${await trustedIssuersRegistryImplementation.getAddress()}`
    );
    console.log(
        `[+] Deployed Identity Registry Storage at ${await identityRegistryStorageImplementation.getAddress()}`
    );
    console.log(
        `[+] Deployed Identity Registry at ${await identityRegistryImplementation.getAddress()}`
    );
    console.log(
        `[+] Deployed Modular Compliance at ${await modularComplianceImplementation.getAddress()}`
    );
    console.log(
        `[+] Deployed Token at ${await tokenImplementation.getAddress()}`
    );

    return {
        claimTopicsRegistryImplementation,
        trustedIssuersRegistryImplementation,
        identityRegistryStorageImplementation,
        identityRegistryImplementation,
        modularComplianceImplementation,
        tokenImplementation
    };
}

async function deployImplementationAuthority(
    deployer,
    claimTopicsRegistryImplementation,
    trustedIssuersRegistryImplementation,
    identityRegistryStorageImplementation,
    identityRegistryImplementation,
    modularComplianceImplementation,
    tokenImplementation
) {
    const trexImplementationAuthority = await ethers.deployContract(
        'TREXImplementationAuthority',
        [true, ethers.ZeroAddress, ethers.ZeroAddress],
        deployer
    );

    await trexImplementationAuthority.waitForDeployment();

    const versionStruct = {
        major: 4,
        minor: 0,
        patch: 0
    };

    const contractsStruct = {
        tokenImplementation: await tokenImplementation.getAddress(),
        ctrImplementation: await claimTopicsRegistryImplementation.getAddress(),
        irImplementation: await identityRegistryImplementation.getAddress(),
        irsImplementation:
            await identityRegistryStorageImplementation.getAddress(),
        tirImplementation:
            await trustedIssuersRegistryImplementation.getAddress(),
        mcImplementation: await modularComplianceImplementation.getAddress()
    };

    const tx = await trexImplementationAuthority
        .connect(deployer)
        .addAndUseTREXVersion(versionStruct, contractsStruct);

    await tx.wait();

    return { trexImplementationAuthority };
}

async function deployTrexSuite(deployer) {
    const {
        claimTopicsRegistryImplementation,
        trustedIssuersRegistryImplementation,
        identityRegistryStorageImplementation,
        identityRegistryImplementation,
        modularComplianceImplementation,
        tokenImplementation
    } = await deployTrexLogicSuite(deployer);

    const { trexImplementationAuthority } = await deployImplementationAuthority(
        deployer,
        claimTopicsRegistryImplementation,
        trustedIssuersRegistryImplementation,
        identityRegistryStorageImplementation,
        identityRegistryImplementation,
        modularComplianceImplementation,
        tokenImplementation
    );

    return {
        trexImplementationAuthority: {
            address: await trexImplementationAuthority.getAddress(),
            abi: trexImplementationAuthority.interface.fragments
        },
        claimTopicsRegistryImplementation: {
            address: await claimTopicsRegistryImplementation.getAddress(),
            abi: claimTopicsRegistryImplementation.interface.fragments
        },
        trustedIssuersRegistryImplementation: {
            address: await trustedIssuersRegistryImplementation.getAddress(),
            abi: trustedIssuersRegistryImplementation.interface.fragments
        },
        identityRegistryImplementation: {
            address: await identityRegistryImplementation.getAddress(),
            abi: identityRegistryImplementation.interface.fragments
        },
        identityRegistryStorageImplementation: {
            address: await identityRegistryStorageImplementation.getAddress(),
            abi: identityRegistryStorageImplementation.interface.fragments
        },
        modularComplianceImplementation: {
            address: await modularComplianceImplementation.getAddress(),
            abi: modularComplianceImplementation.interface.fragments
        },
        tokenImplementation: {
            address: await tokenImplementation.getAddress(),
            abi: tokenImplementation.interface.fragments
        }
    };
}

module.exports = { deployTrexSuite };
