const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deployFullTREXSuiteFixture } = require('../fixtures');
const { ethers } = require('hardhat');
const {
    deployClaimIssuer
} = require('../../scripts/claimIssuer/deploy-claim-issuer');
const {
    isTrustedIssuer
} = require('../../scripts/claimIssuer/isTrustedIssuer');

describe('Verification of Trusted Issuer', () => {
    it('Should verify if claim issuer is trusted', async () => {
        const { deployerWallet, trustedIssuersRegistry } = await loadFixture(
            deployFullTREXSuiteFixture
        );

        const claimTopics = ['EXAMPLE'];

        // Deploy a claim issuer
        const cicAndTir = await deployClaimIssuer(
            trustedIssuersRegistry,
            claimTopics,
            deployerWallet,
            deployerWallet
        );

        // Verify if claim issuer is trusted
        expect(
            await isTrustedIssuer(
                trustedIssuersRegistry,
                cicAndTir.claimIssuerContract
            )
        ).to.be.true;
    });

    it('Should verify if claim issuer is not trusted', async () => {
        const { deployerWallet, trustedIssuersRegistry } = await loadFixture(
            deployFullTREXSuiteFixture
        );

        const claimTopics = ['EXAMPLE'];

        // Deploy a claim issuer
        const cicAndTir = await deployClaimIssuer(
            trustedIssuersRegistry,
            claimTopics,
            deployerWallet,
            deployerWallet
        );

        // Verify if claim issuer is not trusted
        expect(await isTrustedIssuer(trustedIssuersRegistry, deployerWallet)).to
            .be.false;
    });
});
