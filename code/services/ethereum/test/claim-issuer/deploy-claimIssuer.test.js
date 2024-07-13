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
const hash = require('../../scripts/utils/hash');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const { getIdentity } = require('../../scripts/identities/getIdentity');

describe('ClaimIssuer Creation', () => {
    it('Should add claim issuer', async () => {
        const { deployerWallet, trustedIssuersRegistry } = await loadFixture(
            deployFullTREXSuiteFixture
        );

        const claimTopics = ['EXAMPLE'];

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

        const claimTopics = ['EXAMPLE'];

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
    it('Should create a claim issuer with a claim of a institution code', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);

        const [aliceWallet] = await ethers.getSigners();

        const cicAndTir = await deployClaimIssuer(
            trustedIssuersRegistry,
            CLAIM_TOPICS,
            aliceWallet,
            deployerWallet,
            3117
        );

        expect((await cicAndTir.TIR.getTrustedIssuers())[0]).to.be.equal(
            await cicAndTir.claimIssuerContract.getAddress()
        );

        console.log('Wallet:', deployerWallet);

        const claims = await getClaimsByTopic(
            cicAndTir.claimIssuerContract,
            CLAIM_TOPICS_OBJ.INSTITUTION
        );

        expect(claims[0].data).to.be.equal(hash(3117));
    });
});
