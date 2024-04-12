async function createIdentity(
    identityFactory,
    managementKey,
    deployer,
    salt
) {
    console.log(`\n[!] Started Creating Identity ...`);

    // Create an identity using the factory
    const tx = await identityFactory.createIdentity(managementKey, salt);
    const txReceipt = await tx.wait();
    const event = txReceipt.logs.find(e => e.eventName === "Deployed");

    console.log(
        `\n[✓] Identity "${event.args}" created by for wallet ${deployer.address}`
    );

    return event.args;
}

module.exports = { createIdentity };
