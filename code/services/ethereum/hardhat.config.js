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
