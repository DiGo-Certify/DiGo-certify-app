const { ethers } = require("hardhat");
const {
    contracts: { Identity }
} = require("@onchain-id/solidity");

async function deployIdentity(deployer) {
    const IdentityFactory = await new ethers.ContractFactory(
        Identity.abi,
        Identity.bytecode,
        deployer
    );
    const identityFactory = IdentityFactory.deploy(
        deployer.address, // owner
        true // isLibrary - true for IdentityFactory
    );

    console.log(
        `User: ${deployer.address} have deployed Identity: ${identityFactory.address} successfully`
    );

    return identityFactory;
}

async function main() {
    const [deployerWallet, ownerWallet] = await ethers.getSigners();

    console.log(
        "Deploying Identity Factory Contract with the account:",
        deployerWallet.address
    );

    const identity = await deployIdentity(deployerWallet);

    const claim = {
        identity: identity.address,
        topic: 1,
        scheme: 1,
        issuer: identity.address,
        signature: "",
        data: "0x042",
        uri: "https://example.com"
    };

    claim.signature = await deployerWallet.signMessage(
        ethers.utils.arrayify(ethers.utils.keccak256(claim.data))
    );

    await identity.addClaim(
        claim.topic,
        claim.scheme,
        claim.issuer,
        claim.signature,
        claim.data,
        claim.uri
    );

    console.log("Claim added to Identity Contract");
    const claims = await identity.getClaimIdsByTopic(1);
    console.log("Identity Claims: ", claims);
    console.log("Deployed Identity Factory Contract");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
