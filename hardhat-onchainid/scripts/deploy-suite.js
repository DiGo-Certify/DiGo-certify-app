const { ethers } = require("hardhat");
const { deployOnchainIdSuite } = require("./aux/deployOnchainIdSuite");
const { createIdentity } = require("./aux/createOnchainIdIdentity");
const { deployClaimIssuer } = require("./deploy-claimIssuer");
const { createClaimIssuer } = require("./aux/createClaimIssuer");

async function main() {
    const [deployer, aliceWallet, bobWallet] = await ethers.getSigners();
    const { identityFactory } = await deployOnchainIdSuite(deployer);
    const claimIssuerContractAddr = await deployClaimIssuer(deployer);
    // await createIdentity(
    //     identityFactory,
    //     aliceWallet.address,
    //     deployer,
    //     "alice-salt"
    // );
    // await createIdentity(
    //     identityFactory,
    //     bobWallet.address,
    //     deployer,
    //     "bob-salt"
    // );

    // Create a ClaimIssuer
    await createClaimIssuer(claimIssuerContractAddr, deployer, aliceWallet, 1);
    await createClaimIssuer(claimIssuerContractAddr, deployer, bobWallet, 1);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
