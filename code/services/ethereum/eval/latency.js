/*
 * eval/latency.js — end-to-end latency harness (RQ4), for a live network
 *
 * Run from code/services/ethereum, against Sepolia (or any real network):
 *   REPS=20 npx hardhat run eval/latency.js --network sepolia
 *
 * Gas is already measured deterministically on the local net (measure.js); this
 * script measures only what a public network adds: wall-clock latency of the two
 * representative certificate operations against real block confirmations.
 *   - issue    : send addClaim (write a certificate claim) -> confirmation
 *   - validate : getClaimsByTopic read round-trip (0 gas, off-chain read)
 *
 * WHY NOT deployFullTREXSuiteFixture: that test fixture fires state-changing txs
 * (addAndUseTREXVersion, addTokenFactory) without awaiting confirmation. On the
 * local auto-mining net that is instantaneous, but on a real network the next
 * deploy races ahead of them and reverts ("execution reverted" during
 * estimateGas). It is a local-net-only fixture.
 *
 * This harness therefore builds only what the addClaim path actually needs and
 * WAITS on every transaction. Note that Identity.addClaim validates the claim
 * against the CLAIM ISSUER's keys (IClaimIssuer.isClaimValid), not the
 * trusted-issuer registry, so the full T-REX suite is unnecessary here: we deploy
 * a single Identity and a single ClaimIssuer.
 *
 * SINGLE-KEY DESIGN. Every gas-paying call runs through ONE funded wallet
 * (getSigners()[0], i.e. the PRIVATE_KEY configured for the network): it owns the
 * Identity, owns and signs for the ClaimIssuer, and sends every addClaim. A
 * single funded Sepolia key suffices (~0.01-0.02 test-ETH for the whole run).
 *
 * Latency is dominated by block time and RPC round-trips, not by gas, so cold vs.
 * warm storage is immaterial; we reuse one Identity/ClaimIssuer across reps.
 *
 * Output: eval/results/latency.csv (same schema as measure.csv) + a printed
 * median/p95 summary. Send me the CSV to fill tab:eval-latency.
 */

const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const { ethers, network } = hre;
const {
    contracts: { ClaimIssuer, Identity },
} = require('@onchain-id/solidity');

const { getClaimsByTopic } = require('../scripts/claims/getClaimsByTopic');
const { CLAIM_TOPICS_OBJ } = require('../scripts/claims/claimTopics');
const hash = require('../scripts/utils/encryption/hash');

const REPS = Number(process.env.REPS ?? 20);
const ETH_USD = Number(process.env.ETH_USD ?? 3000);
const CONFIRMATIONS = Number(process.env.CONFIRMATIONS ?? 1);
const SIGN_CLAIM_PURPOSE = 3; // CLAIM_SIGNER
const ECDSA_KEY_TYPE = 1;
const OUT_DIR = path.join(__dirname, 'results');
const CSV = path.join(OUT_DIR, 'latency.csv');
const HEADER =
    'iso,network,operation,run,gasUsed,gasPriceGwei,costEth,costUsd,latencyMs,block,params\n';

function appendRow(cols) {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    if (!fs.existsSync(CSV)) fs.writeFileSync(CSV, HEADER);
    fs.appendFileSync(CSV, cols.join(',') + '\n');
}

function keyHash(address) {
    return ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address'], [address])
    );
}

async function recordGas(operation, run, gasUsed, gasPrice, latencyMs, block, params = {}) {
    const gp = gasPrice ?? (await ethers.provider.getFeeData()).gasPrice ?? 0n;
    const costEth = Number(ethers.formatEther(gasUsed * gp));
    appendRow([
        new Date().toISOString(),
        network.name,
        operation,
        run,
        gasUsed.toString(),
        Number(ethers.formatUnits(gp, 'gwei')).toFixed(3),
        costEth.toFixed(8),
        (costEth * ETH_USD).toFixed(4),
        latencyMs.toFixed(1),
        block,
        JSON.stringify(params).replaceAll(',', ';'),
    ]);
}

async function recordReceipt(operation, run, receipt, latencyMs, params = {}) {
    await recordGas(
        operation, run, receipt.gasUsed, receipt.gasPrice, latencyMs, receipt.blockNumber, params
    );
}

