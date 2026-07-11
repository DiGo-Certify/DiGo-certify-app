/*
 * eval/measure.js — per-operation microbenchmark harness (RQ1, RQ2, RQ4)
 *
 * Run from code/services/ethereum:
 *   REPS=30 ETH_USD=3000 npx hardhat run eval/measure.js
 *   REPS=30 npx hardhat run eval/measure.js --network sepolia   # latency
 *
 * It measures gas + cost + latency for each certificate life-cycle operation
 * and appends one CSV row per run to eval/results/measure.csv.
 *
 * STATUS: every life-cycle operation in the catalog is wired — deployIdentity,
 * addClaim (cold + warm), addKeyToIdentity, addTrustedIssuer, deployClaimIssuer,
 * the contract deployments, and the E4 validation read path. See the "Operation
 * catalog" section of ../README.md for the catalog.
 *
 * Gas is the primary, deterministic metric (identical on any EVM chain). On the
 * local network the cost columns are ~0 and are computed in post-processing from
 * gasUsed using the scenario grid in ../README.md (Experiments, E2); on a
 * testnet the cost columns are meaningful.
 */

const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const { ethers, network } = hre;

// Reuse the project's test fixtures for a fresh, funded setup on the local net.
const { deployFullTREXSuiteFixture } = require('../test/fixtures');
const {
    contracts: { ClaimIssuer, Identity },
} = require('@onchain-id/solidity');

// Real operation implementations.
const { deployIdentity } = require('../scripts/identities/deploy-identity');
const { deployClaimIssuer } = require('../scripts/claimIssuer/deploy-claim-issuer');
const { addKeyToIdentity } = require('../scripts/claimIssuer/addKeyToIdentity');
const { CLAIM_TOPICS, CLAIM_TOPICS_OBJ } = require('../scripts/claims/claimTopics');
const hash = require('../scripts/utils/encryption/hash');
// const { addClaim } = require('../scripts/claims/add-claim'); // see buildClaimTx note
const { getClaimsByTopic } = require('../scripts/claims/getClaimsByTopic');

const REPS = Number(process.env.REPS ?? 30);
const DEPLOY_REPS = Number(process.env.DEPLOY_REPS ?? 3); // deploy gas is deterministic
const ETH_USD = Number(process.env.ETH_USD ?? 3000);
const OUT_DIR = path.join(__dirname, 'results');
const CSV = path.join(OUT_DIR, 'measure.csv');
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

/** Append one CSV row from a raw gas figure (used for composites too). */
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

/** Compute cost from a receipt and append one CSV row. */
async function recordReceipt(operation, run, receipt, latencyMs, params = {}) {
    await recordGas(
        operation, run, receipt.gasUsed, receipt.gasPrice, latencyMs, receipt.blockNumber, params
    );
}

/**
 * Measure a state-changing operation over REPS runs.
 * @param {string} operation  label for the CSV
 * @param {(run:number)=>Promise<object>} mkTx  returns a *fresh* pending tx each
 *        run (vary inputs so one-shot ops still yield a distribution)
 * @param {(run:number)=>object} [params]  extra params to record per run
 */
async function measure(operation, mkTx, params = () => ({})) {
    for (let run = 0; run < REPS; run++) {
        const t0 = performance.now();
        const tx = await mkTx(run); // sends the tx
        const receipt = await tx.wait(); // 1 confirmation
        await recordReceipt(operation, run, receipt, performance.now() - t0, params(run));
    }
    console.log(`[✓] ${operation}: ${REPS} runs -> ${CSV}`);
}

/**
 * Measure a deployment (gas + bytecode size). Pass a factory-style deploy fn
 * returning a freshly deployed contract.
 */
async function measureDeploy(operation, deployFn, reps = DEPLOY_REPS) {
    for (let run = 0; run < reps; run++) {
        const t0 = performance.now();
        const contract = await deployFn(run);
        const receipt = await contract.deploymentTransaction().wait();
        const latencyMs = performance.now() - t0;
        const code = await ethers.provider.getCode(await contract.getAddress());
        const bytecodeBytes = (code.length - 2) / 2; // strip 0x, 2 hex chars/byte
        await recordReceipt(operation, run, receipt, latencyMs, { bytecodeBytes });
    }
    console.log(`[✓] ${operation}: ${reps} runs -> ${CSV}`);
}

/**
 * Measure a read-only op (0 gas to caller): record its estimated compute gas and
 * the RPC round-trip latency.
 */
async function measureView(operation, estimateFn, callFn) {
    const est = await estimateFn();
    for (let run = 0; run < REPS; run++) {
        const t0 = performance.now();
        await callFn();
        const latencyMs = performance.now() - t0;
        appendRow([
            new Date().toISOString(), network.name, operation, run,
            est.toString(), '0', '0', '0', latencyMs.toFixed(1), '-', '{}',
        ]);
    }
    console.log(`[✓] ${operation} (view): ${REPS} runs -> ${CSV}`);
}

