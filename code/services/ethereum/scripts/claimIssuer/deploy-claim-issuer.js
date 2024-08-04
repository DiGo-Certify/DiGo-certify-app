const { ethers } = require('ethers');
const {
    contracts: { ClaimIssuer }
} = require('@onchain-id/solidity');
const config = require('../../../../config.json');
const { useRpcProvider } = require('../utils/useRpcProvider');
const { addClaim } = require('../claims/add-claim');
const { CLAIM_TOPICS_OBJ, CLAIM_TOPICS } = require('../claims/claimTopics');
const { addIssuerToConfig } = require('../../../config/addIssuerToConfig');
const { getContractAt } = require('../utils/ethers');

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
 * @param {*} deployer - [Optional] The deployer signer for the Trusted Issuers Registry if different from the app owner
 * @param {*} claimTopics - The list of claims topics that the ClaimIssuer will be able to sign
 * @param {*} issuerWallet - The wallet for which to deploy the ClaimIssuer
 * @param {*} institutionCode - [Optional] The institution code to add as a claim to the ClaimIssuer
 */
async function deployClaimIssuer(
    TIR = undefined,
    issuerWallet = undefined,
    deployer = undefined,
    privateKey = undefined,
    institutionCode = undefined
) {
    try {
        if (!deployer) {
            deployer = useRpcProvider(config.rpc, config.deployer.privateKey); // app owner
        }

        let newIssuerWallet;
        if (!issuerWallet) {
            console.log('Creating issuer wallet');
            console.log('privateKey:', privateKey);
            const provider = new ethers.JsonRpcProvider(config.rpc);
            newIssuerWallet = new ethers.Wallet(privateKey, provider);
        } else {
            newIssuerWallet = issuerWallet;
        }

        console.log(
            '[!] Deploying ClaimIssuer for wallet with address:',
            newIssuerWallet.address
        );

        const claimIssuerContract = await new ethers.ContractFactory(
            ClaimIssuer.abi,
            ClaimIssuer.bytecode,
            newIssuerWallet
        ).deploy(newIssuerWallet.address);

        // Wait for contract to be deployed
        await claimIssuerContract.waitForDeployment();

        // Add keys for signing claims to the ClaimIssuer
        await claimIssuerContract
            .connect(newIssuerWallet)
            .addKey(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [newIssuerWallet.address]
                    )
                ),
                SIGN_CLAIM_PURPOSE,
                ECDSA_KEY_TYPE
            );

        console.log(
            `[+] Deployed ClaimIssuer: ${await claimIssuerContract.getAddress()}`
        );

        const ethersClaimTopics = CLAIM_TOPICS.map(topic => ethers.id(topic));

        if (!TIR) {
            TIR = getContractAt(
                config.trex.trustedIssuersRegistry.address,
                config.trex.trustedIssuersRegistry.abi,
                deployer
            );
        }

        // Add the claimIssuer to the trusted issuers registry
        const tx_add_ti = await TIR.connect(deployer).addTrustedIssuer(
            await claimIssuerContract.getAddress(),
            ethersClaimTopics
        );
        const receipt_add_ti = await tx_add_ti.wait();

        receipt_add_ti.logs.forEach(async item => {
            if (
                item.eventName !== undefined &&
                item.eventName === 'TrustedIssuerAdded'
            ) {
                console.log(
                    `[+] Added ClaimIssuer to Trusted Issuers Registry at: ${await TIR.getAddress()}`
                );
            }
        });

        if (institutionCode !== undefined) {
            console.log(
                `[!] Adding claim for institution code: ${institutionCode}`
            );
            // Add a claim for the institution code to the ClaimIssuer
            await addClaim(
                TIR,
                claimIssuerContract,
                claimIssuerContract,
                newIssuerWallet,
                CLAIM_TOPICS_OBJ.INSTITUTION,
                institutionCode.toString()
            );

            console.log(
                `[+] Added claim for institution code: ${institutionCode} to ClaimIssuer at: ${await claimIssuerContract.getAddress()}`
            );

            // Add to the list of institutions the Claim Issuer created
            // This is useful for the app to know which claim issuers are available
            addIssuerToConfig(
                institutionCode.toString(),
                newIssuerWallet.address,
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
