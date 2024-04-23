const { ethers } = require("hardhat");
const {
    contracts: { Identity }
} = require("@onchain-id/solidity");
const { getIdentity } = require("./getIdentity");

/**
 * Adds a key to the ClaimIssuer that will be used to sign claims
 *
 * @param {*} identityFactory The IdentityFactory contract that will be used to get the identity
 * @param {*} entityWallet The wallet of the entity that will ask to have permissions to sign claims
 * @param {*} managementKey The management key that has the permissions to add claims for the entity
 */
async function addClaimIssuer(identityFactory, entityWallet, managementKey) {
    const abi = new ethers.AbiCoder();

    console.log(`\n[!] Creating ClaimIssuer ...`);

    // Get the identity of the entity that will add the key to the ClaimIssuer
    const identity = await getIdentity(identityFactory, entityWallet);

    // Create a key for the entity that will be added to the ClaimIssuer - ERRADO, PENSAMENTO INVERSO!
    const tx = await identity.connect(entityWallet).addKey(
        ethers.keccak256(abi.encode(["address"], [managementKey.address])),
        3, // Purpose - 3 is for Claim
        1
    );
    const txReceipt = await tx.wait();
    const event = txReceipt.logs.find(e => e.eventName === "KeyAdded");

    console.log(
        `\n[✓] The owner of wallet ${managementKey.address} is now a ClaimIssuer!`
    );

    return event.args[0];
}

module.exports = { addClaimIssuer };
