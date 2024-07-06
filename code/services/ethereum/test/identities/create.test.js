const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployFactoryFixture } = require('../fixtures');
const { deployIdentity } = require('../../scripts/deploy-identity');

/**
 * Includes all the tests for the creation of an Identity
 */
describe('Identity Creation', () => {
    it('Should create an Identity', async () => {
        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const { deployerWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        // Create the Identity
        const tx = await identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, 'alice-salt');
        const tx_receipt = await tx.wait();

        let identityAddress = [];

        // Check the event
        tx_receipt.logs.forEach(item => {
            if (
                item.eventName !== undefined &&
                item.eventName === 'WalletLinked'
            ) {
                identityAddress = item.args.identity;
            }
        });

        expect(
            await identityFactory.getIdentity(aliceWallet.address)
        ).to.be.equal(identityAddress);
    });

    it('Should not create an Identity with the same salt', async () => {
        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const { deployerWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        // Create the Identity
        await identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, 'alice-salt');

        // Create the Identity with the same salt

        identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, 'alice-salt')
            .catch(error => {
                expect(error.reason).to.be.equal('salt already taken');
            });
    });

    it('Should not create an Identity with the same wallet', async () => {
        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const { deployerWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        // Create the Identity
        await identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, 'alice-salt');

        // Create the Identity with the same wallet
        identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, 'bob-salt')
            .catch(error => {
                expect(error.reason).to.be.equal(
                    'wallet already linked to an identity'
                );
            });
    });

    it('Should not create an Identity with an empty salt', async () => {
        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const { deployerWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        // Create the Identity
        identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, '')
            .catch(error => {
                expect(error.reason).to.be.equal(
                    'invalid argument - empty string'
                );
            });
    });

    it('Should not create an Identity with an empty address', async () => {
        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const { deployerWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        // Create the Identity
        identityFactory
            .connect(deployerWallet)
            .createIdentity('', 'alice-salt')
            .catch(error => {
                expect(error.reason).to.be.equal(
                    'invalid argument - empty string'
                );
            });
    });

    it('Should not create an Identity with an empty address and salt', async () => {
        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const { deployerWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        // Create the Identity
        identityFactory
            .connect(deployerWallet)
            .createIdentity('', '')
            .catch(error => {
                expect(error.reason).to.be.equal(
                    'invalid argument - empty string'
                );
            });
    });

    it('Should not create an Identity with different address but with the same salt', async () => {
        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const { deployerWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        // Create the Identity
        await identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, 'alice-salt');

        // Create the Identity with the same salt
        identityFactory
            .connect(deployerWallet)
            .createIdentity(bobWallet.address, 'alice-salt')
            .catch(error => {
                expect(error.reason).to.be.equal('salt already taken');
            });
    });

    it('Should not create an Identity with same address but with different salt', async () => {
        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const { deployerWallet, identityFactory } = await loadFixture(
            deployFactoryFixture
        );

        // Create the Identity
        await identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, 'alice-salt1');

        // Create the Identity with the same salt
        identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, 'alice-salt2')
            .catch(error => {
                expect(error.reason).to.be.equal(
                    'wallet already linked to an identity'
                );
            });
    });

    describe('Identity Creation with the function deployIdentity', () => {
        it('Should create an Identity', async () => {
            const randomWallet = ethers.Wallet.createRandom();

            const { deployerWallet, identityFactory } = await loadFixture(
                deployFactoryFixture
            );

            const randomSalt = randomWallet.address + '-salt';

            // Create the Identity
            const promise = deployIdentity(
                identityFactory,
                randomWallet.address,
                randomSalt
            ).then(() => {
                return identityFactory.getIdentity(randomWallet.address);
            });

            const ret = await promise;

            expect(
                await identityFactory.getIdentity(randomWallet.address)
            ).to.be.equal(ret);
        });
    });
});
