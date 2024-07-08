const { ethers } = require('hardhat');
const {
    contracts: { Factory, Identity, ImplementationAuthority, ClaimIssuer }
} = require('@onchain-id/solidity');

async function deployFactoryFixture() {
    const [deployerWallet, aliceWallet, bobWallet] = await ethers.getSigners();

    // On Chain Id implementation
    const IdentityContract = new ethers.ContractFactory(
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

    return {
        deployerWallet,
        aliceWallet,
        bobWallet,
        identityImplementation,
        implementationAuthority,
        identityFactory
    };
}

async function deployIdentityFixture() {
    const [deployerWallet, aliceWallet, bobWallet, claimIssuerWallet] =
        await ethers.getSigners();

    const { identityFactory, identityImplementation, implementationAuthority } =
        await deployFactoryFixture();

    // Add the ClaimIssuer as a ClaimIssuer
    const claimIssuer = await new ethers.ContractFactory(
        ClaimIssuer.abi,
        ClaimIssuer.bytecode,
        claimIssuerWallet
    ).deploy(claimIssuerWallet.address);

    // Add ClaimIssuer as self claim signer
    await claimIssuer
        .connect(claimIssuerWallet)
        .addKey(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address'],
                    [claimIssuerWallet.address]
                )
            ),
            3,
            1
        );

    // Create an identity for Alice
    await identityFactory
        .connect(deployerWallet)
        .createIdentity(aliceWallet.address, 'alice-salt');

    // Create an identity for Bob
    await identityFactory
        .connect(deployerWallet)
        .createIdentity(bobWallet.address, 'bob-salt');

    // Create an identity for ClaimIssuer
    await identityFactory
        .connect(deployerWallet)
        .createIdentity(claimIssuerWallet.address, 'claim-issuer-salt');

    // Get the identity address for Alice
    const aliceIdentity = await identityFactory.getIdentity(
        aliceWallet.address
    );

    // Get the identity address for Bob
    const bobIdentity = await identityFactory.getIdentity(bobWallet.address);

    return {
        deployerWallet,
        aliceWallet,
        bobWallet,
        identityFactory,
        identityImplementation,
        implementationAuthority,
        aliceIdentity,
        bobIdentity,
        claimIssuerWallet,
        claimIssuer
    };
}

async function deployFullTREXSuiteFixture() {
    const [deployerWallet, agentWallet] = await ethers.getSigners();

    // Deploy implementations
    const claimTopicsRegistryImplementation = await ethers.deployContract(
        'ClaimTopicsRegistry',
        deployerWallet
    );
    const trustedIssuersRegistryImplementation = await ethers.deployContract(
        'TrustedIssuersRegistry',
        deployerWallet
    );
    const identityRegistryStorageImplementation = await ethers.deployContract(
        'IdentityRegistryStorage',
        deployerWallet
    );
    const identityRegistryImplementation = await ethers.deployContract(
        'IdentityRegistry',
        deployerWallet
    );
    const modularComplianceImplementation = await ethers.deployContract(
        'ModularCompliance',
        deployerWallet
    );
    const tokenImplementation = await ethers.deployContract('Token', deployerWallet);
    const {
        identityFactory,
        implementationAuthority: identityImplementationAuthority
    } = await deployFactoryFixture();

    const trexImplementationAuthority = await ethers.deployContract(
        'TREXImplementationAuthority',
        [true, ethers.ZeroAddress, ethers.ZeroAddress],
        deployerWallet
    );
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
    await trexImplementationAuthority
        .connect(deployerWallet)
        .addAndUseTREXVersion(versionStruct, contractsStruct);

    const trexFactory = await ethers.deployContract(
        'TREXFactory',
        [
            await trexImplementationAuthority.getAddress(),
            await identityFactory.getAddress()
        ],
        deployerWallet
    );
    await identityFactory
        .connect(deployerWallet)
        .addTokenFactory(await trexFactory.getAddress());

    const claimTopicsRegistry = await ethers
        .deployContract(
            'ClaimTopicsRegistryProxy',
            [await trexImplementationAuthority.getAddress()],
            deployerWallet
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
            deployerWallet
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
            deployerWallet
        )
        .then(async proxy =>
            ethers.getContractAt(
                'IdentityRegistryStorage',
                await proxy.getAddress()
            )
        );

    const defaultCompliance = await ethers.deployContract(
        'DefaultCompliance',
        deployerWallet
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
            deployerWallet
        )
        .then(async proxy =>
            ethers.getContractAt('IdentityRegistry', await proxy.getAddress())
        );

    const tokenName = 'TREXDINO';
    const tokenSymbol = 'TREX';
    const token = await ethers
        .deployContract(
            'TokenProxy',
            [
                await trexImplementationAuthority.getAddress(),
                await identityRegistry.getAddress(),
                await defaultCompliance.getAddress(),
                tokenName,
                tokenSymbol,
                0n,
                ethers.ZeroAddress
            ],
            deployerWallet
        )
        .then(async proxy =>
            ethers.getContractAt('Token', await proxy.getAddress())
        );


    return {
        deployerWallet,
        agentWallet,
        trexImplementationAuthority,
        claimTopicsRegistry,
        trustedIssuersRegistry,
        identityRegistryStorage,
        identityRegistry,
        modularCompliance: defaultCompliance,
        token,
        identityFactory,
    };
}
module.exports = {
    deployFactoryFixture,
    deployIdentityFixture,
    deployFullTREXSuiteFixture
};
