const { ethers } = require('ethers');
const {
    contracts: { ClaimIssuer }
} = require('@onchain-id/solidity');
const config = require('../../../../config.json');
const { useRpcProvider } = require('../utils/useRpcProvider');
const { addClaim } = require('../claims/add-claim');
const { CLAIM_TOPICS_OBJ } = require('../claims/claimTopics');
const { addIssuerToConfig } = require('../../../config/addIssuerToConfig');

const SIGN_CLAIM_PURPOSE = 3;
const ECDSA_KEY_TYPE = 1;

/**
 * Function to deploy a ClaimIssuer contract for a specific wallet address
 * and add it to the Trusted Issuers Registry (TIR)
 *
 * The ClaimIssuer will be able to sign claims for the specified claim topics
 *
 * Optionally can have a claim for an institution code to be identified in the future
 *
 * @param {*} TIR - The Trusted Issuers Registry contract
 * @param {*} deployerTIR - [Optional] The deployer signer for the Trusted Issuers Registry if different from the app owner
 * @param {*} claimTopics - The list of claims topics that the ClaimIssuer will be able to sign
 * @param {*} issuerWallet - The wallet for which to deploy the ClaimIssuer
 * @param {*} institutionCode - [Optional] The institution code to add as a claim to the ClaimIssuer
 */
async function deployClaimIssuer(
    TIR,
    claimTopics,
    issuerWallet,
    deployerTIR = undefined,
    institutionCode = undefined,
    privateKey = undefined
) {
    try {
        if (deployerTIR === undefined) {
            deployerTIR = useRpcProvider(
                config.rpc,
                config.deployer.privateKey
            ); // app owner
        }

        console.log(
            '[!] Deploying ClaimIssuer for wallet with address:',
            issuerWallet.address
        );

        const claimIssuerContract = await new ethers.ContractFactory(
            ClaimIssuer.abi,
            ClaimIssuer.bytecode,
            issuerWallet
        ).deploy(issuerWallet.address);

        // Wait for contract to be deployed
        await claimIssuerContract.waitForDeployment();

        // Add keys for signing claims to the ClaimIssuer
        await claimIssuerContract
            .connect(issuerWallet)
            .addKey(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [issuerWallet.address]
                    )
                ),
                SIGN_CLAIM_PURPOSE,
                ECDSA_KEY_TYPE
            );

        console.log(
            `[+] Deployed ClaimIssuer: ${await claimIssuerContract.getAddress()}`
        );

        const ethersClaimTopics = claimTopics.map(topic => ethers.id(topic));

        // Add the claimIssuer to the trusted issuers registry
        await TIR.connect(deployerTIR).addTrustedIssuer(
            await claimIssuerContract.getAddress(),
            ethersClaimTopics
        );
        console.log(
            `[+] Added ClaimIssuer to Trusted Issuers Registry at: ${await TIR.getAddress()}`
        );

        if (institutionCode !== undefined) {
            console.log(
                `[!] Adding claim for institution code: ${institutionCode}`
            );
            // Add a claim for the institution code to the ClaimIssuer
            await addClaim(
                TIR,
                claimIssuerContract,
                claimIssuerContract,
                issuerWallet,
                CLAIM_TOPICS_OBJ.INSTITUTION,
                institutionCode.toString()
            );

            console.log(
                `[+] Added claim for institution code: ${institutionCode} to ClaimIssuer at: ${await claimIssuerContract.getAddress()}`
            );

            // Add to the list of institutions the Claim Issuer created
            // This is useful for the app to know which claim issuers are available
            addIssuerToConfig(
                institutionCode,
                issuerWallet.address,
                privateKey,
                await claimIssuerContract.getAddress(),
                claimIssuerContract.interface.fragments
            );
        }

        return { claimIssuerContract, TIR };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { deployClaimIssuer };
