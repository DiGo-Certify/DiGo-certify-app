const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deployFullTREXSuiteFixture } = require('../fixtures');
const { addClaim } = require('../../scripts/claims/add-claim');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const { getClaimsByTopic } = require('../../scripts/claims/getClaimsByTopic');
const {
    deployClaimIssuer
} = require('../../scripts/claimIssuer/deploy-claim-issuer');
const {
    CLAIM_TOPICS,
    CLAIM_TOPICS_OBJ
} = require('../../scripts/claims/claimTopics');
const {
    addKeyToIdentity
} = require('../../scripts/claimIssuer/addKeyToIdentity');
const hash = require('../../scripts/utils/encryption/hash');

describe('get all the claims of an identity by topic', function () {
    it('should return all the claims of an identity', async function () {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);

        const [aliceWallet, claimIssuerWallet] = await ethers.getSigners();

        // Create Identity for Alice
        const aliceIdentity = await deployIdentity(
            identityFactory,
            aliceWallet.address,
            'alice-salt',
            deployerWallet
        );

        // Deploy a claim issuer
        const cicAndTir = await deployClaimIssuer(
            trustedIssuersRegistry,
            claimIssuerWallet,
            deployerWallet
        );

        // Add signing key to the alice identity
        await addKeyToIdentity(
            aliceIdentity,
            aliceWallet,
            claimIssuerWallet,
            3,
            1
        );

        // Add a claim to the identity
        const claim = {
            topic: CLAIM_TOPICS_OBJ.INSTITUTION,
            data: 'Exemplo University',
            uri: 'http://example.com'
        };

        const claimId = await addClaim(
            trustedIssuersRegistry,
            aliceIdentity,
            cicAndTir.claimIssuerContract,
            claimIssuerWallet,
            claim.topic,
            claim.data,
            1,
            claim.uri
        );

        expect(claimId).to.exist;

        const claims = await getClaimsByTopic(
            aliceIdentity,
            CLAIM_TOPICS_OBJ.INSTITUTION
        );

        expect(claims).to.exist;
        expect(claims[0].id).to.be.equal(claimId.claimId);
        expect(claims[0].topic).to.be.equal(claimId.topic);
        expect(ethers.toUtf8String(claims[0].data)).to.be.equal(claim.data);
        expect(claims[0].uri).to.be.equal(claimId.uri);
    });
});
