const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployFactoryFixture } = require('../fixtures');
const { deployIdentity } = require('../../scripts/deploy-identity');
const {
    SaltAlreadyTaken,
    EmptyString,
    WalletAlreadyLinked,
    IdentityDeploymentError
} = require('../../../errors/deployment/identities');

/**
 * Includes all the tests for the creation of an Identity
 */
describe('Identity Creation', () => {
    describe('Test creating an identity accessing directly the contract', () => {
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
            ).then(identityAddress => {
                return identityAddress;
            });

            const identityAddress = await promise;

            expect(identityAddress).to.be.not.equal(ethers.ZeroAddress);
        });

        it('Should not create an Identity with the same salt', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const anotherWallet = ethers.Wallet.createRandom();

            const { deployerWallet, identityFactory } = await loadFixture(
                deployFactoryFixture
            );

            const randomSalt = randomWallet.address + '-salt';

            // Create the Identity
            await deployIdentity(
                identityFactory,
                randomWallet.address,
                randomSalt
            );

            // Create the Identity with the same salt
            const promise = deployIdentity(
                identityFactory,
                anotherWallet.address,
                randomSalt
            )
                .then(identityAddress => {
                    console.log('here');
                    expect(identityAddress).to.be.equal(ethers.ZeroAddress);
                })
                .catch(error => {
                    expect(error).to.be.instanceOf(SaltAlreadyTaken);
                });

            await promise;
        });

        it('Should not create an Identity with an empty salt', async () => {
            const randomWallet = ethers.Wallet.createRandom();

            const { deployerWallet, identityFactory } = await loadFixture(
                deployFactoryFixture
            );

            // Create the Identity
            const promise = deployIdentity(
                identityFactory,
                randomWallet.address,
                ''
            )
                .then(identityAddress => {
                    return identityAddress;
                })
                .catch(error => {
                    expect(error).to.be.instanceOf(EmptyString);
                });

            await promise;
        });
    });
});
