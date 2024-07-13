const { useRpcProvider } = require('../utils/useRpcProvider');
const config = require('../../../../config.json');
const { getIdentity } = require('./getIdentity');

async function linkWallet(address, identityFactory, signer = undefined) {
    try {
        if (signer === undefined) {
            signer = useRpcProvider(config.rpc, config.deployer.privateKey);
        }

        const identity = await getIdentity(address, identityFactory, signer);

        if (identity !== null) {
            console.log('[!] Wallet already linked:', address);
            return false;
        }
        console.log('[!] Linking wallet with address:', address);
        const tx = await identityFactory.connect(signer).linkWallet(address);

        const tx_receipt = await tx.wait();

        tx_receipt.logs.forEach(item => {
            if (
                item.eventName !== undefined &&
                item.eventName === 'WalletLinked'
            ) {
                console.log('[✓] Wallet linked:', item.args.wallet);
                walletLinked = item.args.wallet;
            }
        });

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

module.exports = { linkWallet };
