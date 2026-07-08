/*
 * Security negative tests (RQ5) — assert that disallowed actions fail.
 *
 * Each test exercises one mitigation from the paper's threat model
 * (Table tab:eval-threats) by attempting the corresponding attack and asserting
 * that it is rejected, either at the app-level guard in scripts/claims/add-claim.js
 * (isTrustedIssuer || isSelfSigner, a JS throw) or on-chain in Identity.addClaim
 * (onlyClaimKey / isClaimValid reverts).
 *
 * Reverts are asserted with try/catch rather than chai revert matchers, because
 * hardhat.config.js loads only hardhat-ethers (not hardhat-chai-matchers).
 *
 * Run:  npx hardhat test test/security/negative.test.js
 */

const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const {
    contracts: { ClaimIssuer },
} = require('@onchain-id/solidity');

const { deployFullTREXSuiteFixture } = require('../fixtures');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const { deployClaimIssuer } = require('../../scripts/claimIssuer/deploy-claim-issuer');
const { addKeyToIdentity } = require('../../scripts/claimIssuer/addKeyToIdentity');
const { addClaim } = require('../../scripts/claims/add-claim');
const { getClaimsByTopic } = require('../../scripts/claims/getClaimsByTopic');
const { CLAIM_TOPICS, CLAIM_TOPICS_OBJ } = require('../../scripts/claims/claimTopics');

// --- helpers ---------------------------------------------------------------
const keyHash = addr =>
    ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [addr]));

// Sign a claim exactly as scripts/claims/add-claim.js does.
const signClaim = (signer, identityAddr, topicId, data) =>
    signer.signMessage(
        ethers.getBytes(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address', 'uint256', 'bytes'],
                    [identityAddr, topicId, data]
                )
            )
        )
    );

// Assert that awaiting `thunk` (and, if it returns a tx, its confirmation) fails.
async function expectRejected(thunk, label) {
    let rejected = false;
    let message = '';
    try {
        const tx = await thunk();
        if (tx && typeof tx.wait === 'function') await tx.wait();
    } catch (err) {
        rejected = true;
        message = err && err.message ? err.message : String(err);
    }
    expect(rejected, `${label} — expected failure but it succeeded`).to.be.true;
    return message;
}

// Deploy a ClaimIssuer contract whose signing key is `wallet`, WITHOUT
// registering it in the trusted-issuer registry.
async function deployUnregisteredIssuer(deployerWallet, wallet) {
    const issuer = await new ethers.ContractFactory(
        ClaimIssuer.abi, ClaimIssuer.bytecode, deployerWallet
    ).deploy(wallet.address);
    await issuer.waitForDeployment();
    await (await issuer.connect(wallet).addKey(keyHash(wallet.address), 3, 1)).wait();
    return issuer;
}

