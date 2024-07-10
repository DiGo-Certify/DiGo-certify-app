const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deployFullTREXSuiteFixture } = require('../fixtures');
const {
    deployClaimIssuer
} = require('../../scripts/claimIssuer/deploy-claim-issuer');
const { ethers } = require('hardhat');

describe('ClaimIssuer Creation', () => {
    it('Should add claim issuer', async () => {
        const { deployerWallet, trustedIssuersRegistry } = await loadFixture(
            deployFullTREXSuiteFixture
        );

        const claimTopics = [ethers.id('EXAMPLE')];

        const cicAndTir = await deployClaimIssuer(
            trustedIssuersRegistry,
            claimTopics,
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

    it('Should create two claim issuers with different claim issuers but same tir deployer', async () => {
        const { deployerWallet, trustedIssuersRegistry } = await loadFixture(
            deployFullTREXSuiteFixture
        );

        const [tirDeployer, claimIssuerDeployer1, claimIssuerDeployer2] =
            await ethers.getSigners();

        const claimTopics = [ethers.id('EXAMPLE')];

        const cicAndTir1 = await deployClaimIssuer(
            trustedIssuersRegistry,
            claimTopics,
            claimIssuerDeployer1,
            tirDeployer
        );

        const cicAndTir2 = await deployClaimIssuer(
            trustedIssuersRegistry,
            claimTopics,
            claimIssuerDeployer2,
            tirDeployer
        );

        expect(await cicAndTir1.TIR.getTrustedIssuers()).to.have.lengthOf(2);
        expect(await cicAndTir2.TIR.getTrustedIssuers()).to.have.lengthOf(2);
        expect(await cicAndTir1.TIR.getTrustedIssuers()).to.be.deep.equal(
            await cicAndTir2.TIR.getTrustedIssuers()
        );
    });
});
