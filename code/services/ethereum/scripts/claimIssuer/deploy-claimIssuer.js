const { ethers } = require('ethers');
const {
    contracts: { ClaimIssuer }
} = require('@onchain-id/solidity');
const config = require('../../../../config.json');
const { useRpcProvider } = require('../utils/useRpcProvider');

const SIGN_CLAIM_PURPOSE = 3;
const ECDSA_KEY_TYPE = 1;

/**
 * Function to deploy a ClaimIssuer contract for a specific wallet address
 * and add it to the Trusted Issuers Registry (TIR)
 * 
 * The ClaimIssuer will be able to sign claims for the specified claim topics
 *
 * @param {*} TIR - The Trusted Issuers Registry contract
 * @param {*} deployerTIR - The deployer signer for the Trusted Issuers Registry
 * @param {*} claimTopics - The list of claims topics that the ClaimIssuer will be able to sign
 * @param {*} address - The wallet address for which to deploy the ClaimIssuer
 * @param {*} deployer - [Optional] The deployer signer if different from the app owner
 */
async function deployClaimIssuer(TIR, claimTopics, deployer = undefined, deployerTIR = undefined) {
    try {
        if (deployer === undefined) {
            deployer = useRpcProvider(config.rpc, config.deployer.privateKey); // app owner
        } else if (deployerTIR === undefined) {
            deployerTIR = deployer;
        }
        
        console.log(
            '[!] Deploying ClaimIssuer for wallet with address:',
            deployer.address
        );

        const claimIssuerContract = await new ethers.ContractFactory(
            ClaimIssuer.abi,
            ClaimIssuer.bytecode,
            deployer
        ).deploy(deployer.address);

        // Wait for contract to be deployed
        await claimIssuerContract.waitForDeployment();

        // Add keys for signing claims to the ClaimIssuer
        await claimIssuerContract
            .connect(deployer)
            .addKey(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [deployer.address]
                    )
                ),
                SIGN_CLAIM_PURPOSE,
                ECDSA_KEY_TYPE
            );

        console.log(
            `[+] Deployed ClaimIssuer: ${await claimIssuerContract.getAddress()}`
        );

        // Add the claimIssuer to the trusted issuers registry
        await TIR.connect(deployerTIR).addTrustedIssuer(await claimIssuerContract.getAddress(), claimTopics);
        console.log(
            `[+] Added ClaimIssuer to Trusted Issuers Registry at: ${await TIR.getAddress()}`
        );


        return {claimIssuerContract, TIR};
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { deployClaimIssuer };
