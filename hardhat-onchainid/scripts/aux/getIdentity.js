const { ethers } = require("hardhat");
const {
    contracts: { Identity }
} = require("@onchain-id/solidity");

/**
 * Function to retrieve an onchain identity
 *
 * @param {*} identityFactory - The IdentityFactory contract that will be used to get the identity
 * @param {*} wallet - The wallet of the entity that we want to get the identity
 * @returns
 */
async function getIdentity(identityFactory, wallet) {
    console.log(`\n[!] Getting Identity ...`);

    // Get the identity of the wallet
    const identity = await ethers.getContractAt(
        Identity.abi,
        await identityFactory.getIdentity(wallet.address)
    );

    console.log(`\n[✓] Identity retrieved: ${await identity.getAddress()}`);

    return identity;
}

module.exports = { getIdentity };
