/*
 * Emit a Besu genesis `alloc` object prefunding the first PREFUND_COUNT
 * addresses derived from MNEMONIC, so ethers.getSigners() returns funded
 * accounts on the consortium network. Uses the project's ethers (v6).
 *
 *   MNEMONIC="..." PREFUND_COUNT=20 node besu/derive-accounts.js > besu/alloc.json
 */
const { ethers } = require('ethers');

const mnemonic = process.env.MNEMONIC
    || 'test test test test test test test test test test test junk';
const count = Number(process.env.PREFUND_COUNT || 20);
const balance = '0x' + (10n ** 24n).toString(16); // ~1,000,000 ETH per account

const alloc = {};
for (let i = 0; i < count; i++) {
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${i}`);
    alloc[wallet.address] = { balance };
}

process.stdout.write(JSON.stringify(alloc, null, 2));
