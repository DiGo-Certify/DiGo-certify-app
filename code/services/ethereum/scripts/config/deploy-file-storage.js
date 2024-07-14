const { ethers } = require('hardhat');
const { useRpcProvider } = require('../utils/useRpcProvider');
const config = require('../../../../config.json');

async function main() {
    const deployer = await useRpcProvider(
        config.rpc,
        config.deployer.privateKey
    );

    console.log('Deploying contracts with the account:', deployer.address);

    const fileStorage = await ethers.deployContract('FileStorage', deployer);

    await fileStorage.waitForDeployment();

    console.log('FileStorage contract deployed to:', await fileStorage.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
