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

    // Deploy registries using the proxy pattern
    const claimTopicsRegistry = await ethers
        .deployContract(
            'ClaimTopicsRegistryProxy',
            [await trexImplementationAuthority.getAddress()],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt(
                'ClaimTopicsRegistry',
                await proxy.getAddress()
            )
        );

    const trustedIssuersRegistry = await ethers
        .deployContract(
            'TrustedIssuersRegistryProxy',
            [await trexImplementationAuthority.getAddress()],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt(
                'TrustedIssuersRegistry',
                await proxy.getAddress()
            )
        );

    const identityRegistryStorage = await ethers
        .deployContract(
            'IdentityRegistryStorageProxy',
            [await trexImplementationAuthority.getAddress()],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt(
                'IdentityRegistryStorage',
                await proxy.getAddress()
            )
        );

    const identityRegistry = await ethers
        .deployContract(
            'IdentityRegistryProxy',
            [
                await trexImplementationAuthority.getAddress(),
                await trustedIssuersRegistry.getAddress(),
                await claimTopicsRegistry.getAddress(),
                await identityRegistryStorage.getAddress()
            ],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt('IdentityRegistry', await proxy.getAddress())
        );

    const modularCompliance = await ethers
        .deployContract(
            'ModularComplianceProxy',
            [await trexImplementationAuthority.getAddress()],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt('ModularCompliance', await proxy.getAddress())
        );

    // Need to initialize the OID later
    const token = await ethers
        .deployContract(
            'TokenProxy',
            [
                await trexImplementationAuthority.getAddress(),
                await identityRegistry.getAddress(),
                await modularCompliance.getAddress(),
                'TREX-TOKEN',
                'TREX',
                0n,
                ethers.ZeroAddress
            ],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt('Token', await proxy.getAddress())
        );

    console.log(
        `[+] Deployed Claim Topic Registry at ${await claimTopicsRegistry.getAddress()}`
    );

    console.log(
        `[+] Deployed Trusted Issuers Registry at ${await trustedIssuersRegistry.getAddress()}`
    );
    console.log(
        `[+] Deployed Identity Registry Storage at ${await identityRegistryStorage.getAddress()}`
    );
    console.log(
        `[+] Deployed Identity Registry at ${await identityRegistry.getAddress()}`
    );
    console.log(
        `[+] Deployed Modular Compliance at ${await modularCompliance.getAddress()}`
    );
    console.log(`[+] Deployed Token at ${await token.getAddress()}`);

    return {
        trexImplementationAuthority: {
            address: await trexImplementationAuthority.getAddress(),
            abi: trexImplementationAuthority.interface.fragments
        },
        claimTopicsRegistry: {
            address: await claimTopicsRegistry.getAddress(),
            abi: claimTopicsRegistry.interface.fragments
        },
        trustedIssuersRegistry: {
            address: await trustedIssuersRegistry.getAddress(),
            abi: trustedIssuersRegistry.interface.fragments
        },
        identityRegistry: {
            address: await identityRegistry.getAddress(),
            abi: identityRegistry.interface.fragments
        },
        identityRegistryStorage: {
            address: await identityRegistryStorage.getAddress(),
            abi: identityRegistryStorage.interface.fragments
        },
        modularCompliance: {
            address: await modularCompliance.getAddress(),
            abi: modularCompliance.interface.fragments
        },
        token: {
            address: await token.getAddress(),
            abi: token.interface.fragments
        }
    };
}

module.exports = { deployTrexSuite };
