const CryptoJS = require('crypto-js');

/**
 * Encrypts the given data using AES-256 encryption
 *
 * @param {string} data - The data to be encrypted
 * @param {string} key - The key to be used for encryption
 * @returns The encrypted data as a string
 */
function encrypt(data, key) {
    return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * Decrypts the given data using AES-256 decryption
 *
 * @param {string} data - The data to be decrypted
 * @param {string} key - The key to be used for decryption
 * @returns The decrypted data as a string
 */
function decrypt(data, key) {
    return CryptoJS.AES.decrypt(data, key).toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