/**
 * Build (off-chain) and send the on-chain `addClaim` transaction, returning the
 * pending tx so its gas can be measured. This mirrors scripts/claims/add-claim.js
 * exactly (the only gas-consuming step is identity.addClaim); we replicate it
 * here because add-claim.js returns the ClaimAdded event args, not the tx.
 * Keep in sync with add-claim.js if that file changes.
 */
async function buildClaimTx(
    receiverIdentity,
    claimIssuerContract,
    claimIssuerWallet,
    claimTopic,
    claimData,
    scheme = 1, // ECDSA
    uri = ''
) {
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
    console.log(`network=${network.name} reps=${REPS}`);

    // ---- Shared setup (fresh suite + identity factory) -------------------
    const suite = await deployFullTREXSuiteFixture();
    const { deployerWallet, identityFactory, trustedIssuersRegistry } = suite;

    // ====================================================================
    // E1 — per-operation gas microbenchmarks
    // ====================================================================

    // --- deployIdentity (fresh subject + salt each run; deployer pays) ----
    await measure(
        'deployIdentity',
        async run => {
            const subject = ethers.Wallet.createRandom().address;
            const salt = `student-${run}-${Math.floor(performance.now())}`;
            return identityFactory.connect(deployerWallet).createIdentity(subject, salt);
        },
        run => ({ run })
    );

    // --- addClaim (COLD and WARM) ---------------------------------------
    // Setup: one trusted claim issuer, reused across runs.
    const signers = await ethers.getSigners();
    const claimIssuerWallet = signers[2]; // signers[0]=deployer, [1]=agent (fixture)
    const { claimIssuerContract } = await deployClaimIssuer(
        trustedIssuersRegistry,
        claimIssuerWallet,
        deployerWallet
    );

    const claimTopic = CLAIM_TOPICS_OBJ.CERTIFICATE;
    // A certificate-sized payload; vary length to study gas vs. data size.
    const claimData = 'reg:2024/0001;course:1234;date:2024-07-01;grade:18';

    // COLD: fresh identity (+ issuer key authorised) per run, first write to a
    // (issuer, topic) slot -> emits ClaimAdded. Bounded by the number of funded
    // signers on the local network (Hardhat gives 20 by default).
    const available = signers.length - 3; // reserve 0,1,2
    const coldRuns = Math.min(REPS, Math.max(available, 0));
    if (coldRuns < REPS) {
        console.warn(
            `[!] addClaim:cold capped at ${coldRuns} runs (only ${available} funded ` +
            `student signers). Increase accounts in hardhat.config.js for more.`
        );
    }
    const identities = [];
    for (let run = 0; run < coldRuns; run++) {
        const studentWallet = signers[3 + run];
        const identity = await deployIdentity(
            identityFactory,
            studentWallet.address,
            `student-cold-${run}`,
            deployerWallet
        );
        // Authorise the issuer's CLAIM_SIGNER key on the student identity.
        await addKeyToIdentity(identity, studentWallet, claimIssuerWallet, 3, 1);

        const t0 = performance.now();
        const tx = await buildClaimTx(
            identity, claimIssuerContract, claimIssuerWallet, claimTopic, claimData
        );
        const receipt = await tx.wait();
        await recordReceipt('addClaim:cold', run, receipt, performance.now() - t0, {
            bytes: claimData.length,
        });
        identities.push({ identity, studentWallet });
    }
    console.log(`[✓] addClaim:cold: ${coldRuns} runs -> ${CSV}`);

    // WARM: rewrite the same (issuer, topic) on an existing identity -> emits
    // ClaimChanged (this is also the certificate-update path). Not signer-bound.
    const warm = identities[0];
    if (warm) {
        for (let run = 0; run < REPS; run++) {
            const t0 = performance.now();
            const tx = await buildClaimTx(
                warm.identity,
                claimIssuerContract,
                claimIssuerWallet,
                claimTopic,
                `${claimData};v${run + 1}` // new content, same claimId => update
            );
            const receipt = await tx.wait();
            await recordReceipt('addClaim:warm', run, receipt, performance.now() - t0, {
                bytes: claimData.length,
            });
        }
        console.log(`[✓] addClaim:warm: ${REPS} runs -> ${CSV}`);
    }

    // --- addKeyToIdentity (fresh CLAIM_SIGNER key each run, on an existing
    // identity; addKeyToIdentity returns event args, so we send addKey here) ---
    if (identities.length) {
        const { identity, studentWallet } = identities[0];
        await measure(
            'addKeyToIdentity',
            () =>
                identity
                    .connect(studentWallet) // owner holds the management key
                    .addKey(keyHash(ethers.Wallet.createRandom().address), 3, 1) // CLAIM_SIGNER, ECDSA
        );
    }

    // --- addTrustedIssuer (fresh suite to respect the 50-issuer cap) ------
    const topics = CLAIM_TOPICS.map(t => ethers.id(t));
    {
        const s = await deployFullTREXSuiteFixture();
        const runs = Math.min(REPS, 45); // registry rejects the 50th issuer
        if (runs < REPS) console.warn(`[!] addTrustedIssuer capped at ${runs} (registry limit 50)`);
        for (let run = 0; run < runs; run++) {
            const addr = ethers.Wallet.createRandom().address;
            const t0 = performance.now();
            const receipt = await (
                await s.trustedIssuersRegistry
                    .connect(s.deployerWallet)
                    .addTrustedIssuer(addr, topics)
            ).wait();
            await recordReceipt('addTrustedIssuer', run, receipt, performance.now() - t0, {
                topics: topics.length,
            });
        }
        console.log(`[✓] addTrustedIssuer: ${runs} runs -> ${CSV}`);
    }

    // --- deployClaimIssuer (composite: deploy ClaimIssuer + self claim key +
    // addTrustedIssuer; mirrors scripts/claimIssuer/deploy-claim-issuer.js) ---
    {
        const s = await deployFullTREXSuiteFixture();
        const runs = Math.min(REPS, 45);
        if (runs < REPS) console.warn(`[!] deployClaimIssuer capped at ${runs} (registry limit 50)`);
        for (let run = 0; run < runs; run++) {
            const w = s.deployerWallet; // funded; becomes the issuer's management key
            const t0 = performance.now();
            const ci = await new ethers.ContractFactory(
                ClaimIssuer.abi, ClaimIssuer.bytecode, w
            ).deploy(w.address);
            await ci.waitForDeployment();
            const rDeploy = await ci.deploymentTransaction().wait();
            const rKey = await (await ci.connect(w).addKey(keyHash(w.address), 3, 1)).wait();
            const rTI = await (
                await s.trustedIssuersRegistry.connect(w).addTrustedIssuer(await ci.getAddress(), topics)
            ).wait();
            const total = rDeploy.gasUsed + rKey.gasUsed + rTI.gasUsed;
            await recordGas('deployClaimIssuer', run, total, rTI.gasPrice, performance.now() - t0,
                rTI.blockNumber, { parts: 'deploy+addKey+addTrustedIssuer' });
        }
        console.log(`[✓] deployClaimIssuer: ${runs} runs -> ${CSV}`);
    }

    // ====================================================================
    // E1 — deployments (gas + bytecode size; bytecode vs. EIP-170 = 24576 B)
    // ====================================================================
    {
        const [w] = await ethers.getSigners();
        // T-REX implementation contracts (compiled locally, no constructor args)
        for (const name of [
            'Token', 'ClaimTopicsRegistry', 'TrustedIssuersRegistry',
            'IdentityRegistry', 'IdentityRegistryStorage', 'ModularCompliance',
        ]) {
            await measureDeploy(`deploy:${name}`, () => ethers.deployContract(name, w));
        }
        // OnchainID implementations (from @onchain-id/solidity artifacts)
        await measureDeploy('deploy:ClaimIssuer', () =>
            new ethers.ContractFactory(ClaimIssuer.abi, ClaimIssuer.bytecode, w).deploy(w.address));
        await measureDeploy('deploy:Identity', () =>
            new ethers.ContractFactory(Identity.abi, Identity.bytecode, w).deploy(w.address, true));
    }

    // ====================================================================
    // E4 — validation read path (0 gas to the caller; latency + view gas)
    // ====================================================================
    // Verification reads the subject's CERTIFICATE claims and re-computes the
    // digest of the presented certificate, comparing it against the stored one
    // (methodology: getClaimsByTopic + local SHA-256 compare). It is a read-only
    // op, so measureView records the estimated compute gas of the on-chain read
    // (getClaimIdsByTopic) plus the RPC round-trip latency of the full compare.
    // Reuse warm.identity, which holds a CERTIFICATE claim from the cold/warm
    // loops; derive the "presented" digest from the actually-stored claim so the
    // compare mirrors a genuine (matching) verification regardless of REPS.
    if (warm) {
        const stored = await getClaimsByTopic(warm.identity, claimTopic);
        const presentedDigest = stored.length
            ? hash(ethers.toUtf8String(stored[0].data)) // what a verifier recomputes
            : null;
        await measureView(
            'validate',
            () => warm.identity.getClaimIdsByTopic.estimateGas(ethers.id(claimTopic)),
            async () => {
                const claims = await getClaimsByTopic(warm.identity, claimTopic);
                // integrity check: recompute each stored certificate's digest and compare
                claims.some(c => hash(ethers.toUtf8String(c.data)) === presentedDigest);
            }
        );
    }

    console.log('\nDone. Summarise eval/results/measure.csv into the paper tables.');
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
