# On-Chain Layer — SCAR / DiGo Certify

This is the [Hardhat](https://hardhat.org/) project for the **on-chain layer** of
SCAR / DiGo Certify: an academic-certificate registry built by repurposing
**OnchainID** (ERC-734/735 self-sovereign identity) and **T-REX / ERC-3643**
(permissioned-token compliance) into a registry for identity-bound, accredited,
updatable, and privately verifiable credentials. Verification runs directly
against the ledger, so it does not depend on the client application.

Contracts are compiled with Solidity **0.8.17 / 0.8.20**, optimizer **enabled**,
**`runs = 200`** (see `hardhat.config.js`).

## Project structure

| Path | Contents |
|------|----------|
| `contracts/` | Solidity sources — the reused OnchainID / T-REX suite plus this project's additions (`contracts/config/FileStorage.sol`, `contracts/config/HashAnchor.sol`). |
| `scripts/` | The certificate life-cycle operations (deploy identities/issuers, add keys, add/read claims, encryption helpers) used by the app and the benchmarks. |
| `test/` | Hardhat/Mocha tests, including the negative/security tests in `test/security/` and the shared `test/fixtures.js`. |
| `eval/` | Benchmarking scripts (`measure.js`, `baseline.js`, `sweeps.js`, `latency.js`), their CSV output under `eval/results/`, and the committed Slither reports. |

## Getting started

```sh
npm install
npx hardhat compile
npx hardhat test
```

## Certificate life-cycle operations

The registry is driven by a small set of operations, each implemented as a script
under `scripts/`:

| Operation | Script / function | When |
|-----------|-------------------|------|
| Deploy OnchainID suite | `suites/OID.js` → `deployOnchainIDSuite` | once |
| Deploy T-REX suite | `suites/TREX.js` → `deployTrexSuite` | once |
| Deploy a claim issuer (institution) | `claimIssuer/deploy-claim-issuer.js` → `deployClaimIssuer` | per institution |
| Accredit an issuer (add to the trusted-issuer registry) | `addTrustedIssuer` (inside `deployClaimIssuer`) | per institution |
| Create a student identity | `identities/deploy-identity.js` → `deployIdentity` | per student |
| Authorise an issuer key on an identity | `claimIssuer/addKeyToIdentity.js` → `addKeyToIdentity` | per (student, issuer) |
| Issue a certificate (add claims) | `claims/add-claim.js` → `addClaim` | per claim |
| Update / revoke a certificate | `addClaim` again (emits `ClaimChanged`) | per correction |
| Validate a certificate | `claims/getClaimsByTopic.js` + `utils/encryption/hash.js` | per verification |

A claim is keyed by `claimId = keccak256(issuer, topic)`. Re-issuing the same
`(issuer, topic)` overwrites the existing claim in place (emitting `ClaimChanged`)
rather than adding a second one — this is the update/revocation path. Holding
several claims of the *same* topic on one identity therefore requires distinct
issuers.

## Benchmarks (`eval/`)

The `eval/` directory contains scripts that measure the gas, cost, scalability,
and latency of the operations above. They are plain `hardhat run` scripts and
append one CSV row per measurement under `eval/results/`.

Gas is deterministic (identical bytecode + input + state ⇒ identical gas on any
EVM chain), so gas is collected on the local Hardhat network. Fiat cost depends
on the gas price and exchange rate, so on the local network the cost columns are
≈0 and are meant to be computed in post-processing from `gasUsed`; against a real
network they are populated from the live fee data. Wall-clock latency is only
meaningful against a network with real block times (a testnet or private net).

### Scripts

- **`measure.js`** — per-operation gas, cost, and latency for each life-cycle
  operation, plus contract deployment gas and bytecode size (checked against the
  **EIP-170** 24 576-byte limit). Covers `deployIdentity`, `addClaim` (cold and
  warm), `addKeyToIdentity`, `addTrustedIssuer`, `deployClaimIssuer`, the contract
  deployments, and the validation read path.
- **`baseline.js`** — the same metrics for a minimal hash-anchoring registry
  (`contracts/config/HashAnchor.sol`: store a certificate's SHA-256 digest, verify
  by lookup). Useful as a lower-bound comparison for the identity + compliance
  layer.
- **`sweeps.js`** — scalability sweeps: issuer-resolution cost as the
  trusted-issuer registry grows, and `addClaim` gas + validation read latency as
  the number of claims on one identity grows. Writes raw and summarised
  (median/p95/min/max) CSVs.
- **`latency.js`** — end-to-end issuance and validation latency against a live
  network, intended for Sepolia (or a private net). Uses a single funded key.

### Running

All commands run from this directory (`code/services/ethereum`):

```sh
# Per-operation gas + cost, and contract sizes (local)   -> eval/results/measure.csv
REPS=30 ETH_USD=3000 npx hardhat run eval/measure.js

# Hash-anchoring baseline, same methodology (local)      -> eval/results/baseline.csv
REPS=30 ETH_USD=3000 npx hardhat run eval/baseline.js

# Scalability sweeps (local)
#   -> eval/results/sweep-*.csv (raw) + eval/results/sweep-*-summary.csv
REPS=10 STEP=5 MAX_CLAIMS=30 npx hardhat run eval/sweeps.js

# End-to-end latency on a live network (needs a funded key + RPC endpoint)
SEPOLIA_RPC=<your-rpc-url> PRIVATE_KEY=<funded-sepolia-key> \
  REPS=30 npx hardhat run eval/latency.js --network sepolia
```

Common environment variables: `REPS` (samples per operation), `ETH_USD` (rate
used for the cost columns), `STEP` / `MAX_ISSUERS` / `MAX_CLAIMS` (sweep sizes),
`CONFIRMATIONS` (confirmations to wait for in `latency.js`).

All output CSVs share the schema
`iso,network,operation,run,gasUsed,gasPriceGwei,costEth,costUsd,latencyMs,block,params`,
one row per run.

### Notes

- **Scripts append.** Each run appends to its CSV; archive or delete the old file
  first if you want a clean dataset.
- **Cold vs. warm storage.** The first write to a storage slot is far more
  expensive than a rewrite. `addClaim` on a new `(issuer, topic)` emits
  `ClaimAdded` (cold); repeating it emits `ClaimChanged` (warm, the update path).
  `measure.js` records both as `addClaim:cold` / `addClaim:warm`. It replicates
  the on-chain `addClaim` call in a local `buildClaimTx` helper because
  `scripts/claims/add-claim.js` returns the event args rather than the
  transaction — keep the two in sync if `add-claim.js` changes.
- **Cold-loop signer cap.** `measure.js`'s `addClaim:cold` loop needs one funded
  signer per run and reserves signers 0–2, so it caps at 17 with Hardhat's default
  20 accounts (it logs a warning when it caps below `REPS`). Add
  `accounts: { count: 33 }` to the `hardhat` network in `hardhat.config.js` for a
  full 30-run cold loop.
- **Trusted-issuer registry limit.** The T-REX `TrustedIssuersRegistry` reverts
  beyond 50 issuers (`require(_trustedIssuers.length < 50)`), so `sweeps.js` clamps
  the registry sweep to 49.
- **Claims-per-identity sweep.** Because `claimId = keccak256(issuer, topic)`, N
  claims under one topic need N distinct issuers; the sweep deploys real
  `ClaimIssuer` contracts, since `Identity.addClaim` validates external issuers
  on-chain via `isClaimValid`.
- **`deployFullTREXSuiteFixture` is local-only.** It fires some setup transactions
  without awaiting confirmation, which is fine on the auto-mining local net but
  races on a live network; `latency.js` therefore builds only what it needs and
  awaits every transaction.

## Static analysis (Slither)

Security-relevant static analysis is run with
[Slither](https://github.com/crytic/slither) over the contracts. Slither invokes
`npx hardhat compile` under the hood and writes its report to **stderr**, so
redirect it to a file:

```sh
# one-time: create a Python virtual environment with Slither
python3 -m venv local
source local/bin/activate
pip install slither-analyzer      # tested with Slither 0.11.5 on Python 3.13

# full detector report and a human-readable summary
slither . 2> eval/slither.txt
slither . --print human-summary 2> eval/slither-summary.txt
```

The core OnchainID / T-REX contracts come from audited upstream
implementations, so findings are triaged against this project's additions
(`contracts/config/FileStorage.sol`, `contracts/config/HashAnchor.sol`, and the
deployment scripts). The committed reference outputs are in `eval/slither.txt` and
`eval/slither-summary.txt`.

The negative tests under `test/security/` complement the static analysis by
asserting the access-control guards hold — e.g. a non-trusted issuer calling
`addClaim` reverts (the `isTrustedIssuer || isSelfSigner` guard in
`add-claim.js`), a claim written without an authorised key on the identity
reverts, and a claim with a bad issuer signature does not validate.

## Environment

Gas figures depend on the toolchain, so the pinned versions are worth recording
when comparing runs:

- Solidity **0.8.17 / 0.8.20**, optimizer **enabled**, **`runs = 200`**
  (`hardhat.config.js`).
- `hardhat ^2.22.5`, `ethers ^6.13.1`, `@onchain-id/identity-sdk ^1.7.1`,
  `@openzeppelin/contracts ^4.8.3`, `crypto-js ^4.2.0`.
- Networks: local `hardhat` (`chainId 31337`, default) for gas and sweeps;
  `sepolia` for latency (set `SEPOLIA_RPC` and `PRIVATE_KEY`).
