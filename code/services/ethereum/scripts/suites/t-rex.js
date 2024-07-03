const { ethers } = require('ethers');

async function deployTrexProxy(deployer) {
    // Deploy T-Rex proxy
    console.log(`[!] Deploying T-Rex proxy...`);


    // const tRexProxyAddress = await tRexProxy.getAddress();
    // const tRexProxyCode = await tRexProxy.getDeployedCode();

    console.log(`[✓] Deployed T-Rex proxy at ${tRexProxyAddress}`);

    return { tRexProxyAddress, tRexProxyCode };
}

module.exports = { deployTrexProxy };
