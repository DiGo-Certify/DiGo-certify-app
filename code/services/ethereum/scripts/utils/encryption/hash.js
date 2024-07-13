const CryptoJS = require('crypto-js');

/**
 * Applies the SHA-256 hashing algorithm to the given data
 *
 * @param {*} data - The data to be hashed
 * @returns The hashed data as a string with the prefix '0x'
 */
function hash(data) {
    const hash = CryptoJS.SHA256(data.toString()).toString(CryptoJS.enc.Hex);
    return '0x' + hash;
}

module.exports = hash;
