/*
 * On-chain, trust-authoritative certificate verification (CertificateVerifier).
 *
 * These tests demonstrate that accreditation is enforced as an on-chain
 * invariant at verification time, not as client-side policy. isCertifiedBy
 * composes, in a single read-only call, the trusted-issuer check and the
 * issuer's isClaimValid, reading the *current* registry and identity state.
 *
 * The decisive case is "rejects a claim written by a non-accredited issuer via
 * a direct contract call": it bypasses the application layer entirely, writing
 * a validly signed claim straight to the identity contract, and shows that
 * on-chain verification still rejects it because the issuer is not in the
 * trusted-issuer registry. This answers the objection that the accreditation
 * check "sits in the client and can be skipped by calling the contract
 * directly".
 *
 * Run:  npx hardhat test test/verifier/certificate-verifier.test.js
 */

const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const {
    contracts: { ClaimIssuer },
} = require('@onchain-id/solidity');

const { deployFullTREXSuiteFixture } = require('../fixtures');
const { deployIssuerIdentity } = require('../../scripts/claimIssuer/deploy-issuer-identity');
const { deployClaimIssuer } = require('../../scripts/claimIssuer/deploy-claim-issuer');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const { addKeyToIdentity } = require('../../scripts/claimIssuer/addKeyToIdentity');
const { addClaim } = require('../../scripts/claims/add-claim');
const { getClaimsByTopic } = require('../../scripts/claims/getClaimsByTopic');
const { CLAIM_TOPICS_OBJ } = require('../../scripts/claims/claimTopics');

const SIGN_CLAIM_PURPOSE = 3;
const ECDSA_KEY_TYPE = 1;

const CERT = CLAIM_TOPICS_OBJ.CERTIFICATE;
const TOPIC = BigInt(ethers.id(CERT)); // uint256 topic identifier
const PAYLOAD = 'grade:18';

// Sign a claim exactly as scripts/claims/add-claim.js does, so isClaimValid
// accepts it: personal_sign over keccak256(abi.encode(identity, topic, data)).
async function signClaim(signerWallet, identityAddress, data) {
    return signerWallet.signMessage(
        ethers.getBytes(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address', 'uint256', 'bytes'],
                    [identityAddress, TOPIC, data]
                )
            )
        )
    );
}

// Onboard an accredited issuer + a student that authorises it, issue one
// certificate claim, and deploy the verifier bound to the trusted-issuer
// registry. Returns the pieces the individual tests need.
async function certifiedSetup() {
    const { deployerWallet, trustedIssuersRegistry, identityFactory } =
        await loadFixture(deployFullTREXSuiteFixture);
    const [aliceWallet, , issuerWallet] = await ethers.getSigners();

    const { claimIssuerContract: issuerIdentity } = await deployIssuerIdentity(
        trustedIssuersRegistry, identityFactory, issuerWallet, deployerWallet
    );
    const aliceIdentity = await deployIdentity(
        identityFactory, aliceWallet.address, 'alice-verify', deployerWallet
    );
    await addKeyToIdentity(aliceIdentity, aliceWallet, issuerWallet, SIGN_CLAIM_PURPOSE, ECDSA_KEY_TYPE);
    await addClaim(
        trustedIssuersRegistry, aliceIdentity, issuerIdentity, issuerWallet, CERT, PAYLOAD
    );

    const verifier = await ethers.deployContract(
        'CertificateVerifier',
        [await trustedIssuersRegistry.getAddress()],
        deployerWallet
    );

    const aliceAddress = await aliceIdentity.getAddress();
    const issuerAddress = await issuerIdentity.getAddress();
    const claimId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [issuerAddress, TOPIC])
    );

    return {
        deployerWallet, trustedIssuersRegistry, identityFactory,
        aliceWallet, issuerWallet, issuerIdentity, aliceIdentity,
        verifier, aliceAddress, issuerAddress, claimId,
    };
}

