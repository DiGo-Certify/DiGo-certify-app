const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployFactoryFixture } = require('../fixtures');
const { deployIdentity } = require('../../scripts/identities/deploy-identity');
const getIdentity = require('../../scripts/identities/getIdentity');

describe('getIdentity test function', function () {
    it('Should return the identity of alice wallet', async function () {
        const { aliceWallet, identityFactory, deployerWallet } =
            await loadFixture(deployFactoryFixture);

        const alice = await deployIdentity(
            identityFactory,
            aliceWallet.address,
            'alice-salt',
            deployerWallet
        );

        const identity = await getIdentity(
            aliceWallet.address,
            identityFactory,
            deployerWallet
        );

        expect(await identity.getAddress()).to.be.equal(await alice.getAddress());
    });

    it('Should return null if the identity does not exist', async function () {
        const { aliceWallet, identityFactory, deployerWallet } = await loadFixture(
            deployFactoryFixture
        );

        const identity = await getIdentity(
            aliceWallet.address,
            identityFactory,
            deployerWallet
        );

        expect(identity).to.be.null;
    });
});
