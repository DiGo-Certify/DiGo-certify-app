const { ethers } = require('ethers');
const { deployOnchainIDSuite } = require('./suites/OID');
const { deployTrexSuite } = require('./suites/TREX');
const { uploadConfig } = require('../../config/uploadConfiguration');
const config = require('../../../config.json');
const { deployClaimIssuer } = require('./claimIssuer/deploy-claim-issuer');
const { CLAIM_TOPICS } = require('./claims/claimTopics');
const { getContractAt, getWallet } = require('./utils/ethers');

/**
 * Responsible for deploying into the Ethereum network the following contracts(addresses and ABIs):
 * - IdentityFactory contract (OID suite)
 * - TREX implementation authority contract (TREX suite)
 *    claim topics:
 *      - INSTITUTION
 *      - CERTIFICATE
 *      - STUDENT
 * - TrustedIssuersRegistry contract (TREX suite)
 *      - With some initial trusted issuers (for signing claims for the INSTITUTION topic)
 * - IdentityRegistryStorage contract (TREX suite)  [Not used in this version]
 * - IdentityRegistry contract (TREX suite)         [Not used in this version]
 * - ModularCompliance contract (TREX suite)        [Not used in this version]
 * - Token contract (TREX suite)                    [Not used in this version]
 *
 */
async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const deployer = getWallet(config.deployer.privateKey, provider); // app owner private key

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

    const trustedIR = getContractAt(
        trustedIssuersRegistry.address,
        trustedIssuersRegistry.abi,
        deployer
    );

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
        token
    );

    // Initial trusted issuers for the CLAIM_TOPICS = ['INSTITUTION', 'STUDENT', 'CERTIFICATE'] is the app owner
    // await deployClaimIssuer(
    //     trustedIR,
    //     undefined,
    //     deployer,
    //     config.deployer.privateKey,
    //     3117,
    // );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
