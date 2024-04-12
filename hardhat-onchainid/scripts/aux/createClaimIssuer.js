const { ethers } = require("hardhat");
const {
    contracts: { ClaimIssuer }
} = require("@onchain-id/solidity");

/**
 * Adds a key to the ClaimIssuer that will be used to sign claims
 *
 * @param {*} contractAddress The address of the ClaimIssuer contract
 * @param {*} claimIssuer The wallet that will be the claim issuer
 * @param {*} type The type of the key that will be added to the ClaimIssuer, see OnChainId docs - https://github.com/onchain-id/solidity/blob/main/contracts/Identity.sol
 */
async function createClaimIssuer(contractAddress, claimIssuer, type) {
    const abi = new ethers.AbiCoder();

    // Get the ClaimIssuer contract deployed previously
    const claimIssuerFactory = await ethers.getContractFactory(
        ClaimIssuer.abi,
        ClaimIssuer.bytecode
    );
    const claimIssuerContract = await claimIssuerFactory.attach(
        contractAddress
    );

    console.log(`\n[!] Creating ClaimIssuer ...`);

    // Create a key for the entity that will be added to the ClaimIssuer
    const tx = await claimIssuerContract.connect(claimIssuer).addKey(
        ethers.keccak256(abi.encode(["address"], [claimIssuer.address])),
        3, // Purpose - 3 is for Claim
        type
    );
    const txReceipt = await tx.wait();
    const event = txReceipt.logs.find(e => e.eventName === "KeyAdded");

    console.log(`\n[✓] The owner of wallet ${claimIssuer.address} is now a ClaimIssuer!`);
    console.log(event.args)

    return event.args;
}

module.exports = { createClaimIssuer };
