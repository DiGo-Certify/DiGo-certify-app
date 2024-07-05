async function deployIdentity(identityFactory, address, salt) {
    try {
        const tx = await identityFactory.createIdentity(address, salt);
        const tx_receipt = await tx.wait();

        tx_receipt.events.forEach(item => {
            if (item !== undefined && item.event === 'WalletLinked') {
                console.log('Wallet linked: ', item.args);
                return item.args;
            }
        });
    } catch (error) {
        console.log('Error deploying identity: ', error);
        return null;
    }
}

module.exports = deployIdentity;
