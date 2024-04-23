const { ethers } = require("hardhat");
const { deployOnchainIdSuite } = require("./aux/deployOnchainIdSuite");
const { createIdentity } = require("./aux/createOnchainIdIdentity");
const { deployClaimIssuer } = require("./deploy-claimIssuer"); // It is necessary to deploy the ClaimIssuer contract?
const { addClaimIssuer } = require("./aux/addClaimIssuer");

/**
 * Main function that serve as test for some operations between identities and ClaimIssuers
 *
 * First: Deploy the OnchainIdSuite obeying to the Factory pattern
 * Second: Create an identity for aliceWallet
 * Third: Create an identity for bobWallet
 * Fourth: Add the aliceWallet as a ClaimIssuer for the bobWallet
 * Fifth: Add a claim to the bobWallet (TODO)
 * ========================= First Step Done ===========================
 *
 * First: Deploy the TrexSuite obeying to the Factory pattern
 * More to be discovered from trex contracts ...
 *
 */
async function main() {
    const [deployer, aliceWallet, bobWallet] = await ethers.getSigners();
    const { identityFactory } = await deployOnchainIdSuite(deployer);

    // Create an identity for aliceWallet
    await createIdentity(
        identityFactory,
        aliceWallet.address,
        deployer,
        "alice-salt"
    );

    // Create an identity for bobWallet
    await createIdentity(
        identityFactory,
        bobWallet.address,
        deployer,
        "bob-salt"
    );

    // Add the aliceWallet as a ClaimIssuer for the bobWallet
    await addClaimIssuer(identityFactory, bobWallet, aliceWallet);

    //TODO - Add a claim to the bobWallet.
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
