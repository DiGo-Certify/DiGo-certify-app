require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: '0.8.24',
    defaultNetwork: 'hardhat',
    paths: {
        artifacts: './artifacts'
    },
    networks: {
        hardhat: {
            chainId: 31337
        }
    }
};
