const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deployFullTREXSuiteFixture } = require('../fixtures');
const addClaim = require('../../scripts/claims/add-claim');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const {
    deployClaimIssuer
} = require('../../scripts/claimIssuer/deploy-claim-issuer');
const addKeyToIdentity = require('../../scripts/claimIssuer/addKeyToIdentity');
const hash = require('../../scripts/utils/hash');
const { CLAIM_TOPICS, CLAIM_TOPICS_OBJ } = require('../../scripts/claims/claimTopics');

describe('Add claims', () => {
    it('should add a claim to an identity', async () => {
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
        expect(aliceIdentity).to.exist;
        expect(
            await identityFactory.getIdentity(aliceWallet.address)
        ).to.be.equal(await aliceIdentity.getAddress());
        expect(
            (
                await identityFactory.getWallets(
                    await aliceIdentity.getAddress()
                )
            )[0]
        ).to.be.equal(aliceWallet.address);

        // Deploy a claim issuer
        const cicAndTir = await deployClaimIssuer(
            trustedIssuersRegistry,
            CLAIM_TOPICS,
            claimIssuerWallet,
            deployerWallet
        );

        expect(cicAndTir.claimIssuerContract).to.exist;
        expect(cicAndTir.TIR).to.exist;
        expect(
            await trustedIssuersRegistry.isTrustedIssuer(
                await cicAndTir.claimIssuerContract.getAddress()
            )
        ).to.be.true;
        expect(
            await cicAndTir.claimIssuerContract.getKeysByPurpose(3)
        ).to.be.deep.equal([
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address'],
                    [claimIssuerWallet.address]
                )
            )
        ]);

        // Add the claim issuer key to the identity
        const keyAdded = await addKeyToIdentity(
            aliceIdentity,
            aliceWallet,
            claimIssuerWallet,
            3, // KeyPurpose.CLAIM_SIGNER
            1 // KeyType.ECDSA
        );

        expect(keyAdded).to.exist;
        expect(keyAdded.key).to.exist;
        expect(parseInt(ethers.toQuantity(keyAdded.purpose), 16)).to.be.equal(
            3
        );
        expect(parseInt(ethers.toQuantity(keyAdded.keyType), 16)).to.be.equal(
            1
        );

        // Verify that the claim issuer key was added to the identity
        expect((await aliceIdentity.getKeysByPurpose(3))[0]).to.be.equal(
            keyAdded.key
        );
        expect((await aliceIdentity.getKeysByPurpose(3))[0]).to.be.equal(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address'],
                    [claimIssuerWallet.address]
                )
            )
        );

        // Claim issuer adds a claim to Alice's identity
        const claimData = 'example-claim-data';
        const claimTopic = CLAIM_TOPICS_OBJ.INSTITUTION; // INSTITUTION
        const claimScheme = 1; // ECDSA
        const uri = '';

        const claim = await addClaim(
            trustedIssuersRegistry,
            aliceIdentity,
            cicAndTir.claimIssuerContract,
            claimIssuerWallet,
            claimTopic,
            claimData,
            claimScheme,
            uri
        );

        expect(claim).to.exist;
        expect(claim.data).to.be.equal(hash(claimData));
        expect(claim.issuer).to.be.equal(
            await cicAndTir.claimIssuerContract.getAddress()
        );
        expect(ethers.toQuantity(claim.topic)).to.be.equal(
            ethers.id(claimTopic)
        );
        expect(parseInt(ethers.toQuantity(claim.scheme), 16)).to.be.equal(
            claimScheme
        );
    });
});