describe('CertificateVerifier — on-chain accreditation at verification', () => {
    it('certifies a claim from an accredited issuer (topic-only and payload-bound)', async () => {
        const { verifier, aliceAddress } = await certifiedSetup();

        // Topic-only: some accredited issuer certifies the subject for the topic.
        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, '0x')).to.equal(true);
        // Payload-bound: the stored claim data must equal the expected payload.
        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, ethers.toUtf8Bytes(PAYLOAD)))
            .to.equal(true);
    });

    it('rejects a certificate whose payload does not match the stored claim', async () => {
        const { verifier, aliceAddress } = await certifiedSetup();
        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, ethers.toUtf8Bytes('grade:20')))
            .to.equal(false);
    });

    it('rejects after the issuer is de-accredited (removeTrustedIssuer)', async () => {
        const { verifier, aliceAddress, aliceIdentity, issuerAddress, trustedIssuersRegistry, deployerWallet } =
            await certifiedSetup();

        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, '0x')).to.equal(true);
        await (await trustedIssuersRegistry.connect(deployerWallet).removeTrustedIssuer(issuerAddress)).wait();

        // The claim still exists on the identity, but verification now fails
        // because the issuer is no longer accredited — read from current state.
        expect((await getClaimsByTopic(aliceIdentity, CERT)).length).to.equal(1);
        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, '0x')).to.equal(false);
    });

    it('rejects after the claim is removed (removeClaim)', async () => {
        const { verifier, aliceAddress, aliceIdentity, aliceWallet, claimId } = await certifiedSetup();

        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, '0x')).to.equal(true);
        await (await aliceIdentity.connect(aliceWallet).removeClaim(claimId)).wait();
        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, '0x')).to.equal(false);
    });

    it('rejects a claim written by a non-accredited issuer via a direct contract call', async () => {
        // The decisive case: bypass the application layer and write a validly
        // signed claim straight to the identity contract.
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , , rogueWallet] = await ethers.getSigners();

        // A rogue issuer with a working isClaimValid, but NOT added to the TIR.
        const rogueIssuer = await new ethers.ContractFactory(
            ClaimIssuer.abi, ClaimIssuer.bytecode, rogueWallet
        ).deploy(rogueWallet.address);
        await rogueIssuer.connect(rogueWallet).addKey(
            ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [rogueWallet.address])),
            SIGN_CLAIM_PURPOSE, ECDSA_KEY_TYPE
        );

        const aliceIdentity = await deployIdentity(
            identityFactory, aliceWallet.address, 'alice-rogue', deployerWallet
        );
        // Alice authorises the rogue's key (onlyClaimKey), as any client flow would
        // need to; the accreditation gate is the only thing missing.
        await addKeyToIdentity(aliceIdentity, aliceWallet, rogueWallet, SIGN_CLAIM_PURPOSE, ECDSA_KEY_TYPE);

        const aliceAddress = await aliceIdentity.getAddress();
        const rogueAddress = await rogueIssuer.getAddress();
        const data = ethers.toUtf8Bytes(PAYLOAD);
        const sig = await signClaim(rogueWallet, aliceAddress, data);

        // Direct on-chain write, bypassing scripts/claims/add-claim.js entirely.
        await (await aliceIdentity.connect(rogueWallet).addClaim(TOPIC, 1, rogueAddress, sig, data, '')).wait();

        // The claim exists and is well-formed...
        const claimId = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [rogueAddress, TOPIC])
        );
        const stored = await aliceIdentity.getClaim(claimId);
        expect(stored.issuer).to.equal(rogueAddress);

        // ...but on-chain verification rejects it: the issuer is not accredited.
        const verifier = await ethers.deployContract(
            'CertificateVerifier', [await trustedIssuersRegistry.getAddress()], deployerWallet
        );
        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, data)).to.equal(false);
    });

    it('honors ClaimIssuer signature-based revocation at verification (revokeClaimBySignature)', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , issuerWallet] = await ethers.getSigners();

        // Onboard the institution as a full ClaimIssuer, which supports
        // per-claim signature-based revocation.
        const { claimIssuerContract: claimIssuer } = await deployClaimIssuer(
            trustedIssuersRegistry, issuerWallet, deployerWallet
        );
        const aliceIdentity = await deployIdentity(
            identityFactory, aliceWallet.address, 'alice-sigrevoke', deployerWallet
        );
        await addKeyToIdentity(aliceIdentity, aliceWallet, issuerWallet, SIGN_CLAIM_PURPOSE, ECDSA_KEY_TYPE);
        await addClaim(trustedIssuersRegistry, aliceIdentity, claimIssuer, issuerWallet, CERT, PAYLOAD);

        const verifier = await ethers.deployContract(
            'CertificateVerifier', [await trustedIssuersRegistry.getAddress()], deployerWallet
        );
        const aliceAddress = await aliceIdentity.getAddress();
        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, ethers.toUtf8Bytes(PAYLOAD))).to.equal(true);

        // The issuer revokes the specific claim signature on-chain.
        const claimId = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'uint256'], [await claimIssuer.getAddress(), TOPIC])
        );
        const stored = await aliceIdentity.getClaim(claimId);
        await (await claimIssuer.connect(issuerWallet).revokeClaimBySignature(stored.signature)).wait();

        // Verification now fails, even though the claim still exists on the
        // identity and its issuer is still accredited: isClaimValid rejects the
        // revoked signature, so isCertifiedBy returns false.
        expect((await getClaimsByTopic(aliceIdentity, CERT)).length).to.equal(1);
        expect(await verifier.isCertifiedBy(aliceAddress, TOPIC, ethers.toUtf8Bytes(PAYLOAD))).to.equal(false);
    });

    it('reports the on-chain execution gas of a verification (single accredited issuer)', async () => {
        const { verifier, aliceAddress } = await certifiedSetup();
        const gas = await verifier.isCertifiedBy.estimateGas(aliceAddress, TOPIC, ethers.toUtf8Bytes(PAYLOAD));
        // View call: external callers pay 0 gas via eth_call. This figure is the
        // execution cost were it run as a transaction, reported for the paper.
        console.log(`      [measure] isCertifiedBy execution gas (1 issuer): ${gas.toString()}`);
        expect(Number(gas)).to.be.greaterThan(0);
    });
});
