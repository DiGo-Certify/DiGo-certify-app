const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { deployFullTREXSuiteFixture } = require('./fixtures');
const { deployIdentity } = require('../scripts/identities/deploy-identity');
const { deployClaimIssuer } = require('../scripts/claimIssuer/deploy-claim-issuer');
const { addClaim } = require('../scripts/claims/add-claim');
const { addKeyToIdentity } = require('../scripts/claimIssuer/addKeyToIdentity');
const { getClaimsByTopic } = require('../scripts/claims/getClaimsByTopic');
const hash = require('../scripts/utils/encryption/hash');
const { CLAIM_TOPICS_OBJ } = require('../scripts/claims/claimTopics');

const claimKeyFor = address =>
    ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address'], [address])
    );

describe('End-to-end certificate flow', () => {
    it('creates a student identity, authorizes an institution, and issues a verifiable certificate claim', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [, , studentWallet, institutionWallet] = await ethers.getSigners();

        const studentIdentity = await deployIdentity(
            identityFactory,
            studentWallet.address,
            'student-e2e',
            deployerWallet
        );
        expect(await identityFactory.getIdentity(studentWallet.address)).to.equal(
            await studentIdentity.getAddress()
        );

        const { claimIssuerContract } = await deployClaimIssuer(
            trustedIssuersRegistry,
            institutionWallet,
            deployerWallet
        );
        const claimIssuerAddress = await claimIssuerContract.getAddress();
        expect(
            await trustedIssuersRegistry.isTrustedIssuer(claimIssuerAddress)
        ).to.be.true;

        await addKeyToIdentity(
            studentIdentity,
            studentWallet,
            institutionWallet,
            3,
            1
        );
        expect(await studentIdentity.getKeysByPurpose(3)).to.include(
            claimKeyFor(institutionWallet.address)
        );

        await addClaim(
            trustedIssuersRegistry,
            studentIdentity,
            studentIdentity,
            studentWallet,
            CLAIM_TOPICS_OBJ.STUDENT,
            JSON.stringify({ name: 'Alice', studentNumber: '20240001' })
        );

        const certificateReference = 'ipfs://certificate/2024/0001';
        const certificateData = {
            registrationCode: '2024/0001',
            courseID: '123',
            grade: '18',
            certificateDigest: hash(certificateReference),
        };
        const issuedClaim = await addClaim(
            trustedIssuersRegistry,
            studentIdentity,
            claimIssuerContract,
            institutionWallet,
            CLAIM_TOPICS_OBJ.CERTIFICATE,
            JSON.stringify(certificateData),
            1,
            certificateReference
        );

        expect(issuedClaim.issuer).to.equal(claimIssuerAddress);
        expect(ethers.toQuantity(issuedClaim.topic)).to.equal(
            ethers.id(CLAIM_TOPICS_OBJ.CERTIFICATE)
        );

        const studentClaims = await getClaimsByTopic(
            studentIdentity,
            CLAIM_TOPICS_OBJ.STUDENT
        );
        expect(studentClaims).to.have.lengthOf(1);
        expect(JSON.parse(ethers.toUtf8String(studentClaims[0].data))).to.deep.equal({
            name: 'Alice',
            studentNumber: '20240001',
        });

        const certificateClaims = await getClaimsByTopic(
            studentIdentity,
            CLAIM_TOPICS_OBJ.CERTIFICATE
        );
        expect(certificateClaims).to.have.lengthOf(1);
        expect(certificateClaims[0].issuer).to.equal(claimIssuerAddress);
        expect(certificateClaims[0].uri).to.equal(hash(certificateReference));
        expect(JSON.parse(ethers.toUtf8String(certificateClaims[0].data))).to.deep.equal(
            certificateData
        );

        const replacementReference = 'ipfs://certificate/2024/0001-corrected';
        const replacementData = {
            ...certificateData,
            grade: '19',
            certificateDigest: hash(replacementReference),
        };

        await addClaim(
            trustedIssuersRegistry,
            studentIdentity,
            claimIssuerContract,
            institutionWallet,
            CLAIM_TOPICS_OBJ.CERTIFICATE,
            JSON.stringify(replacementData),
            1,
            replacementReference
        );

        const updatedCertificateClaims = await getClaimsByTopic(
            studentIdentity,
            CLAIM_TOPICS_OBJ.CERTIFICATE
        );
        expect(updatedCertificateClaims).to.have.lengthOf(1);
        expect(updatedCertificateClaims[0].id).to.equal(certificateClaims[0].id);
        expect(updatedCertificateClaims[0].uri).to.equal(hash(replacementReference));
        expect(JSON.parse(ethers.toUtf8String(updatedCertificateClaims[0].data))).to.deep.equal(
            replacementData
        );
    });
});
