/*
 * eval/throughput.js: end-to-end latency and sustained throughput on the
 * permissioned consortium (RQ3: does the design run on a realistic permissioned
 * chain, and at what latency/throughput?).
 *
 * Run from code/services/ethereum, against the Besu QBFT consortium:
 *   BESU_RPC=http://<node-ip>:8545 npx hardhat run eval/throughput.js --network besu
 *
 * Two experiments:
 *   E-LAT  unloaded end-to-end issuance latency: submit one certificate at a
 *          time and time submit -> mined (QBFT has instant finality, so an
 *          included tx is final; this is the user-visible confirmation latency,
 *          floored by the block period). Reported as min/median/p95/max.
 *   E-TPS  sustained throughput: an open-loop streaming driver keeps up to
 *          MAX_INFLIGHT transactions in flight and measures the achieved
 *          mined-tx rate, then scans the produced blocks for txs/block and gas
 *          utilisation (the empirical counterpart of the analytical ceiling
 *          blockGasLimit / gasPerOp / blockPeriod).
 *
 * Workloads (WORKLOAD env):
 *   addClaim (default) certificate issuance/update: the application write path
 *                      (issuer signs a CERTIFICATE claim and writes it to a
 *                      subject identity). All txs are signed by the issuer key,
 *                      so they share one nonce sequence (pipelined, not awaited).
 *   transfer           0-value self-transfers spread across all funded signers:
 *                      a chain-level ceiling independent of the application.
 *
 * Env knobs:
 *   WORKLOAD=addClaim|transfer   TARGET=300   MAX_INFLIGHT=64
 *   LAT_REPS=20   N_ISSUERS=8   GAS_LIMIT_OP=600000
 *
 * N_ISSUERS parallel institutions (addClaim) each sign from their own account, so
 * throughput is bounded by block gas, not by one client's nonce sequence. Raise
 * MAX_INFLIGHT above the per-block gas capacity to actually saturate blocks.
 *
 * Appends one summary row per experiment to eval/results/throughput.csv and, for
 * E-TPS, one row per tx to eval/results/throughput-txs.csv (submit/mined times).
 */

const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const { ethers, network } = hre;

const { deployFullTREXSuiteFixture } = require('../test/fixtures');
const { deployIdentity } = require('../scripts/identities/deploy-identity');
const { deployClaimIssuer } = require('../scripts/claimIssuer/deploy-claim-issuer');
const { addKeyToIdentity } = require('../scripts/claimIssuer/addKeyToIdentity');
const { CLAIM_TOPICS_OBJ } = require('../scripts/claims/claimTopics');

const WORKLOAD = process.env.WORKLOAD ?? 'addClaim';
const TARGET = Number(process.env.TARGET ?? 300);
const MAX_INFLIGHT = Number(process.env.MAX_INFLIGHT ?? 64);
const LAT_REPS = Number(process.env.LAT_REPS ?? 20);
// Parallel issuers (institutions). Each is an independent trusted ClaimIssuer with
// its own signing account and subject, so issuance is not serialised on one nonce
// and blocks can fill to the gas ceiling (the true consortium capacity).
const N_ISSUERS = Number(process.env.N_ISSUERS ?? 8);
const GAS_LIMIT_OP = Number(process.env.GAS_LIMIT_OP ?? 600000);

const OUT_DIR = path.join(__dirname, 'results');
const CSV = path.join(OUT_DIR, 'throughput.csv');
const TXCSV = path.join(OUT_DIR, 'throughput-txs.csv');
const HEADER =
    'iso,network,chainId,workload,experiment,blockPeriodS,target,maxInflight,' +
    'submitted,mined,errors,durationS,achievedTps,latMinMs,latMedMs,latP95Ms,latMaxMs,' +
    'firstBlock,lastBlock,blocksUsed,avgTxPerBlock,avgGasPerBlock,gasLimit,params\n';
const TXHEADER = 'iso,workload,i,submitMs,minedMs,latencyMs,block,gasUsed,ok\n';

function appendRow(file, header, cols) {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, header);
    fs.appendFileSync(file, cols.join(',') + '\n');
}

