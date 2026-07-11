const { ethers } = require('ethers');
const { deployOnchainIDSuite } = require('./suites/OID');
const { deployTrexSuite } = require('./suites/TREX');
const { uploadConfig } = require('../../config/uploadConfiguration');
const config = require('../../config/loadConfig');
const { deployClaimIssuer } = require('./claimIssuer/deploy-claim-issuer');
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
    const deployerWallet = getWallet(config.deployer.privateKey, provider);
    const deployer = new ethers.NonceManager(deployerWallet);

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

    const institutions = config.institutions || [];
    for (const institution of institutions) {
        if (!institution.wallet?.privateKey || !institution.institutionID) {
            continue;
        }

        await deployClaimIssuer(
            trustedIR,
            undefined,
            deployer,
            institution.wallet.privateKey,
            institution.institutionID
        );
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
