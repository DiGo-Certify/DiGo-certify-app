/*
 * Onboarding an issuer as a lightweight OnchainID identity proxy.
 *
 * These tests assert that an institution onboarded through
 * scripts/claimIssuer/deploy-issuer-identity.js (a factory-created Identity
 * proxy registered in the trusted-issuer registry) is functionally equivalent,
 * for this system's certificate life cycle, to one onboarded as a full
 * ClaimIssuer contract: it can issue a valid, identity-bound certificate claim
 * (Identity.isClaimValid accepts it) and its claims can be revoked via
 * removeClaim. The only capability it does not provide is ClaimIssuer's
 * signature-based revocation, which this system does not use.
 *
 * Run:  npx hardhat test test/claim-issuer/issuer-as-identity.test.js
 */

const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { deployFullTREXSuiteFixture } = require('../fixtures');
const { deployIssuerIdentity } = require('../../scripts/claimIssuer/deploy-issuer-identity');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const { addKeyToIdentity } = require('../../scripts/claimIssuer/addKeyToIdentity');
const { addClaim } = require('../../scripts/claims/add-claim');
const { getClaimsByTopic } = require('../../scripts/claims/getClaimsByTopic');
const { CLAIM_TOPICS_OBJ } = require('../../scripts/claims/claimTopics');

describe('Onboarding — issuer as identity proxy', () => {
    const CERT = CLAIM_TOPICS_OBJ.CERTIFICATE;
    const certTopicId = ethers.id(CERT);

    it('issues a valid, identity-bound certificate claim accepted by isClaimValid', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , issuerWallet] = await ethers.getSigners();

        // Onboard the institution as a lightweight identity proxy.
        const { claimIssuerContract: issuerIdentity } = await deployIssuerIdentity(
            trustedIssuersRegistry, identityFactory, issuerWallet, deployerWallet
        );

        // A student identity that authorises the issuer's key.
        const aliceIdentity = await deployIdentity(
            identityFactory, aliceWallet.address, 'alice-optA', deployerWallet
        );
        await addKeyToIdentity(aliceIdentity, aliceWallet, issuerWallet, 3, 1);

        // Issue: addClaim goes through the app guard (isTrustedIssuer) and the
        // on-chain onlyClaimKey + isClaimValid checks against the issuer identity.
        await addClaim(
            trustedIssuersRegistry, aliceIdentity, issuerIdentity, issuerWallet, CERT, 'grade:18'
        );

        const claims = await getClaimsByTopic(aliceIdentity, CERT);
        expect(claims.length).to.equal(1);
        expect(claims[0].issuer).to.equal(await issuerIdentity.getAddress());
    });

    it('supports revocation of its claims via removeClaim', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , issuerWallet] = await ethers.getSigners();

        const { claimIssuerContract: issuerIdentity } = await deployIssuerIdentity(
            trustedIssuersRegistry, identityFactory, issuerWallet, deployerWallet
        );
        const aliceIdentity = await deployIdentity(
            identityFactory, aliceWallet.address, 'alice-optA-revoke', deployerWallet
        );
        await addKeyToIdentity(aliceIdentity, aliceWallet, issuerWallet, 3, 1);
        await addClaim(
            trustedIssuersRegistry, aliceIdentity, issuerIdentity, issuerWallet, CERT, 'grade:18'
        );
        expect((await getClaimsByTopic(aliceIdentity, CERT)).length).to.equal(1);

        const issuerAddr = await issuerIdentity.getAddress();
        const claimId = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [issuerAddr, certTopicId])
        );
        await (await aliceIdentity.connect(aliceWallet).removeClaim(claimId)).wait();

        expect((await getClaimsByTopic(aliceIdentity, CERT)).length).to.equal(0);
    });
});
