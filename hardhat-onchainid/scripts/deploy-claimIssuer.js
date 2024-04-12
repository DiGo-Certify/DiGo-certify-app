const { ethers } = require("hardhat");
const {
    contracts: { ClaimIssuer }
} = require("@onchain-id/solidity");

/**
 * Function that is responsible for deploying the ClaimIssuer contract
 * 
 * @param {*} claimIssuer The wallet that will deploy the ClaimIssuer contract
 * @returns 
 */
async function deployClaimIssuer(claimIssuer) {
    const claimIssuerContract = await new ethers.ContractFactory(
        ClaimIssuer.abi,
        ClaimIssuer.bytecode,
        claimIssuer
    ).deploy(claimIssuer.address);

    const claimIssuerContractAddress = await claimIssuerContract.getAddress();

    console.log(
        `\n[✓] Deployed Claim Issuer contract: ${claimIssuerContractAddress}`
    );

    return claimIssuerContractAddress;
}

module.exports = { deployClaimIssuer };
