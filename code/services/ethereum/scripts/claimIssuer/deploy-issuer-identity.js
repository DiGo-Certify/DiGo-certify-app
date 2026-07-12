const { ethers } = require('ethers');
const config = require('../../../config/loadConfig');
const { useRpcProvider } = require('../utils/useRpcProvider');
const { addClaim } = require('../claims/add-claim');
const { CLAIM_TOPICS_OBJ, CLAIM_TOPICS } = require('../claims/claimTopics');
const { addIssuerToConfig } = require('../../../config/addIssuerToConfig');
const { getContractAt } = require('../utils/ethers');
const { deployIdentity } = require('../identities/deploy-identity');

const SIGN_CLAIM_PURPOSE = 3;
const ECDSA_KEY_TYPE = 1;

/**
 * Onboard an institution as an accredited issuer using a lightweight OnchainID
 * *identity proxy* instead of a full ClaimIssuer contract (cf.
 * scripts/claimIssuer/deploy-claim-issuer.js). The issuer is
 * created through the IdentityFactory (the same proxy/factory pattern used for
 * students), which lowers onboarding gas by an order of magnitude because no
 * ~20 KB ClaimIssuer contract is deployed per institution.
 *
 * Functionally it relies on Identity.isClaimValid (signature recovery + the
 * CLAIM_SIGNER key-purpose check), which plain identities already implement; the
 * institution's own wallet key is authorised as a CLAIM_SIGNER so the claims it
 * signs validate, and the identity address is recorded in the Trusted Issuers
 * Registry.
 *
 * Trade-off vs. deployClaimIssuer: this omits ClaimIssuer's signature-based
 * revocation (revokeClaim / revokeClaimBySignature). This system revokes via
 * removeClaim / removeTrustedIssuer, so that path is unaffected. Keep the two
 * functions side by side so the evaluation can compare both onboarding paths.
 *
 * @param {*} TIR - The Trusted Issuers Registry contract
 * @param {*} identityFactory - The IdentityFactory used to create the proxy
 * @param {*} issuerWallet - [Optional] The institution wallet (else built from privateKey)
 * @param {*} deployer - [Optional] The registry owner signer (else app owner from config)
 * @param {*} privateKey - [Optional] The institution wallet key (if issuerWallet omitted)
 * @param {*} institutionCode - [Optional] Institution code recorded as a self-claim
 * @param {*} salt - [Optional] Salt for the identity proxy (defaults to the wallet address)
 */
async function deployIssuerIdentity(
    TIR = undefined,
    identityFactory = undefined,
    issuerWallet = undefined,
    deployer = undefined,
    privateKey = undefined,
    institutionCode = undefined,
    salt = undefined
) {
    try {
        if (!deployer) {
            deployer = useRpcProvider(config.rpc, config.deployer.privateKey); // app owner
        }

        let newIssuerWallet;
        if (!issuerWallet) {
            const provider = deployer.provider || new ethers.JsonRpcProvider(config.rpc);
            newIssuerWallet = new ethers.Wallet(privateKey, provider);
        } else {
            newIssuerWallet = issuerWallet;
        }
        const issuerAddress = await newIssuerWallet.getAddress();

        if (!identityFactory) {
            identityFactory = getContractAt(
                config.identityFactory.address,
                config.identityFactory.abi,
                deployer
            );
        }

        console.log(
            '[!] Onboarding issuer as identity proxy for wallet with address:',
            issuerAddress
        );

        // 1. Deploy a lightweight identity proxy for the institution (factory/proxy).
        const issuerIdentity = await deployIdentity(
            identityFactory,
            issuerAddress,
            salt ?? `issuer-${issuerAddress}`,
            deployer
        );

        // 2. Authorise the institution's own key as a CLAIM_SIGNER on its identity,
        //    so the claims it signs pass isClaimValid (the key-purpose check).
        const addKeyTx = await issuerIdentity
            .connect(newIssuerWallet)
            .addKey(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [issuerAddress]
                    )
                ),
                SIGN_CLAIM_PURPOSE,
                ECDSA_KEY_TYPE
            );
        await addKeyTx.wait();

        console.log(
            `[+] Issuer identity proxy: ${await issuerIdentity.getAddress()}`
        );

        const ethersClaimTopics = CLAIM_TOPICS.map(topic => ethers.id(topic));

        if (!TIR) {
            TIR = getContractAt(
                config.trex.trustedIssuersRegistry.address,
                config.trex.trustedIssuersRegistry.abi,
                deployer
            );
        }

        // 3. Accredit the issuer identity in the Trusted Issuers Registry.
        const tx_add_ti = await TIR.connect(deployer).addTrustedIssuer(
            await issuerIdentity.getAddress(),
            ethersClaimTopics
        );
        const receipt_add_ti = await tx_add_ti.wait();

        receipt_add_ti.logs.forEach(async item => {
            if (
                item.eventName !== undefined &&
                item.eventName === 'TrustedIssuerAdded'
            ) {
                console.log(
                    `[+] Added issuer identity to Trusted Issuers Registry at: ${await TIR.getAddress()}`
                );
            }
        });

        if (institutionCode !== undefined) {
            console.log(
                `[!] Adding claim for institution code: ${institutionCode}`
            );
            // Add a claim for the institution code to the issuer identity itself.
            await addClaim(
                TIR,
                issuerIdentity,
                issuerIdentity,
                newIssuerWallet,
                CLAIM_TOPICS_OBJ.INSTITUTION,
                institutionCode.toString()
            );

            console.log(
                `[+] Added claim for institution code: ${institutionCode} to issuer identity at: ${await issuerIdentity.getAddress()}`
            );

            // Record the issuer for the app, mirroring deployClaimIssuer.
            addIssuerToConfig(
                institutionCode.toString(),
                issuerAddress,
                privateKey,
                await issuerIdentity.getAddress(),
                issuerIdentity.interface.fragments
            );
        }

        // Returned under the same key as deployClaimIssuer so callers can swap
        // the two onboarding paths without further changes.
        return { claimIssuerContract: issuerIdentity, TIR };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { deployIssuerIdentity };
