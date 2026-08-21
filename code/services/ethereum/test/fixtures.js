const { ethers } = require('hardhat');
const {
    contracts: { Factory, Identity, ImplementationAuthority, ClaimIssuer }
} = require('@onchain-id/solidity');

// hardhat's ethers.deployContract / ContractFactory.deploy resolve as soon as the
// deployment tx is *broadcast*, not mined. On the in-process Hardhat network every
// tx is auto-mined instantly so that is invisible; on a real block-time chain
// (e.g. the Besu consortium) the contract has no code yet, and the next
// estimateGas/call against it silently runs against a code-less address (a no-op
// that under-estimates gas -> the follow-up tx runs out of gas). These helpers
// force each deployment/dependent tx to be mined before we depend on it. They are
// no-ops on the instant-mining network, so the test suite is unaffected.
async function deployed(deployPromise) {
    const contract = await deployPromise;
    await contract.waitForDeployment();
    return contract;
}
async function sent(txPromise) {
    const tx = await txPromise;
    await tx.wait();
    return tx;
}

async function deployFactoryFixture() {
    const [deployerWallet, aliceWallet, bobWallet] = await ethers.getSigners();

    // On Chain Id implementation
    const IdentityContract = new ethers.ContractFactory(
        Identity.abi,
        Identity.bytecode,
        deployerWallet
    );
    const identityImplementation = await deployed(IdentityContract.deploy(
        deployerWallet.address, // owner
        true // isLibrary - true for IdentityFactory
    ));

    // On Chain Id implementation authority -> Points to the implementation contract
    const ImplementationAuthorityContract = await new ethers.ContractFactory(
        ImplementationAuthority.abi,
        ImplementationAuthority.bytecode,
        deployerWallet
    );

    const implementationAuthority =
        await deployed(ImplementationAuthorityContract.deploy(
            await identityImplementation.getAddress()
        ));

    // On Chain Id Factory -> Points to the implementation authority
    const IdentityFactory = await new ethers.ContractFactory(
        Factory.abi,
        Factory.bytecode,
        deployerWallet
    );
    const identityFactory = await deployed(IdentityFactory.deploy(
        await implementationAuthority.getAddress()
    ));

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
    const claimIssuer = await deployed(new ethers.ContractFactory(
        ClaimIssuer.abi,
        ClaimIssuer.bytecode,
        claimIssuerWallet
    ).deploy(claimIssuerWallet.address));

    // Add ClaimIssuer as self claim signer
    await sent(claimIssuer
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
        ));

    // Create an identity for Alice
    await sent(identityFactory
        .connect(deployerWallet)
        .createIdentity(aliceWallet.address, 'alice-salt'));

    // Create an identity for Bob
    await sent(identityFactory
        .connect(deployerWallet)
        .createIdentity(bobWallet.address, 'bob-salt'));

    // Create an identity for ClaimIssuer
    await sent(identityFactory
        .connect(deployerWallet)
        .createIdentity(claimIssuerWallet.address, 'claim-issuer-salt'));

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
    const claimTopicsRegistryImplementation = await deployed(ethers.deployContract(
        'ClaimTopicsRegistry',
        deployerWallet
    ));
    const trustedIssuersRegistryImplementation = await deployed(ethers.deployContract(
        'TrustedIssuersRegistry',
        deployerWallet
    ));
    const identityRegistryStorageImplementation = await deployed(ethers.deployContract(
        'IdentityRegistryStorage',
        deployerWallet
    ));
    const identityRegistryImplementation = await deployed(ethers.deployContract(
        'IdentityRegistry',
        deployerWallet
    ));
    const modularComplianceImplementation = await deployed(ethers.deployContract(
        'ModularCompliance',
        deployerWallet
    ));
    const tokenImplementation = await deployed(ethers.deployContract('Token', deployerWallet));
    const {
        identityFactory,
        implementationAuthority: identityImplementationAuthority
    } = await deployFactoryFixture();

    const trexImplementationAuthority = await deployed(ethers.deployContract(
        'TREXImplementationAuthority',
        [true, ethers.ZeroAddress, ethers.ZeroAddress],
        deployerWallet
    ));
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
    await sent(trexImplementationAuthority
        .connect(deployerWallet)
        .addAndUseTREXVersion(versionStruct, contractsStruct));

    const trexFactory = await deployed(ethers.deployContract(
        'TREXFactory',
        [
            await trexImplementationAuthority.getAddress(),
            await identityFactory.getAddress()
        ],
        deployerWallet
    ));
    await sent(identityFactory
        .connect(deployerWallet)
        .addTokenFactory(await trexFactory.getAddress()));

    const claimTopicsRegistry = await ethers
        .deployContract(
            'ClaimTopicsRegistryProxy',
            [await trexImplementationAuthority.getAddress()],
            deployerWallet
        )
        .then(async proxy => {
            await proxy.waitForDeployment();
            return ethers.getContractAt(
                'ClaimTopicsRegistry',
                await proxy.getAddress()
            );
        });

    const trustedIssuersRegistry = await ethers
        .deployContract(
            'TrustedIssuersRegistryProxy',
            [await trexImplementationAuthority.getAddress()],
            deployerWallet
        )
        .then(async proxy => {
            await proxy.waitForDeployment();
            return ethers.getContractAt(
                'TrustedIssuersRegistry',
                await proxy.getAddress()
            );
        });

    const identityRegistryStorage = await ethers
        .deployContract(
            'IdentityRegistryStorageProxy',
            [await trexImplementationAuthority.getAddress()],
            deployerWallet
        )
        .then(async proxy => {
            await proxy.waitForDeployment();
            return ethers.getContractAt(
                'IdentityRegistryStorage',
                await proxy.getAddress()
            );
        });

    const defaultCompliance = await deployed(ethers.deployContract(
        'DefaultCompliance',
        deployerWallet
    ));

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
        .then(async proxy => {
            await proxy.waitForDeployment();
            return ethers.getContractAt('IdentityRegistry', await proxy.getAddress());
        });

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
        .then(async proxy => {
            await proxy.waitForDeployment();
            return ethers.getContractAt('Token', await proxy.getAddress());
        });


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
