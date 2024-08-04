const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
    getPrivateKeyPem,
    getPublicKeyPem,
    encrypt,
    decrypt
} = require('../scripts/utils/encryption/aes-256');

describe('ecnryption test', function () {
    it('test encryptioon', async function () {
        
    });
});
