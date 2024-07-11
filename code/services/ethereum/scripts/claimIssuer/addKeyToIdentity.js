const { ethers, JsonRpcProvider } = require('ethers');

/**
 * Add trusted claim issuer public key to the identity
 * With this key, the issuer can sign claims for the identity
 *
 * @param {*} identity - Identity contract to which the key will be added
 * @param {*} identityWallet - Wallet of the identity owner
 * @param {*} claimIssuerWallet - Claim issuer wallet that will sign and add the claim to the identity
 * @param {*} keyPurpose - Key purpose (e.g. 3-CLAIM_SIGNER)
 * @param {*} keyType - Key type (e.g. 1-ECDSA)
 */
async function addKeyToIdentity(
    identity,
    identityWallet,
    claimIssuerWallet,
    keyPurpose,
    keyType
) {
    try {

        // console.log(
        //     '[!] Adding key to Identity w/ Wallet: ',
        //     await identityWallet.getAddress()
        // );

        console.log(identityWallet)

        // Add the key to the identity
        const tx = await identity.connect(identityWallet).addKey(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address'],
                    [claimIssuerWallet.address]
                )
            ),
            keyPurpose, // KeyPurpose.CLAIM_SIGNER
            keyType // KeyType.ECDSA
        );

        console.log(tx)


        const tx_receipt = await tx.wait();

        let keyAdded = [];

        tx_receipt.logs.forEach(item => {
            if (item.eventName !== undefined && item.eventName === 'KeyAdded') {
                console.log('[✓] Key added:', item.args.key);
                keyAdded = item.args;
            }
        });

        return keyAdded;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { addKeyToIdentity };