function pct(sorted, p) {
    if (!sorted.length) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
}
function stats(arr) {
    const s = [...arr].sort((a, b) => a - b);
    return {
        min: s[0] ?? 0,
        med: pct(s, 50),
        p95: pct(s, 95),
        max: s[s.length - 1] ?? 0,
    };
}

function keyHash(address) {
    return ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address'], [address])
    );
}

/**
 * Build (and send) an addClaim tx for a subject identity with an explicit nonce
 * so many can be pipelined from the single issuer wallet. Mirrors the signing in
 * scripts/claims/add-claim.js. Returns the pending tx.
 */
async function sendAddClaim(subjectIdentity, issuerContract, issuerWallet, topicStr, data, nonce) {
    const issuer = await issuerContract.getAddress();
    const identity = await subjectIdentity.getAddress();
    const topic = ethers.id(topicStr);
    const dataBytes = ethers.toUtf8Bytes(data);
    const signature = await issuerWallet.signMessage(
        ethers.getBytes(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address', 'uint256', 'bytes'],
                    [identity, topic, dataBytes]
                )
            )
        )
    );
    return subjectIdentity
        .connect(issuerWallet)
        .addClaim(topic, 1, issuer, signature, dataBytes, '', {
            nonce,
            gasLimit: GAS_LIMIT_OP,
            gasPrice: 0, // free-gas chain; fully-specified tx avoids estimate/fee RPCs
        });
}

/**
 * Open-loop streaming driver. `makeAndSend(i)` must send tx #i (assigning its own
 * nonce) and resolve to the pending tx. Keeps up to MAX_INFLIGHT in flight until
 * TARGET have been submitted, awaits all, and records per-tx submit/mined times.
 * Returns { records, t0 } where each record is {i, submitMs, minedMs, latencyMs,
 * block, gasUsed, ok}. Times are ms relative to t0 (first submit).
 */
async function stream(makeAndSend) {
    const records = [];
    let submitted = 0;
    const inflight = new Set();
    const t0 = performance.now();

    const launch = i => {
        const submitMs = performance.now() - t0;
        const p = (async () => {
            const tx = await makeAndSend(i);
            const rc = await tx.wait();
            const minedMs = performance.now() - t0;
            records.push({
                i, submitMs, minedMs, latencyMs: minedMs - submitMs,
                block: rc.blockNumber, gasUsed: Number(rc.gasUsed), ok: rc.status === 1,
            });
        })().catch(err => {
            const minedMs = performance.now() - t0;
            records.push({
                i, submitMs, minedMs, latencyMs: minedMs - submitMs,
                block: -1, gasUsed: 0, ok: false, err: err.shortMessage || err.message,
            });
        }).finally(() => inflight.delete(p));
        inflight.add(p);
    };

    while (submitted < TARGET || inflight.size) {
        while (submitted < TARGET && inflight.size < MAX_INFLIGHT) launch(submitted++);
        if (inflight.size) await Promise.race(inflight);
    }
    return { records, t0 };
}

/** Scan blocks firstBlock..lastBlock and return per-block tx counts + gas. */
async function scanBlocks(firstBlock, lastBlock) {
    let txTotal = 0, gasTotal = 0, blocks = 0;
    for (let b = firstBlock; b <= lastBlock; b++) {
        const blk = await ethers.provider.getBlock(b);
        if (!blk) continue;
        blocks++;
        txTotal += blk.transactions.length;
        gasTotal += Number(blk.gasUsed);
    }
    return {
        blocks,
        avgTxPerBlock: blocks ? txTotal / blocks : 0,
        avgGasPerBlock: blocks ? gasTotal / blocks : 0,
    };
}

/** Median block period from the last few blocks (sanity / reporting). */
async function measureBlockPeriod() {
    const head = await ethers.provider.getBlockNumber();
    const n = Math.min(10, head);
    if (n < 2) return 0;
    const ts = [];
    for (let b = head - n + 1; b <= head; b++) {
        const blk = await ethers.provider.getBlock(b);
        if (blk) ts.push(Number(blk.timestamp));
    }
    const deltas = [];
    for (let i = 1; i < ts.length; i++) deltas.push(ts[i] - ts[i - 1]);
    return stats(deltas).med;
}

