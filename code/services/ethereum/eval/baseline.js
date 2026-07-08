/*
 * eval/baseline.js — hash-anchoring baseline microbenchmark (RQ2)
 *
 * Run from code/services/ethereum:
 *   REPS=30 ETH_USD=3000 npx hardhat run eval/baseline.js
 *
 * Measures the bare Blockcerts-style baseline (contracts/config/HashAnchor.sol)
 * with the same methodology as measure.js, so its numbers are directly
 * comparable to our approach:
 *   - deploy         : one-time contract deployment (gas + bytecode size)
 *   - anchor:cold    : issue a certificate = first anchor of a fresh digest
 *                      (cold SSTORE, emits CertificateAnchored)
 *   - anchor:warm    : re-anchor an existing digest = the update path (warm SSTORE)
 *   - validate       : read path (issuerOf), 0 gas to the caller; latency only
 *
 * Output: eval/results/baseline.csv (same schema as measure.csv). Summarise the
 * medians into tab:eval-baseline and compare against the composite
 * "Issue certificate" figure from measure.csv.
 */

const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const { ethers, network } = hre;

const REPS = Number(process.env.REPS ?? 30);
const DEPLOY_REPS = Number(process.env.DEPLOY_REPS ?? 3);
const ETH_USD = Number(process.env.ETH_USD ?? 3000);
const OUT_DIR = path.join(__dirname, 'results');
const CSV = path.join(OUT_DIR, 'baseline.csv');
const HEADER =
    'iso,network,operation,run,gasUsed,gasPriceGwei,costEth,costUsd,latencyMs,block,params\n';

function appendRow(cols) {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    if (!fs.existsSync(CSV)) fs.writeFileSync(CSV, HEADER);
    fs.appendFileSync(CSV, cols.join(',') + '\n');
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

// A fresh, unique 32-byte digest per run (stands in for SHA-256(certificate)).
function freshDigest(run) {
    return ethers.keccak256(ethers.toUtf8Bytes(`baseline-certificate-${network.name}-${run}`));
}

async function main() {
    console.log(`network=${network.name} reps=${REPS} ethUsd=${ETH_USD}`);
    const [issuer] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('HashAnchor');

    // --- deploy (one-time) ---
    let anchor;
    for (let run = 0; run < DEPLOY_REPS; run++) {
        const t0 = performance.now();
        const c = await factory.connect(issuer).deploy();
        await c.waitForDeployment();
        const latencyMs = performance.now() - t0;
        const receipt = await c.deploymentTransaction().wait();
        const code = await ethers.provider.getCode(await c.getAddress());
        const bytecodeBytes = (code.length - 2) / 2;
        await recordReceipt('deployHashAnchor', run, receipt, latencyMs, { bytecodeBytes });
        anchor = c; // keep the last one for the op measurements
    }
    console.log(`[✓] deployHashAnchor: ${DEPLOY_REPS} runs`);

    // --- anchor:cold (issue) — fresh digest each run => cold SSTORE ---
    for (let run = 0; run < REPS; run++) {
        const digest = freshDigest(run);
        const t0 = performance.now();
        const tx = await anchor.connect(issuer).anchor(digest);
        const receipt = await tx.wait();
        await recordReceipt('anchor:cold', run, receipt, performance.now() - t0, { slot: 'cold' });
    }
    console.log(`[✓] anchor:cold: ${REPS} runs`);

    // --- anchor:warm (update) — re-anchor an existing digest => warm SSTORE ---
    const warmDigest = freshDigest(0); // anchored above
    for (let run = 0; run < REPS; run++) {
        const t0 = performance.now();
        const tx = await anchor.connect(issuer).anchor(warmDigest);
        const receipt = await tx.wait();
        await recordReceipt('anchor:warm', run, receipt, performance.now() - t0, { slot: 'warm' });
    }
    console.log(`[✓] anchor:warm: ${REPS} runs`);

    // --- validate — read path, 0 gas to the caller; measure latency only ---
    for (let run = 0; run < REPS; run++) {
        const digest = freshDigest(run % REPS);
        const t0 = performance.now();
        await anchor.issuerOf(digest);
        const latencyMs = performance.now() - t0;
        await recordGas('validate', run, 0n, 0n, latencyMs, 0, { readOnly: true });
    }
    console.log(`[✓] validate: ${REPS} runs`);

    console.log(`\nDone -> ${CSV}. Summarise medians into tab:eval-baseline.`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
