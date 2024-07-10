const { createHash } = require('crypto');
const {ethers} = require('ethers');

/**
 * Applies the SHA-256 hashing algorithm to the given data
 * 
 * @param {*} data - The data to be hashed
 * @returns The hashed data as a string with the prefix '0x'
 */
function hash(data) {
    const hash = createHash('sha256').update(data).digest('hex');
    return '0x' + hash;
}

module.exports = hash ;
