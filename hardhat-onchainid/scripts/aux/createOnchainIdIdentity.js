/**
 * Create an identity using the IdentityFactory contract
 *
 * @param {*} identityFactory - The IdentityFactory contract
 * @param {*} managementKey - The management key of the identity, the address of the wallet that will receive the identity
 * @param {*} deployer - The wallet that deployed the IdentityFactory contract
 * @param {*} salt - The salt used to create the identity
 * @returns
 */
async function createIdentity(identityFactory, managementKey, deployer, salt) {
    console.log(`\n[!] Started Creating Identity ...`);

    // Create an identity using the factory
    const tx = await identityFactory.createIdentity(managementKey, salt);
    const txReceipt = await tx.wait();
    const event = txReceipt.logs.find(e => e.eventName === "Deployed");

    console.log(
        `\n[✓] Identity "${event.args}" created by management ${deployer.address}`
    );

    return event.args[0];
}

module.exports = { createIdentity };