const median = a => {
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (a, p) => {
    const s = [...a].sort((x, y) => x - y);
    const i = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
    return s[i];
};
const fx = n => Number(n).toFixed(1);

// Build (but do not send) an addClaim tx, signed by the issuer's signing wallet.
// Mirrors buildClaimTx in measure.js / scripts/claims/add-claim.js.
async function buildClaimTx(receiverIdentity, claimIssuerContract, claimIssuerWallet, claimTopic, claimData, scheme = 1, uri = '') {
    const issuer = await claimIssuerContract.getAddress();
    const identity = await receiverIdentity.getAddress();
    const topic = ethers.id(claimTopic);
    const data = ethers.toUtf8Bytes(claimData);
    const signature = await claimIssuerWallet.signMessage(
        ethers.getBytes(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address', 'uint256', 'bytes'],
                    [identity, topic, data]
                )
            )
        )
    );
    const uriField = uri ? hash(uri) : '';
    return receiverIdentity
        .connect(claimIssuerWallet)
        .addClaim(topic, scheme, issuer, signature, data, uriField);
}

async function main() {
    console.log(`network=${network.name} reps=${REPS} confirmations=${CONFIRMATIONS}`);
    if (network.name === 'hardhat') {
        console.warn(
            '[!] Running on the in-process hardhat network: latencies are a lower ' +
            'bound (no real block time). Use --network sepolia for RQ4 figures.'
        );
    }

    const [funded] = await ethers.getSigners(); // = PRIVATE_KEY for the network
    console.log(`[i] funded wallet: ${funded.address}`);
    console.log(`[i] balance: ${ethers.formatEther(await ethers.provider.getBalance(funded.address))} ETH`);

    // ---- One-time setup, all paid by the single funded wallet, all awaited ---
    // 1) A ClaimIssuer owned + signed by the funded wallet.
    const claimIssuer = await new ethers.ContractFactory(
        ClaimIssuer.abi, ClaimIssuer.bytecode, funded
    ).deploy(funded.address);
    await claimIssuer.waitForDeployment();
    await (await claimIssuer.connect(funded).addKey(
        keyHash(funded.address), SIGN_CLAIM_PURPOSE, ECDSA_KEY_TYPE
    )).wait();
    console.log(`[i] ClaimIssuer: ${await claimIssuer.getAddress()}`);

    // 2) A subject Identity owned by the funded wallet; authorise the issuer's
    //    signing key on it so it may write (and send) claims.
    const identity = await new ethers.ContractFactory(
        Identity.abi, Identity.bytecode, funded
    ).deploy(funded.address, false);
    await identity.waitForDeployment();
    await (await identity.connect(funded).addKey(
        keyHash(funded.address), SIGN_CLAIM_PURPOSE, ECDSA_KEY_TYPE
    )).wait();
    console.log(`[i] Identity: ${await identity.getAddress()}`);

    const topicName = CLAIM_TOPICS_OBJ.CERTIFICATE;
    const claimData = 'reg:2024/0001;course:1234;date:2024-07-01;grade:18';

    // ---- Issuance latency: send addClaim -> wait for confirmation ----------
    const issueMs = [];
    for (let run = 0; run < REPS; run++) {
        const t0 = performance.now();
        const tx = await buildClaimTx(
            identity, claimIssuer, funded, topicName, `${claimData};v${run}`
        );
        const receipt = await tx.wait(CONFIRMATIONS);
        const ms = performance.now() - t0;
        issueMs.push(ms);
        await recordReceipt('issue', run, receipt, ms, { confirmations: CONFIRMATIONS });
        console.log(`[i] issue run=${run} ${fx(ms)}ms gas=${receipt.gasUsed}`);
    }

    // ---- Validation latency: getClaimsByTopic read round-trip --------------
    const readMs = [];
    for (let run = 0; run < REPS; run++) {
        const t0 = performance.now();
        await getClaimsByTopic(identity, topicName);
        const ms = performance.now() - t0;
        readMs.push(ms);
        await recordGas('validate', run, 0n, 0n, ms, 0, { readOnly: true });
    }

    // ---- Printed summary (also derivable from the CSV) --------------------
    console.log('\n=== latency summary (ms) ===');
    console.log(`issue    : median=${fx(median(issueMs))} p95=${fx(pct(issueMs, 95))} min=${fx(Math.min(...issueMs))} max=${fx(Math.max(...issueMs))}`);
    console.log(`validate : median=${fx(median(readMs))} p95=${fx(pct(readMs, 95))} min=${fx(Math.min(...readMs))} max=${fx(Math.max(...readMs))}`);
    console.log(`\nDone -> ${CSV}. Send this CSV to fill tab:eval-latency.`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
