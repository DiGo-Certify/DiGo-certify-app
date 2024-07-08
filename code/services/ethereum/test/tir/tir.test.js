const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const { deployFullTREXSuiteFixture } = require('../fixtures');
const {
    contracts: { ClaimIssuer }
} = require('@onchain-id/solidity');

describe('Ttrusted Claim Issuer Creation', () => {
    it('Should add Alice as a Trusted ClaimIssuer after defining claims topics', async () => {
        const {
            deployer,
            trustedIssuersRegistry,
            claimTopicsRegistry,
            identityFactory
        } = await loadFixture(deployFullTREXSuiteFixture);

        const [aliceWallet, claimIssuerWallet] = await ethers.getSigners();

        // Create claim issuer contract for Alice and add her as a claim signer
        const claimIsserContract = await ethers.getContractFactory(
            ClaimIssuer.abi,
            ClaimIssuer.bytecode,
            claimIssuerWallet
        );

        const claimIssuer = await claimIsserContract.deploy(
            claimIssuerWallet.address
        );

        const aliceIdentiy = await deployIdentity(
            identityFactory,
            aliceWallet.address,
            'alice-salt',
            deployer
        );

        console.log(
            `[DEBUG] Claim Issuer Contract deployed: ${await claimIssuer.getAddress()}`
        );

        await claimIssuer
            .connect(claimIssuerWallet)
            .addKey(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [claimIssuerWallet.address]
                    )
                ),
                3,
                1
            );

        // Add Trusted Claim Issuer pub key signature to Alice Identity keys as type 3 - CLAIM
        await aliceIdentiy
            .connect(aliceWallet)
            .addKey(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [claimIssuerWallet.address]
                    )
                ),
                3,
                1
            );

        expect((await aliceIdentiy.getKeysByPurpose(3))[0]).to.be.equal(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address'],
                    [claimIssuerWallet.address]
                )
            )
        );

        console.log(`[DEBUG] Alice added as a Claim Issuer}`);

        // Define the claim topics to be added
        const claimTopics = [ethers.id('CLAIM_TOPIC')];

        console.log(`[DEBUG] Claim Topics to ADD: ${claimTopics[0]}`);

        // Add the claim topics into the ClaimTopicsRegistry
        const tx_add_claim1 = await claimTopicsRegistry
            .connect(deployer)
            .addClaimTopic(claimTopics[0]);

        const tx_add_claim1_receipt = await tx_add_claim1.wait();

        tx_add_claim1_receipt.logs.forEach(item => {
            if (
                item.eventName !== undefined &&
                item.eventName === 'ClaimTopicAdded'
            ) {
                console.log(
                    `[DEBUG] Claim Topic Added: ${ethers.toQuantity(
                        item.args.claimTopic
                    )}`
                );
            }
        });

        // Verify that the claim topics were added successfully to the ClaimTopicsRegistry
        const claimTopicsAdded = await claimTopicsRegistry
            .getClaimTopics()
            .then(topics => topics.map(topic => ethers.toQuantity(topic)));

        console.log(`[DEBUG] Claims Topics Added array: ${claimTopicsAdded}`);

        expect(claimTopicsAdded[0]).to.be.equal(claimTopics[0]);

        // Add Alice as a Trusted ClaimIssuer
        const add_tissuer_tx = await trustedIssuersRegistry
            .connect(deployer)
            .addTrustedIssuer(await claimIssuer.getAddress(), claimTopics);

        const add_tissuer_receipt = await add_tissuer_tx.wait();

        add_tissuer_receipt.logs.forEach(item => {
            if (
                item.eventName !== undefined &&
                item.eventName === 'TrustedIssuerAdded'
            ) {
                console.log(
                    `[DEBUG] Trusted Issuer Added: ${item.args.trustedIssuer}`
                );
            }
        });

        // Add

        // Verify that Alice was added as a Trusted ClaimIssuer
        const trustedIssuers = await trustedIssuersRegistry
            .connect(deployer)
            .getTrustedIssuers();

        expect(trustedIssuers.length).to.equal(1);
        expect(trustedIssuers[0]).to.equal(await claimIssuer.getAddress());

        const trusterIssuerForClaimTopic = await trustedIssuersRegistry
            .connect(deployer)
            .getTrustedIssuersForClaimTopic(claimTopics[0]);

        expect(trusterIssuerForClaimTopic.length).to.equal(1);
        expect(trusterIssuerForClaimTopic[0]).to.equal(trustedIssuers[0]);
    });
});
