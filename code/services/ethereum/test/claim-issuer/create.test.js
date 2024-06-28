const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deployIdentityFixture } = require('../fixtures');
const {
    contracts: { ClaimIssuer }
} = require('@onchain-id/solidity');

/**
 * In this test, we will test the ClaimIssuer contract
 *
 * We will test the following functions:
 * - addClaimIssuer
 * - removeClaimIssuer
 * - isClaimIssuer
 */
describe('ClaimIssuer Creation', () => {
    it('Should add claim issuer', async () => {
        const { deployerWallet, claimIssuerWallet, identityFactory } =
            await loadFixture(deployIdentityFixture);

        const claimIssuerContract = await new ethers.ContractFactory(
            ClaimIssuer.abi,
            ClaimIssuer.bytecode,
            claimIssuerWallet
        );
        const claimIssuer = await claimIssuerContract.deploy(
            await identityFactory.getAddress()
        );

        // Verify that a function of the contract is working as expected
        // (see Version.sol at https://github.com/onchain-id/solidity/blob/main/contracts/version/Version.sol)
        expect(await claimIssuer.version()).to.deep.include('2.2.1');
    });
});
