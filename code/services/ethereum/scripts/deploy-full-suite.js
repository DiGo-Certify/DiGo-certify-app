const { ethers } = require('ethers');
const { deployOnchainIDSuite } = require('./suites/OID');
const { deployTrexSuite } = require('./suites/TREX');
const { uploadConfig } = require('./utils/uploadConfiguration');
const config = require('../../../config.json');
const { deployClaimIssuer } = require('./claimIssuer/deploy-claim-issuer');
const { CLAIM_TOPICS } = require('./claims/claimTopics');

/**
 * Responsible for deploying into the Ethereum network the following contracts(addresses and ABIs):
 * - IdentityFactory contract (OID suite)
 * - TREX implementation authority contract (TREX suite)
 * - ClaimTopicsRegistry contract (TREX suite)
 *    - With the claim topics:      //TODO
 *      - INSTITUTION
 *      - CERTIFICATE
 *      - STUDENT
 * - TrustedIssuersRegistry contract (TREX suite)
 *      - With some initial trusted issuers (for signing claims for the INSTITUTION topic)
 * - IdentityRegistryStorage contract (TREX suite)
 * - IdentityRegistry contract (TREX suite)
 * - ModularCompliance contract (TREX suite)
 * - Token contract (TREX suite)
 *
 */
async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const deployer = new ethers.Wallet(config.deployer.privateKey, provider);

    const { identityFactoryAbi, identityFactoryAddress } =
        await deployOnchainIDSuite(deployer);

    const {
        trexImplementationAuthority,
        claimTopicsRegistry,
        trustedIssuersRegistry,
        identityRegistry,
        identityRegistryStorage,
        modularCompliance,
        token
    } = await deployTrexSuite(deployer);

    const trustedIR = new ethers.Contract(
        trustedIssuersRegistry.address,
        trustedIssuersRegistry.abi,
        deployer
    );

    // Initial trusted issuers for the INSTITUTION topic
    const initialTrustedIssuers = [
        await deployClaimIssuer(
            trustedIR,
            CLAIM_TOPICS,
            new ethers.Wallet(
                config.institutions[0].wallet.privateKey,
                provider
            ),
            deployer
        ),
        await deployClaimIssuer(
            trustedIR,
            CLAIM_TOPICS,
            new ethers.Wallet(
                config.institutions[1].wallet.privateKey,
                provider
            ),
            deployer
        ),
        await deployClaimIssuer(
            trustedIR,
            CLAIM_TOPICS,
            new ethers.Wallet(
                config.institutions[2].wallet.privateKey,
                provider
            ),
            deployer
        )
    ];

    // Update the configuration file
    uploadConfig(
        identityFactoryAddress,
        identityFactoryAbi,
        trexImplementationAuthority,
        claimTopicsRegistry,
        trustedIssuersRegistry,
        identityRegistryStorage,
        identityRegistry,
        modularCompliance,
        token,
        initialTrustedIssuers
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
