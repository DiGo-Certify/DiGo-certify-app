const { ethers } = require('ethers');
const { isTrustedIssuer } = require('../claimIssuer/isTrustedIssuer');
const { isSelfSigner } = require('../claimIssuer/isSelfSigner');
const hash = require('../utils/hash');

/**
 * Responsible for adding a claim to an identity contract
 * Only a trusted issuer can add a claim to an identity
 *
 * @param {*} TIR Trusted Issuers Registry contract
 * @param {*} receiverIdentity Identity contract to which the claim will be added
 * @param {*} claimIssuerContract Claim issuer contract that will sign and add the claim to the identity
 * @param {*} claimIssuerWallet Wallet of the claim issuer
 * @param {*} claimTopic Topic of the claim to be added
 * @param {*} claimData Data of the claim to be added (e.g. institution name, student ID, etc.)
 * @param {*} claimScheme Scheme of the claim to be added (e.g. 1-ECDSA, 2-RSA, etc.)
 * @param {*} uri [Optional] URI where the claim data can be found (e.g. IPFS hash, HTTPS link, etc.)
 */
async function addClaim(
    TIR,
    receiverIdentity,
    claimIssuerContract,
    claimIssuerWallet,
    claimTopic,
    claimData,
    claimScheme = 1,
    uri = ''
) {
    try {
        console.log(
            '[!] Adding claim to identity:',
            await receiverIdentity.getAddress()
        );

        if (
            !(await isTrustedIssuer(TIR, claimIssuerContract)) &&
            !(await isSelfSigner(claimIssuerContract, receiverIdentity))
        ) {
            throw new Error(
                '[x] Claim issuer is not trusted neither self-signer'
            );
        } else {
            console.log('[✓] Claim issuer is trusted or self-signer');

            // Create the claim (see https://github.com/ethereum/EIPs/issues/735)
            const claim = {
                data: hash(claimData),
                issuer: await claimIssuerContract.getAddress(),
                topic: ethers.id(claimTopic),
                scheme: claimScheme,
                identity: await receiverIdentity.getAddress(),
                signature: '',
                claimId: ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address', 'uint'],
                        [
                            await claimIssuerContract.getAddress(),
                            ethers.id(claimTopic)
                        ]
                    )
                ),
                uri: hash(uri)
            };

            // Sign the claim
            claim.signature = await claimIssuerWallet.signMessage(
                ethers.getBytes(
                    ethers.keccak256(
                        ethers.AbiCoder.defaultAbiCoder().encode(
                            ['address', 'uint256', 'bytes'],
                            [claim.identity, claim.topic, claim.data]
                        )
                    )
                )
            );

            console.log('Claim signature:', claim.signature);
            console.log('Claim Topic:', claim.topic);
            console.log('Claim Data:', claim.data);

            // Verify the claim status
            const claimStatus = await claimIssuerContract.isClaimValid(
                await receiverIdentity.getAddress(),
                claim.topic,
                claim.signature,
                claim.data
            );

            console.log('Claim status:', claimStatus);

            if (!claimStatus) {
                throw new Error('[x] Claim is not valid');
            } else {
                console.log('[✓] Claim is valid');
            }

            // Add the claim to the identity
            const tx = await receiverIdentity
                .connect(claimIssuerWallet)
                .addClaim(
                    claim.topic,
                    claim.scheme,
                    claim.issuer,
                    claim.signature,
                    claim.data,
                    uri
                );

            const tx_receipt = await tx.wait();

            let claimAdded = [];

            tx_receipt.logs.forEach(item => {
                if (
                    item.eventName !== undefined &&
                    item.eventName === 'ClaimAdded'
                ) {
                    console.log('[✓] Claim added:', item.args.claimId);
                    claimAdded = item.args;
                }
            });

            return claimAdded;
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports = { addClaim };