describe('Security — negative tests (RQ5)', () => {
    const CERT = CLAIM_TOPICS_OBJ.CERTIFICATE;
    const certTopicId = ethers.id(CERT);
    const claimData = ethers.toUtf8Bytes('reg:2024/0001;course:1234');

    // Threat: Unauthorised issuance (app-level trusted-issuer check).
    it('rejects a claim from an issuer absent from the trusted-issuer registry', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , rogueWallet] = await ethers.getSigners();

        const aliceIdentity = await deployIdentity(
            identityFactory, aliceWallet.address, 'alice-unauth', deployerWallet
        );
        const rogueIssuer = await deployUnregisteredIssuer(deployerWallet, rogueWallet);

        const msg = await expectRejected(
            () => addClaim(
                trustedIssuersRegistry, aliceIdentity, rogueIssuer, rogueWallet, CERT, 'x'
            ),
            'unaccredited issuer'
        );
        expect(msg).to.match(/not trusted|self-signer/i);
    });

    // Threat: Unauthorised issuance (on-chain per-identity key gate).
    it('reverts an on-chain addClaim from an issuer not keyed on the identity', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , issuerWallet] = await ethers.getSigners();

        const aliceIdentity = await deployIdentity(
            identityFactory, aliceWallet.address, 'alice-nokey', deployerWallet
        );
        // Trusted issuer, but its key is deliberately NOT authorised on the identity.
        const { claimIssuerContract } = await deployClaimIssuer(
            trustedIssuersRegistry, issuerWallet, deployerWallet
        );
        const issuerAddr = await claimIssuerContract.getAddress();
        const sig = await signClaim(
            issuerWallet, await aliceIdentity.getAddress(), certTopicId, claimData
        );

        await expectRejected(
            () => aliceIdentity
                .connect(issuerWallet)
                .addClaim(certTopicId, 1, issuerAddr, sig, claimData, ''),
            'addClaim without an authorised key (onlyClaimKey)'
        );
    });

    // Threat: Forged / replayed claim (bad issuer signature).
    it('reverts a claim whose signature is not from a ClaimIssuer key', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , issuerWallet] = await ethers.getSigners();

        const aliceIdentity = await deployIdentity(
            identityFactory, aliceWallet.address, 'alice-forge', deployerWallet
        );
        const { claimIssuerContract } = await deployClaimIssuer(
            trustedIssuersRegistry, issuerWallet, deployerWallet
        );
        // Authorise the issuer key so onlyClaimKey passes and we reach isClaimValid.
        await addKeyToIdentity(aliceIdentity, aliceWallet, issuerWallet, 3, 1);

        const issuerAddr = await claimIssuerContract.getAddress();
        // Forge: sign with a random wallet that is NOT a key on the ClaimIssuer.
        const forger = ethers.Wallet.createRandom();
        const badSig = await signClaim(
            forger, await aliceIdentity.getAddress(), certTopicId, claimData
        );

        const msg = await expectRejected(
            () => aliceIdentity
                .connect(issuerWallet)
                .addClaim(certTopicId, 1, issuerAddr, badSig, claimData, ''),
            'claim with a forged signature (isClaimValid)'
        );
        expect(msg).to.match(/invalid claim|revert/i);
    });

    // Threat: Revocation bypass (removeClaim; validation reads current state).
    it('drops a revoked claim so validation no longer returns it', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , issuerWallet] = await ethers.getSigners();

        const aliceIdentity = await deployIdentity(
            identityFactory, aliceWallet.address, 'alice-revoke', deployerWallet
        );
        const { claimIssuerContract } = await deployClaimIssuer(
            trustedIssuersRegistry, issuerWallet, deployerWallet
        );
        await addKeyToIdentity(aliceIdentity, aliceWallet, issuerWallet, 3, 1);
        await addClaim(
            trustedIssuersRegistry, aliceIdentity, claimIssuerContract, issuerWallet, CERT, 'grade:18'
        );
        expect((await getClaimsByTopic(aliceIdentity, CERT)).length).to.equal(1);

        const issuerAddr = await claimIssuerContract.getAddress();
        const claimId = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [issuerAddr, certTopicId])
        );
        await (await aliceIdentity.connect(aliceWallet).removeClaim(claimId)).wait();

        expect((await getClaimsByTopic(aliceIdentity, CERT)).length).to.equal(0);
    });

    // Threat: Issuer-key compromise (de-accreditation via removeTrustedIssuer).
    it('rejects new claims from a de-accredited issuer', async () => {
        const { deployerWallet, trustedIssuersRegistry, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , issuerWallet] = await ethers.getSigners();

        const aliceIdentity = await deployIdentity(
            identityFactory, aliceWallet.address, 'alice-deaccredit', deployerWallet
        );
        const { claimIssuerContract } = await deployClaimIssuer(
            trustedIssuersRegistry, issuerWallet, deployerWallet
        );
        const issuerAddr = await claimIssuerContract.getAddress();
        expect(await trustedIssuersRegistry.isTrustedIssuer(issuerAddr)).to.be.true;

        await (await trustedIssuersRegistry
            .connect(deployerWallet)
            .removeTrustedIssuer(issuerAddr)).wait();
        expect(await trustedIssuersRegistry.isTrustedIssuer(issuerAddr)).to.be.false;

        const msg = await expectRejected(
            () => addClaim(
                trustedIssuersRegistry, aliceIdentity, claimIssuerContract, issuerWallet, CERT, 'y'
            ),
            'claim from a de-accredited issuer'
        );
        expect(msg).to.match(/not trusted|self-signer/i);
    });

    // Threat: Registration front-running (salt uniqueness).
    it('reverts identity creation that reuses an existing salt', async () => {
        const { deployerWallet, identityFactory } =
            await loadFixture(deployFullTREXSuiteFixture);
        const [aliceWallet, , , bobWallet] = await ethers.getSigners();

        await deployIdentity(identityFactory, aliceWallet.address, 'dup-salt', deployerWallet);

        const msg = await expectRejected(
            () => identityFactory.connect(deployerWallet).createIdentity(bobWallet.address, 'dup-salt'),
            'duplicate salt'
        );
        expect(msg).to.match(/salt already taken|revert/i);
    });

    // Threat: Registry-bloat DoS (trusted-issuer set is hard-capped).
    it('reverts once the trusted-issuer registry reaches its cap', async () => {
        const { deployerWallet, trustedIssuersRegistry } =
            await loadFixture(deployFullTREXSuiteFixture);
        const topics = CLAIM_TOPICS.map(t => ethers.id(t));

        let added = 0;
        let reverted = false;
        for (let i = 0; i < 60; i++) {
            try {
                await (await trustedIssuersRegistry
                    .connect(deployerWallet)
                    .addTrustedIssuer(ethers.Wallet.createRandom().address, topics)).wait();
                added++;
            } catch (_) {
                reverted = true;
                break;
            }
        }
        expect(reverted, 'registry should reject additions past the cap').to.be.true;
        expect(added).to.be.gte(49); // the standard caps the set at 50
    });
});
