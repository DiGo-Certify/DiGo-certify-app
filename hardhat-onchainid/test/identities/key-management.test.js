const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deployIdentityFixture } = require('../fixtures');
const {
    contracts: { Identity }
} = require('@onchain-id/solidity');

/**
 * Tests for the key management functions of the OnChainID contract
 *
 * We will test the following functions:
 * - addKey (for claim signing purposes)
 *   - KeyAdded event
 * - removeKey
 *  - KeyRemoved event
 * - getKey
 */
describe('Key Management', () => {
    describe('Adding a key', () => {
        it('Should add a valid key', async () => {
            const { aliceIdentity, aliceWallet } = await loadFixture(
                deployIdentityFixture
            );

            // Add a key
            const key = {
                purpose: 2,
                keyType: 1,
                keyHash: ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [aliceWallet.address]
                    )
                )
            };

            const identity = new ethers.Contract(
                aliceIdentity,
                Identity.abi,
                aliceWallet
            );

            const tx = await identity.addKey(
                key.keyHash,
                key.purpose,
                key.keyType
            );

            expect(tx)
                .to.emit(identity, 'KeyAdded')
                .withArgs(key.keyHash, key.purpose, key.keyType);

            // Check if the key was added
            expect(await identity.getKey(key.keyHash)).to.deep.equal([
                [BigInt(key.keyType), BigInt(key.purpose)],
                BigInt(key.keyType),
                key.keyHash
            ]);
        });
        it('Should not add a key that already exists', async () => {
            const { aliceIdentity, aliceWallet } = await loadFixture(
                deployIdentityFixture
            );

            // Add a key
            const key = {
                purpose: 2,
                keyType: 1,
                keyHash: ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [aliceWallet.address]
                    )
                )
            };

            const identity = new ethers.Contract(
                aliceIdentity,
                Identity.abi,
                aliceWallet
            );

            await identity.addKey(key.keyHash, key.purpose, key.keyType);

            // Try to add the same key again
            await expect(
                identity.addKey(key.keyHash, key.purpose, key.keyType)
            ).to.be.revertedWith('Conflict: Key already has purpose');
        });
    });
    describe('Removing a key', () => {
        it('Should remove a key', async () => {
            const { aliceIdentity, aliceWallet } = await loadFixture(
                deployIdentityFixture
            );

            // Add a key
            const key = {
                purpose: 2,
                keyType: 1,
                keyHash: ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [aliceWallet.address]
                    )
                )
            };

            const identity = new ethers.Contract(
                aliceIdentity,
                Identity.abi,
                aliceWallet
            );

            await identity.addKey(key.keyHash, key.purpose, key.keyType);

            const tx = await identity.removeKey(key.keyHash, key.purpose);

            expect(tx)
                .to.emit(identity, 'KeyRemoved')
                .withArgs(key.keyHash, key.purpose, key.keyType);

        });
        it('Should not remove a key that does not exist', async () => {
            const { aliceIdentity, aliceWallet } = await loadFixture(
                deployIdentityFixture
            );

            // Add a key
            const key = {
                purpose: 2,
                keyType: 1,
                keyHash: ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [aliceWallet.address]
                    )
                )
            };

            const identity = new ethers.Contract(
                aliceIdentity,
                Identity.abi,
                aliceWallet
            );

            // Try to remove a key that does not exist
            await expect(
                identity.removeKey(key.keyHash, key.purpose)
            ).to.be.revertedWith('NonExisting: Key doesn\'t have such purpose');
        });
    });
});
