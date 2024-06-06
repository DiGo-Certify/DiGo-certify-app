const { ethers } = require("hardhat");
const {
    contracts: { ClaimIssuer }
} = require("@onchain-id/solidity");
const { getIdentity } = require("./getIdentity");
const { deployClaimIssuer } = require("../deploy-claimIssuer");

/**
 * Function that will add a claim to an identity
 *
 * If is not a ClaimIssuer of the identity, the function will throw an error
 * If the identity does not exist, the function will throw an error
 *
 */
async function addClaim(identityFactory, claimIssuerWallet, receiverWallet) {
    // Get claimIssuer contract address
    console.log(`\n[!] Deploying ClaimIssuer Factory ...`);

    // Deploy the ClaimIssuer contract (necessary?)
    const claimIssuerAddress = await deployClaimIssuer(claimIssuerWallet);

    // Get the identity of receiver
    const receiverId = await getIdentity(identityFactory, receiverWallet);
    const receiverIdAddress = await receiverId.getAddress();
 
    console.log(`\n[✓] ReceiverId: ${receiverIdAddress}`);


    // Claim object that will be added to the receiver
    let claim = {
        identity: receiverIdAddress,
        topic: 666,
        scheme: 1,
        issuer: claimIssuerAddress,
        signature: "",
        data: "0x0042",
        uri: "https://example.com"
    };

    // Sign the claim
    claim.signature = await claimIssuerWallet.signMessage(
        ethers.getBytes(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "uint256", "bytes"],
                    [claim.identity, claim.topic, claim.data]
                )
            )
        )
    );

    console.log(`\n[!] Adding Claim ...`);
    // Add a claim to the receiver
    const tx = await receiverId
        .connect(receiverWallet)
        .addClaim(
            claim.topic,
            claim.scheme,
            claim.issuer,
            claim.signature,
            claim.data,
            claim.uri
        );
    const txReceipt = await tx.wait();
    const event = txReceipt.logs.find(e => e.eventName === "ClaimAdded");

    // console.log(event.fragment.inputs);

    console.log(
        `\n[✓] Claim "${event.args.claimId}" added to identity "${receiverIdAddress}" by issuer "${claim.issuer}"`
    );

    return event.args[0];
}

module.exports = { addClaim };
