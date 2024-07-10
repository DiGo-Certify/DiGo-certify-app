const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployFactoryFixture } = require('../fixtures');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const { deployFullTREXSuiteFixture } = require('../fixtures');
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
    describe('Test creating an identity using the deployIdentity script', () => {
        it('should add a claim to an identity', async () => {
            const { deployerWallet, identityFactory } = await loadFixture(
                deployFullTREXSuiteFixture
            );

            const [aliceWallet] = await ethers.getSigners();

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
        });

        it('should not create an identity with an empty salt', async () => {
            const { deployerWallet, identityFactory } = await loadFixture(
                deployFullTREXSuiteFixture
            );

            const [aliceWallet] = await ethers.getSigners();

            // Create Identity for Alice
            const aliceIdentity = await deployIdentity(
                identityFactory,
                aliceWallet.address,
                '',
                deployerWallet
            ).catch(error => {
                expect(error).to.be.instanceOf(IdentityDeploymentError);
            });
        });

        it('should not create an identity with an empty address', async () => {
            const { deployerWallet, identityFactory } = await loadFixture(
                deployFullTREXSuiteFixture
            );

            const [aliceWallet] = await ethers.getSigners();

            // Create Identity for Alice
            const aliceIdentity = await deployIdentity(
                identityFactory,
                '',
                'alice-salt',
                deployerWallet
            ).catch(error => {
                expect(error).to.be.instanceOf(IdentityDeploymentError);
            });
        });

        it('Should not create an identity already linked to an address', async () => {
            const { deployerWallet, identityFactory } = await loadFixture(
                deployFullTREXSuiteFixture
            );

            const [aliceWallet] = await ethers.getSigners();

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

            // Create Identity for Alice
            const aliceIdentity2 = await deployIdentity(
                identityFactory,
                aliceWallet.address,
                'alice-salt2',
                deployerWallet
            );

            expect(aliceIdentity2).to.exist;
            expect(
                await identityFactory.getWallets(
                    await aliceIdentity2.getAddress()
                )
            ).to.be.lengthOf(1);
        });

        it('Should not create an identity with the same salt', async () => {
            const { deployerWallet, identityFactory } = await loadFixture(
                deployFullTREXSuiteFixture
            );

            const [aliceWallet] = await ethers.getSigners();

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

            // Create Identity for Alice
            const aliceIdentity2 = await deployIdentity(
                identityFactory,
                aliceWallet.address,
                'alice-salt',
                deployerWallet
            ).catch(error => {
                expect(error).to.be.instanceOf(SaltAlreadyTaken);
            });
        });
    });
});
