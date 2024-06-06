const { ethers } = require("hardhat");
const {
    contracts: { ClaimIssuer }
} = require("@onchain-id/solidity");

/**
 * Function that is responsible for deploying the ClaimIssuer contract
 *
 * @param {*} managementKey The wallet that will deploy the ClaimIssuer contract
 * @returns
 */
async function deployClaimIssuer(managementKey) {

    console.log(`\n[!] Deploying ClaimIssuer contract ...`);
    const claimIssuerContract = await new ethers.ContractFactory(
        ClaimIssuer.abi,
        ClaimIssuer.bytecode,
        managementKey
    ).deploy(managementKey.address);

    const claimIssuerContractAddress = await claimIssuerContract.getAddress();

    console.log(
        `\n[✓] Deployed Claim Issuer contract: ${claimIssuerContractAddress}`
    );

    return claimIssuerContractAddress;
}

module.exports = { deployClaimIssuer };
