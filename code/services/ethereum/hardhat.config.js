require('@nomicfoundation/hardhat-ethers');

const networks = {
    hardhat: {
        chainId: 31337,
        accounts: { count: 33 },
    }
};

if (process.env.SEPOLIA_RPC && process.env.PRIVATE_KEY) {
    networks.sepolia = {
        url: process.env.SEPOLIA_RPC,
        accounts: [process.env.PRIVATE_KEY],
        chainId: 11155111,
    };
}

// Permissioned consortium (Hyperledger Besu QBFT). Enabled when BESU_RPC is set.
// Signers come from the mnemonic prefunded in the Besu genesis (see
// eval/consortium/besu/derive-accounts.js), so ethers.getSigners() is funded.
//   BESU_RPC=http://<node-ip>:8545 npx hardhat run eval/throughput.js --network besu
if (process.env.BESU_RPC) {
    networks.besu = {
        url: process.env.BESU_RPC,
        chainId: Number(process.env.BESU_CHAIN_ID || 1337),
        accounts: {
            mnemonic: process.env.BESU_MNEMONIC
                || 'test test test test test test test test test test test junk',
            count: Number(process.env.BESU_ACCOUNTS || 20),
        },
        gasPrice: 0, // free-gas permissioned chain
    };
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        compilers: [
            {
                version: '0.8.17',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
            {
                version: '0.8.20',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ]
    },
    defaultNetwork: 'hardhat',
    networks
};
