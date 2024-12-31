/**
 * Returns true if the issuer is a self-signer or false otherwise
 *
 * @param {ethers.Contract} claimIssuer The claim issuer contract
 * @param {ethers.Contract} identityIssued The identity contract that will receive the claim
 */
async function isSelfSigner(claimIssuer, identityIssued) {
    console.log(
        `[!] Checking if claim issuer: ${identityIssued} is self-signer: ${claimIssuer}`
    );

    return (
        (await claimIssuer.getAddress()) === (await identityIssued.getAddress())
    );
}

module.exports = { isSelfSigner };