function recordSummary(experiment, blockPeriodS, agg, params = {}) {
    appendRow(CSV, HEADER, [
        new Date().toISOString(),
        network.name,
        network.config.chainId ?? '-',
        WORKLOAD,
        experiment,
        blockPeriodS,
        TARGET,
        MAX_INFLIGHT,
        agg.submitted,
        agg.mined,
        agg.errors,
        agg.durationS.toFixed(3),
        agg.achievedTps.toFixed(2),
        agg.lat.min.toFixed(1),
        agg.lat.med.toFixed(1),
        agg.lat.p95.toFixed(1),
        agg.lat.max.toFixed(1),
        agg.firstBlock,
        agg.lastBlock,
        agg.blocksUsed,
        agg.avgTxPerBlock.toFixed(2),
        agg.avgGasPerBlock.toFixed(0),
        GAS_LIMIT_OP,
        JSON.stringify(params).replaceAll(',', ';'),
    ]);
}

async function main() {
    const bp = await measureBlockPeriod();
    console.log(`network=${network.name} chainId=${network.config.chainId} ` +
        `workload=${WORKLOAD} target=${TARGET} inflight=${MAX_INFLIGHT} blockPeriod~${bp}s`);

    // Besu's eth_estimateGas under-estimates calls that DELEGATECALL (all T-REX
    // proxies): the EVM's 63/64 gas-forwarding rule means the estimate is a hair
    // too low, so the inner call runs out of gas while the outer frame still has
    // some left -> the tx reverts with gasUsed < gasLimit. Buffer every estimate
    // used during setup. The streamed measurement txs pass an explicit gasLimit,
    // so they bypass estimation and are unaffected by this.
    if (network.name !== 'hardhat') {
        const _estimate = ethers.provider.estimateGas.bind(ethers.provider);
        const GAS_CAP = 29_000_000n;
        ethers.provider.estimateGas = async tx => {
            const est = await _estimate(tx);
            const buffered = (est * 3n) / 2n + 50_000n; // 1.5x + fixed pad
            return buffered > GAS_CAP ? GAS_CAP : buffered;
        };
    }

    const signers = await ethers.getSigners();
    if (signers.length < 3) throw new Error('need >=3 funded signers');

    // Multi-endpoint streaming: submit the load across ALL validators' RPC
    // endpoints (BESU_RPC_NODES, comma-separated) so every rotating QBFT proposer
    // has transactions in its own mempool. Submitting to a single node leaves the
    // other proposers building empty blocks (mempool-propagation lag) and QBFT
    // round-changing under load, which throttles sustained throughput. Falls back
    // to the single BESU_RPC if the list is unset.
    const NODE_URLS = (process.env.BESU_RPC_NODES || process.env.BESU_RPC || 'http://127.0.0.1:8545')
        .split(',').map(s => s.trim()).filter(Boolean);
    const providers = NODE_URLS.map(u => {
        const p = new ethers.JsonRpcProvider(u);
        p.pollingInterval = 400; // default 4s would lag receipt detection on a 2s chain
        return p;
    });
    const MNEMONIC = process.env.BESU_MNEMONIC
        || 'test test test test test test test test test test test junk';
    // A funded signer as a raw wallet bound to a specific node (same key as
    // ethers.getSigners()[accountIndex], derived from the genesis mnemonic).
    const rawWallet = (accountIndex, nodeIndex) => new ethers.Wallet(
        ethers.HDNodeWallet.fromPhrase(MNEMONIC, undefined, `m/44'/60'/0'/0/${accountIndex}`).privateKey,
        providers[nodeIndex % providers.length]
    );
    console.log(`[*] streaming across ${providers.length} RPC endpoint(s): ${NODE_URLS.join(', ')}`);

    // ---- workload-specific setup + a per-tx sender ----------------------
    let makeAndSend;          // (i) => pending tx (E-TPS)
    let sendOne;              // (n) => pending tx, explicit nonce (E-LAT)

    if (WORKLOAD === 'transfer') {
        // 0-value self-transfers spread across all funded signers, each bound to a
        // node (round-robin) so submission reaches every proposer's mempool.
        const wallets = signers.map((_, a) => rawWallet(a, a));
        const base = await Promise.all(
            wallets.map(w => w.provider.getTransactionCount(w.address, 'pending'))
        );
        const nonces = base.slice();
        makeAndSend = i => {
            const a = i % wallets.length;
            const w = wallets[a];
            return w.sendTransaction({ to: w.address, value: 0, nonce: nonces[a]++, gasLimit: 21000, gasPrice: 0 });
        };
        main._latProvider = wallets[0].provider;
        main._latAddress = wallets[0].address;
        sendOne = n => wallets[0].sendTransaction({ to: wallets[0].address, value: 0, nonce: n, gasLimit: 21000, gasPrice: 0 });
    } else if (WORKLOAD === 'addClaim') {
        // Full suite + N independent trusted ClaimIssuers ("institutions"). Each
        // issuer j has its own signing account (signers[2+j]), its own subject
        // identity (owned by signers[2+N+j]) on which it holds a CLAIM key, and
        // writes CERTIFICATE claims to it. Because the N issuers sign from N
        // distinct accounts, issuance is NOT serialised on a single nonce -> the
        // aggregate submission can fill blocks to the gas ceiling, so E-TPS
        // measures the consortium's capacity rather than one client's send rate.
        console.log('[*] deploying TREX suite on the consortium ...');
        const suite = await deployFullTREXSuiteFixture();
        const { deployerWallet, identityFactory, trustedIssuersRegistry } = suite;

        const topicStr = CLAIM_TOPICS_OBJ.CERTIFICATE;
        // Reserve signers 0 (deployer) and 1 (agent). Each issuer needs a signing
        // account and a distinct subject-owner account -> 2 signers per issuer.
        const N = Math.max(1, Math.min(N_ISSUERS, Math.floor((signers.length - 2) / 2)));
        if (N < N_ISSUERS) {
            console.warn(`[!] N_ISSUERS capped at ${N} (need 2 funded signers per issuer; have ${signers.length})`);
        }
        console.log(`[*] onboarding ${N} parallel issuers (each: ClaimIssuer + subject) ...`);

        const issuers = [];
        for (let j = 0; j < N; j++) {
            const wallet = signers[2 + j];
            const subjectOwner = signers[2 + N + j];
            const { claimIssuerContract } = await deployClaimIssuer(
                trustedIssuersRegistry, wallet, deployerWallet
            );
            const subject = await deployIdentity(
                identityFactory, subjectOwner.address, `subject-${j}`, deployerWallet
            );
            // Authorise this issuer's CLAIM_SIGNER (purpose 3) key on its subject.
            await addKeyToIdentity(subject, subjectOwner, wallet, 3, 1);
            issuers.push({ wallet, ci: claimIssuerContract, subject, baseNonce: 0, sent: 0 });
        }
        // Bind each issuer to a node (round-robin) and snapshot its post-setup
        // nonce on THAT node; assign sequential nonces per issuer.
        for (let j = 0; j < issuers.length; j++) {
            const iss = issuers[j];
            iss.sendWallet = rawWallet(2 + j, j);
            iss.provider = iss.sendWallet.provider;
            iss.baseNonce = await iss.provider.getTransactionCount(iss.wallet.address, 'pending');
        }
        console.log(`[*] ${N} issuers ready, each authorised on its subject`);

        const baseData = 'reg:2024/0001;course:1234;date:2024-07-01;grade:18';
        makeAndSend = i => {
            const iss = issuers[i % N];
            const nonce = iss.baseNonce + (iss.sent++);
            return sendAddClaim(iss.subject, iss.ci, iss.sendWallet, topicStr, `${baseData};v${i}`, nonce);
        };
        // E-LAT (sequential, unloaded) uses issuer 0 on its node; nonce resolved
        // live below since E-TPS advanced it.
        sendOne = async n => sendAddClaim(
            issuers[0].subject, issuers[0].ci, issuers[0].sendWallet, topicStr, `${baseData};lat${n}`, n
        );
        main._latProvider = issuers[0].provider;
        main._latAddress = issuers[0].wallet.address;
    } else {
        throw new Error(`unknown WORKLOAD=${WORKLOAD} (use addClaim|transfer)`);
    }

    // ====================================================================
    // E-TPS: sustained streaming throughput
    // ====================================================================
    console.log(`[*] E-TPS: streaming ${TARGET} ${WORKLOAD} txs (<=${MAX_INFLIGHT} in flight) ...`);
    const { records } = await stream(makeAndSend);
    for (const r of records) {
        appendRow(TXCSV, TXHEADER, [
            new Date().toISOString(), WORKLOAD, r.i,
            r.submitMs.toFixed(1), r.minedMs.toFixed(1), r.latencyMs.toFixed(1),
            r.block, r.gasUsed, r.ok ? 1 : 0,
        ]);
    }
    const ok = records.filter(r => r.ok);
    const errors = records.length - ok.length;
    const mined = ok.length;
    const minedBlocks = ok.map(r => r.block).filter(b => b >= 0);
    const firstBlock = minedBlocks.length ? Math.min(...minedBlocks) : 0;
    const lastBlock = minedBlocks.length ? Math.max(...minedBlocks) : 0;
    // Sustained window: first submit -> last mined.
    const firstSubmit = Math.min(...records.map(r => r.submitMs));
    const lastMined = Math.max(...ok.map(r => r.minedMs));
    const durationS = Math.max(1e-6, (lastMined - firstSubmit) / 1000);
    const blk = await scanBlocks(firstBlock, lastBlock);
    const tpsAgg = {
        submitted: records.length,
        mined,
        errors,
        durationS,
        achievedTps: mined / durationS,
        lat: stats(ok.map(r => r.latencyMs)), // loaded latency (includes queueing)
        firstBlock, lastBlock,
        blocksUsed: blk.blocks,
        avgTxPerBlock: blk.avgTxPerBlock,
        avgGasPerBlock: blk.avgGasPerBlock,
    };
    recordSummary('E-TPS', bp, tpsAgg, { note: 'loaded latency incl. queueing' });
    console.log(
        `[✓] E-TPS: mined ${mined}/${records.length} (${errors} err) in ${durationS.toFixed(1)}s ` +
        `-> ${tpsAgg.achievedTps.toFixed(1)} tx/s | ${blk.avgTxPerBlock.toFixed(1)} tx/block, ` +
        `${(blk.avgGasPerBlock / 1e6).toFixed(1)}M gas/block across blocks ${firstBlock}..${lastBlock}`
    );
    if (errors) {
        const sample = records.find(r => !r.ok && r.err);
        if (sample) console.warn(`    [!] first error: ${sample.err}`);
    }

    // ====================================================================
    // E-LAT: unloaded end-to-end issuance latency (sequential)
    // ====================================================================
    console.log(`[*] E-LAT: ${LAT_REPS} sequential ${WORKLOAD} txs (unloaded) ...`);
    // Resolve a fresh nonce base now that E-TPS advanced the sender.
    const n0 = await main._latProvider.getTransactionCount(main._latAddress, 'pending');
    const latencies = [];
    for (let r = 0; r < LAT_REPS; r++) {
        const t0 = performance.now();
        const tx = await sendOne(n0 + r);
        await tx.wait();
        latencies.push(performance.now() - t0);
    }
    const latAgg = {
        submitted: LAT_REPS, mined: LAT_REPS, errors: 0,
        durationS: latencies.reduce((a, b) => a + b, 0) / 1000,
        achievedTps: 0,
        lat: stats(latencies),
        firstBlock: 0, lastBlock: 0, blocksUsed: 0, avgTxPerBlock: 0, avgGasPerBlock: 0,
    };
    recordSummary('E-LAT', bp, latAgg, { note: 'unloaded sequential' });
    console.log(
        `[✓] E-LAT: min ${latAgg.lat.min.toFixed(0)} / median ${latAgg.lat.med.toFixed(0)} / ` +
        `p95 ${latAgg.lat.p95.toFixed(0)} / max ${latAgg.lat.max.toFixed(0)} ms (block period ~${bp}s)`
    );

    // Raw providers poll for blocks; release them so the process can exit.
    for (const p of providers) p.destroy();

    console.log(`\nDone. Summary -> ${CSV}  (per-tx -> ${TXCSV})`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
