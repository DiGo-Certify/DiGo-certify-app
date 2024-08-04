const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deployFullTREXSuiteFixture } = require('../fixtures');
const {
    deployClaimIssuer
} = require('../../scripts/claimIssuer/deploy-claim-issuer');
const { ethers } = require('hardhat');
const {
    CLAIM_TOPICS_OBJ,
    CLAIM_TOPICS
} = require('../../scripts/claims/claimTopics');
const { getClaimsByTopic } = require('../../scripts/claims/getClaimsByTopic');

describe('ClaimIssuer Creation', () => {
    it('Should add claim issuer', async () => {
        const { deployerWallet, trustedIssuersRegistry } = await loadFixture(
            deployFullTREXSuiteFixture
        );

        const claimTopics = ['EXAMPLE'];

        const cicAndTir = await deployClaimIssuer(
            trustedIssuersRegistry,
            deployerWallet,
            deployerWallet
        );

        expect((await cicAndTir.TIR.getTrustedIssuers())[0]).to.be.equal(
            await cicAndTir.claimIssuerContract.getAddress()
        );

        expect(
            await cicAndTir.claimIssuerContract.getKeysByPurpose(3)
        ).to.be.deep.equal([
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address'],
                    [deployerWallet.address]
                )
            )
        ]);

        expect(
            await cicAndTir.TIR.isTrustedIssuer(
                await cicAndTir.claimIssuerContract.getAddress()
            )
        ).to.be.true;
    });

    it('Should create a claim issuer with some data', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);

        const privKey = '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e'
        const institutionCode = 3311;

        const cicAndTir = await deployClaimIssuer(
            trustedIssuersRegistry,
            undefined,
            deployerWallet,
            privKey,
            3311,
        );

        
        expect((await cicAndTir.TIR.getTrustedIssuers())[0]).to.be.equal(
            await cicAndTir.claimIssuerContract.getAddress()
        );

        console.log('Wallet:', deployerWallet);

        const claims = await getClaimsByTopic(
            cicAndTir.claimIssuerContract,
            CLAIM_TOPICS_OBJ.INSTITUTION
        );

        expect(ethers.toUtf8String(claims[0].data)).to.be.equal('3311');
    });
});
