// Consortium (Besu QBFT) network entry for the harness.
// Merge this into the `networks` object in code/services/ethereum/hardhat.config.js,
// alongside the existing `hardhat` and `sepolia` entries, e.g.:
//
//   if (process.env.BESU_RPC) {
//       networks.besu = { ... };   // <- the block below
//   }
//
// Then run the harness against it:
//   BESU_RPC=http://<node1-local-ip>:8545 REPS=30 npx hardhat run eval/measure.js --network besu
//   BESU_RPC=http://<node1-local-ip>:8545 npx hardhat run eval/throughput.js --network besu
//
// Accounts come from the same mnemonic prefunded in the Besu genesis
// (besu/derive-accounts.js), so ethers.getSigners() returns funded signers.

networks.besu = {
    url: process.env.BESU_RPC || 'http://127.0.0.1:8545',
    chainId: Number(process.env.BESU_CHAIN_ID || 1337),
    accounts: {
        mnemonic: process.env.BESU_MNEMONIC
            || 'test test test test test test test test test test test junk',
        count: Number(process.env.BESU_ACCOUNTS || 20),
    },
    // Free-gas permissioned chain: keep tx gas price at 0.
    gasPrice: 0,
};
