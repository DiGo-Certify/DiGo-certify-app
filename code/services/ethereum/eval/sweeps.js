/*
 * eval/sweeps.js — scalability sweeps (RQ3)
 *
 * Run from code/services/ethereum:
 *   REPS=10 STEP=5 npx hardhat run eval/sweeps.js
 *
 * Each size checkpoint is sampled REPS times for the noisy (latency) metrics.
 * Outputs under eval/results/:
 *   sweep-issuers.csv          — raw: one row per (registrySize, rep)
 *   sweep-issuers-summary.csv  — median/p95/min/max latency per registrySize
 *   sweep-claims.csv           — raw: one row per (claimsHeld, rep)
 *   sweep-claims-summary.csv   — median/p95/min/max read latency per claimsHeld
 *
 * Gas is deterministic (same state => same gas), so it is recorded once per size
 * and repeated across the rep rows for convenience; the distributions worth
 * summarising are the latencies. Summarise the *-summary.csv files into the
 * paper's figures/tables; keep the raw CSVs as the replication artifact.
 *
 * FINDINGS BAKED IN:
 *  - TrustedIssuersRegistry HARD-CAPS the registry at 50
 *    (require(_trustedIssuers.length < 50)); the sweep is clamped to 49.
 *  - Identity.addClaim validates external issuers on-chain (isClaimValid), so
 *    sweep 2 seeds with REAL ClaimIssuer contracts, not dummy addresses.
 */

const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const { ethers, network } = hre;
const {
    contracts: { ClaimIssuer },
} = require('@onchain-id/solidity');

const { deployFullTREXSuiteFixture } = require('../test/fixtures');
const { deployIdentity } = require('../scripts/identities/deploy-identity');
const { getClaimsByTopic } = require('../scripts/claims/getClaimsByTopic');
const { CLAIM_TOPICS, CLAIM_TOPICS_OBJ } = require('../scripts/claims/claimTopics');

const REGISTRY_CAP = 49; // TrustedIssuersRegistry allows strictly < 50
const MAX_ISSUERS = Math.min(Number(process.env.MAX_ISSUERS ?? REGISTRY_CAP), REGISTRY_CAP);
const MAX_CLAIMS = Number(process.env.MAX_CLAIMS ?? 30);
const STEP = Number(process.env.STEP ?? 5);
const REPS = Number(process.env.REPS ?? 10);
const OUT_DIR = path.join(__dirname, 'results');

function writer(file, header) {
    const p = path.join(OUT_DIR, file);
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    if (!fs.existsSync(p)) fs.writeFileSync(p, header + '\n');
    return row => fs.appendFileSync(p, row.join(',') + '\n');
}

const median = a => {
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
// nearest-rank percentile (p in 0..100)
const pct = (a, p) => {
    const s = [...a].sort((x, y) => x - y);
    const i = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
    return s[i];
};
const fx = n => Number(n).toFixed(1);

function keyHash(address) {
    return ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address'], [address])
    );
}

/* ---- Sweep 1: issuer-resolution cost vs. trusted-issuer registry size ----
 * The issuance path resolves authorised issuers via
 * getTrustedIssuersForClaimTopic; we measure its (view) gas and latency as the
 * registry grows. Seeding uses random addresses (addTrustedIssuer accepts them).
 */
async function sweepIssuers() {
    const raw = writer('sweep-issuers.csv', 'iso,network,registrySize,rep,resolveGas,resolveMs');
    const sum = writer(
        'sweep-issuers-summary.csv',
        'network,registrySize,reps,resolveGas,resolveMs_med,resolveMs_p95,resolveMs_min,resolveMs_max'
    );
    const { deployerWallet, trustedIssuersRegistry } = await deployFullTREXSuiteFixture();

    const topics = CLAIM_TOPICS.map(t => ethers.id(t)); // [INSTITUTION, STUDENT, CERTIFICATE]
    const certTopic = ethers.id(CLAIM_TOPICS_OBJ.CERTIFICATE);

    let current = 0;
    for (let size = STEP; size <= MAX_ISSUERS; size += STEP) {
        while (current < size) {
            const addr = ethers.Wallet.createRandom().address;
            await (
                await trustedIssuersRegistry.connect(deployerWallet).addTrustedIssuer(addr, topics)
            ).wait();
            current++;
        }

        const msSamples = [];
        let resolveGas = 0n;
        for (let rep = 0; rep < REPS; rep++) {
            resolveGas =
                await trustedIssuersRegistry.getTrustedIssuersForClaimTopic.estimateGas(certTopic);
            const t0 = performance.now();
            await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(certTopic);
            const ms = performance.now() - t0;
            msSamples.push(ms);
            raw([new Date().toISOString(), network.name, size, rep, resolveGas.toString(), fx(ms)]);
        }
        sum([
            network.name, size, REPS, resolveGas.toString(),
            fx(median(msSamples)), fx(pct(msSamples, 95)),
            fx(Math.min(...msSamples)), fx(Math.max(...msSamples)),
        ]);
        console.log(`[i] registrySize=${size} resolveGas=${resolveGas} readMs med=${fx(median(msSamples))} p95=${fx(pct(msSamples, 95))}`);
    }
    console.log(`[✓] sweep-issuers (capped at ${MAX_ISSUERS}; registry limit is 50)`);
}

