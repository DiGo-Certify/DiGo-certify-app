const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployFullTREXSuiteFixture } = require('../fixtures');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const { linkWallet } = require('../../scripts/identities/link-wallet');

describe('linkWallet test function', function () {
    it('Should link alice wallet to identity', async function () {
        const { identityFactory, deployerWallet } = await loadFixture(
            deployFullTREXSuiteFixture
        );

        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const deployerIdentity = await deployIdentity(
            identityFactory,
            deployerWallet.address,
            'deployer-salt',
            deployerWallet
        );

        const aliceIdentity = await deployIdentity(
            identityFactory,
            aliceWallet.address,
            'alice-salt',
            deployerWallet
        );

        const walletLinked = await linkWallet(
            bobWallet.address,
            identityFactory,
            deployerWallet
        );

        expect(walletLinked).to.be.true;
        expect(
            await identityFactory.getWallets(await aliceIdentity.getAddress())
        ).to.be.deep.equal([aliceWallet.address, bobWallet.address]);
    });

    it('Should return false if the wallet is already linked', async function () {
        const { identityFactory, deployerWallet } = await loadFixture(
            deployFullTREXSuiteFixture
        );

        const [aliceWallet, bobWallet] = await ethers.getSigners();

        const deployerIdentity = await deployIdentity(
            identityFactory,
            deployerWallet.address,
            'deployer-salt',
            deployerWallet
        );

        const alice = await deployIdentity(
            identityFactory,
            aliceWallet.address,
            'alice-salt',
            deployerWallet
        );

        const walletLinked = await linkWallet(
            bobWallet.address,
            identityFactory,
            deployerWallet
        );

        expect(walletLinked).to.be.true;

        const walletLinked2 = await linkWallet(
            bobWallet.address,
            identityFactory,
            deployerWallet
        );

        expect(walletLinked2).to.be.false;
    });
});
