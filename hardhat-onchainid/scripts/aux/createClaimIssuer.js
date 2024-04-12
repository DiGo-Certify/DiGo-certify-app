const { ethers } = require("hardhat");
const {
    contracts: { ClaimIssuer }
} = require("@onchain-id/solidity");

/**
 * Adds a key to the ClaimIssuer that will be used to sign claims
 *
 * @param {*} contractAddress The address of the ClaimIssuer contract
 * @param {*} deployer The wallet that deployed the ClaimIssuer contract
 * @param {*} destiny The wallet of the entity that will be added the ClaimIssuer
 * @param {*} type The type of the key that will be added to the ClaimIssuer, see OnChainId docs - https://github.com/onchain-id/solidity/blob/main/contracts/Identity.sol
 */
async function createClaimIssuer(contractAddress, deployer, destiny, type) {
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
    const tx = await claimIssuerContract.connect(deployer).addKey(
        ethers.keccak256(abi.encode(["address"], [destiny.address])),
        3, // Purpose - 3 is for Claim
        type
    );
    const txReceipt = await tx.wait();
    const event = txReceipt.logs.find(e => e.eventName === "KeyAdded");

    console.log(`\n[✓] The entity ${destiny.address} is now a ClaimIssuer!`);

    return event.args;
}

module.exports = { createClaimIssuer };
