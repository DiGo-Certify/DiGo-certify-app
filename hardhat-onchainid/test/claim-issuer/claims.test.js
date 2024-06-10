const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deployIdentityFixture } = require('../fixtures');
const { ethers } = require('hardhat');
const {
    contracts: { Identity }
} = require('@onchain-id/solidity');
/**
 * Tests for issuing claims with the OnChainID contract (IERC735)
 *
 * We will test the following functions:
 * - addClaim
 * - removeClaim
 * - getClaim
 * - ClaimAdded event
 * - ClaimRemoved event
 * - ClaimChanged event
 * - getClaimIdsByTopic
 */
describe('Claim Issuance', () => {
    describe('Adding a claim', () => {
        it('Should add a valid claim', async () => {
            const {
                claimIssuerWallet,
                claimIssuer,
                aliceIdentity,
                aliceWallet
            } = await loadFixture(deployIdentityFixture);

            // Create a claim
            const claim = {
                identity: aliceIdentity,
                topic: 666,
                scheme: 1,
                issuer: await claimIssuer.getAddress(),
                signature: '',
                data: '0x0034',
                uri: 'https://example.com'
            };

            // Alice signs the claim
            claim.signature = await claimIssuerWallet.signMessage(
                ethers.getBytes(
                    ethers.keccak256(
                        ethers.AbiCoder.defaultAbiCoder().encode(
                            ['address', 'uint256', 'bytes'],
                            [claim.identity, claim.topic, claim.data]
                        )
                    )
                )
            );

            const identity = new ethers.Contract(
                aliceIdentity,
                Identity.abi,
                aliceWallet
            );

            const tx = await identity.addClaim(
                claim.topic,
                claim.scheme,
                claim.issuer,
                claim.signature,
                claim.data,
                claim.uri
            );

            expect(
                await identity.getClaim(
                    ethers.keccak256(
                        ethers.AbiCoder.defaultAbiCoder().encode(
                            ['address', 'uint256'],
                            [claim.issuer, claim.topic]
                        )
                    )
                )
            ).to.deep.equal([
                claim.topic,
                claim.scheme,
                claim.issuer,
                claim.signature,
                claim.data,
                claim.uri
            ]);

            expect(tx)
                .to.emit(identity, 'ClaimAdded')
                .withArgs(
                    ethers.keccak256(
                        ethers.AbiCoder.defaultAbiCoder().encode(
                            ['address', 'uint256'],
                            [claim.issuer, claim.topic]
                        )
                    ),
                    claim.topic,
                    claim.scheme,
                    claim.issuer,
                    claim.signature,
                    claim.data,
                    claim.uri
                );
        });

        it('Should not add claim if issuer is not a ClaimIssuer', async () => {
            const { aliceIdentity, aliceWallet } = await loadFixture(
                deployIdentityFixture
            );

            const identity = new ethers.Contract(
                aliceIdentity,
                Identity.abi,
                aliceWallet
            );

            const claim = {
                identity: aliceIdentity,
                topic: 666,
                scheme: 1,
                issuer: ethers.ZeroAddress,
                signature: '',
                data: '0x0034',
                uri: 'https://example.com'
            };

            // Alice signs the claim
            claim.signature = await aliceWallet.signMessage(
                ethers.getBytes(
                    ethers.keccak256(
                        ethers.AbiCoder.defaultAbiCoder().encode(
                            ['address', 'uint256', 'bytes'],
                            [claim.identity, claim.topic, claim.data]
                        )
                    )
                )
            );

            await expect(
                identity.addClaim(
                    claim.topic,
                    claim.scheme,
                    claim.issuer,
                    claim.signature,
                    claim.data,
                    claim.uri
                )
            ).to.be.revertedWithoutReason();
        });

        it('Should not add claim if issuer is not the signer (making claim invalid)', async () => {
            const { claimIssuer, aliceIdentity, aliceWallet } =
                await loadFixture(deployIdentityFixture);

            const identity = new ethers.Contract(
                aliceIdentity,
                Identity.abi,
                aliceWallet
            );

            const claim = {
                identity: aliceIdentity,
                topic: 666,
                scheme: 1,
                issuer: await claimIssuer.getAddress(),
                signature: '',
                data: '0x0034',
                uri: 'https://example.com'
            };

            // Alice signs the claim
            claim.signature = await aliceWallet.signMessage(
                ethers.getBytes(
                    ethers.keccak256(
                        ethers.AbiCoder.defaultAbiCoder().encode(
                            ['address', 'uint256', 'bytes'],
                            [claim.identity, claim.topic, claim.data]
                        )
                    )
                )
            );

            await expect(
                identity.addClaim(
                    claim.topic,
                    claim.scheme,
                    claim.issuer,
                    claim.signature,
                    claim.data,
                    claim.uri
                )
            ).to.be.revertedWith('invalid claim');
        });
    });
    describe('removing a claim', () => {
        /** it(test code)*/
    });
});