/* ---- Sweep 2: addClaim gas + validation read cost vs. claims per identity ---
 * claimId = keccak256(issuer, topic), so N claims under ONE topic require N
 * distinct issuers. We deploy N real ClaimIssuer contracts (management key =
 * deployer, signing key = a fresh wallet), sign a valid claim with each, and add
 * it to a single identity (sent by the identity owner, a management key).
 */
async function sweepClaims() {
    const raw = writer('sweep-claims.csv', 'iso,network,claimsHeld,rep,addClaimGas,validationReadMs');
    const sum = writer(
        'sweep-claims-summary.csv',
        'network,claimsHeld,reps,addClaimGas,readMs_med,readMs_p95,readMs_min,readMs_max'
    );
    const { deployerWallet, identityFactory } = await deployFullTREXSuiteFixture();
    const [studentWallet] = await ethers.getSigners();

    const identity = await deployIdentity(
        identityFactory, studentWallet.address, 'sweep-claims', deployerWallet
    );

    const topicName = CLAIM_TOPICS_OBJ.CERTIFICATE;
    const topic = ethers.id(topicName);

    // Deploy one real ClaimIssuer whose signing key is `signer`, returning both.
    async function newIssuer() {
        const signer = ethers.Wallet.createRandom(); // signs off-chain only (no ETH)
        const issuer = await new ethers.ContractFactory(
            ClaimIssuer.abi, ClaimIssuer.bytecode, deployerWallet
        ).deploy(deployerWallet.address);
        await issuer.waitForDeployment();
        await (await issuer.connect(deployerWallet).addKey(keyHash(signer.address), 3, 1)).wait();
        return { issuer, signer };
    }

    let held = 0;
    let lastAddGas = 0n;
    for (let n = STEP; n <= MAX_CLAIMS; n += STEP) {
        while (held < n) {
            const { issuer, signer } = await newIssuer();
            const issuerAddr = await issuer.getAddress();
            const data = ethers.toUtf8Bytes(`certificate-claim-${held}`);
            const signature = await signer.signMessage(
                ethers.getBytes(
                    ethers.keccak256(
                        ethers.AbiCoder.defaultAbiCoder().encode(
                            ['address', 'uint256', 'bytes'],
                            [await identity.getAddress(), topic, data]
                        )
                    )
                )
            );
            const tx = await identity
                .connect(studentWallet)
                .addClaim(topic, 1, issuerAddr, signature, data, '');
            const receipt = await tx.wait();
            lastAddGas = receipt.gasUsed;
            held++;
        }

        const msSamples = [];
        for (let rep = 0; rep < REPS; rep++) {
            const t0 = performance.now();
            await getClaimsByTopic(identity, topicName);
            const ms = performance.now() - t0;
            msSamples.push(ms);
            raw([new Date().toISOString(), network.name, n, rep, lastAddGas.toString(), fx(ms)]);
        }
        sum([
            network.name, n, REPS, lastAddGas.toString(),
            fx(median(msSamples)), fx(pct(msSamples, 95)),
            fx(Math.min(...msSamples)), fx(Math.max(...msSamples)),
        ]);
        console.log(`[i] claimsHeld=${n} addClaimGas=${lastAddGas} readMs med=${fx(median(msSamples))} p95=${fx(pct(msSamples, 95))}`);
    }
    console.log('[✓] sweep-claims');
}

async function main() {
    console.log(
        `network=${network.name} reps=${REPS} maxIssuers=${MAX_ISSUERS} maxClaims=${MAX_CLAIMS} step=${STEP}`
    );
    await sweepIssuers();
    await sweepClaims();
    console.log('\nDone. Summarise the *-summary.csv files into fig:eval-scale-issuers / fig:eval-scale-claims.');
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
