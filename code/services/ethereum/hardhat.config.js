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
    networks: {
        hardhat: {
            chainId: 31337
        }
    }
};
