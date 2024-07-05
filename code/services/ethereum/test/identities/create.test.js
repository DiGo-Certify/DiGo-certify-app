const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { deployFactoryFixture } = require('../fixtures');

/**
 * Includes all the tests for the creation of an Identity
 */
describe('Identity Creation', () => {
    it('Should create an identity for aliceWallet', async () => {
        const { aliceWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        const salt = 'alice-salt';

        expect(
            await identityFactory.createIdentity(aliceWallet.address, salt)
        ).to.emit(identityFactory, 'Deployed');
    });

    it('Should two identities for two different wallets', async () => {
        const { bobWallet, aliceWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        const bobSalt = 'bob-salt';
        const aliceSalt = 'alice-salt';

        // Create an identity for bobWallet
        expect(
            identityFactory.createIdentity(bobWallet.address, bobSalt)
        ).to.emit(identityFactory, 'Deployed');

        // Create an identity for aliceWallet
        expect(
            identityFactory.createIdentity(aliceWallet.address, aliceSalt)
        ).to.emit(identityFactory, 'Deployed');
    });

    it('Should revert when creating Identity with same wallet', async () => {
        const { aliceWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        const salt = 'alice-salt';
        const salt2 = 'alice-salt2';

        // Create an identity for aliceWallet
        expect(
            identityFactory.createIdentity(aliceWallet.address, salt)
        ).to.emit(identityFactory, 'Deployed');

        // Create other identity for same aliceWallet
        await expect(
            identityFactory.createIdentity(aliceWallet.address, salt2)
        ).to.be.revertedWith('wallet already linked to an identity');
    });

    it('Should revert when creating Identity with same salt', async () => {
        const { aliceWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        const salt = 'alice-salt';

        expect(
            identityFactory.createIdentity(aliceWallet.address, salt)
        ).to.emit(identityFactory, 'Deployed');

        // Create other identity for same aliceWallet
        await expect(
            identityFactory.createIdentity(aliceWallet.address, salt)
        ).to.be.revertedWith('salt already taken');
    });

    it('Should revert because salt can not be empty', async () => {
        const { aliceWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        const salt = '';

        await expect(
            identityFactory.createIdentity(aliceWallet.address, salt)
        ).to.be.revertedWith('invalid argument - empty string');
    });

    it('Should revert because wallet can not be Zero Address', async () => {
        const { identityFactory } = await loadFixture(deployFactoryFixture);

        const salt = 'alice-salt';

        await expect(
            identityFactory.createIdentity(ethers.ZeroAddress, salt)
        ).to.be.revertedWith('invalid argument - zero address');
    });
});
