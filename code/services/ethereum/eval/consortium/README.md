# Consortium-chain evaluation (Besu QBFT, cross-region, local IPs)

Infrastructure to stand up a **4-validator Hyperledger Besu QBFT** consortium
network across two OpenStack regions and point the existing measurement harness
(`eval/measure.js`, `eval/throughput.js`) at it. This produces the real
permissioned-chain latency and sustained-throughput numbers that answer reviewer
comment #3 (the consortium setting was previously only bounded analytically).

No floating IPs are used: validators peer over their **tenant (local) IPs**, and
you reach the RPC endpoint over the VPN.

## Topology

- **QBFT, 4 validators**: Byzantine fault tolerant, `3f+1` with `f=1`. One
  validator per institution is the natural inter-institutional model.
- **2 in RegionT + 2 in RegionA**, peering over local IPs. Networks are
  region-local with **non-overlapping** CIDRs (`100.68.0.128/27` vs
  `100.64.10.192/27`), so this works **iff the two ranges route to each other**
  over your campus/VPN backbone. If they do not, either put all 4 in one region
  (`NODES_PER_REGION=4`, one openrc) or enable the optional WireGuard overlay
  (see `ansible/site.yml`, `wireguard` tag).
- Gas is EVM-deterministic and already measured on Hardhat; this run contributes
  **latency** and **measured sustained throughput** at a tuned block interval.

## OpenStack facts this is built against (both regions, discovered)

| Item | Value |
|------|-------|
| Regions | `RegionT` (openrc-t), `RegionA` (openrc-a); same project `PROJECT` |
| Tenant network | `n-PROJECT`: RegionT `100.68.0.128/27`, RegionA `100.64.10.192/27` |
| Image | `Ubuntu-Noble-Latest` (24.04 LTS; SSH user `ubuntu`) |
| Flavor | `t1.medium` (2 vCPU / 4 GB) default; `t1.large` for headroom |
| Keypair | `KEYNAME` in RegionT: **create/import one in RegionA too** (region-local) |

> ⚠️ **Credentials**: `openstack/openrc-*.sh` hold a plaintext API key. Keep that
> directory untracked and rotate the key if it was ever pushed. These scripts
> *source* the openrc; they never embed the secret.

## Ports (security group `besu-consortium`, created by the scripts)

| Port | Proto | From | Purpose |
|------|-------|------|---------|
| 22 | tcp | `ADMIN_CIDR` (your VPN) | SSH (Ansible) |
| 30303 | tcp+udp | `P2P_CIDRS` (the two tenant /27s) | Besu P2P (consensus) |
| 8545 | tcp | `HARNESS_CIDR` (your VPN) | JSON-RPC (harness only; never `0.0.0.0/0`) |

## Runbook

```bash
cd eval/consortium
cp config.env.example config.env && $EDITOR config.env    # flavor, keypair, CIDRs, mnemonic, block period

# 1. Provision (run once per region, with that region's openrc sourced)
source ../../../../../openstack/openrc-tp.sh
START_INDEX=1 NODES_PER_REGION=2 ./provision/provision-region.sh
source ../../../../../openstack/openrc-al.sh
START_INDEX=3 NODES_PER_REGION=2 ./provision/provision-region.sh

# 2. Collect the 4 local IPs -> nodes.env + ansible/inventory.ini
./provision/collect-nodes.sh

# 3. Generate QBFT genesis + 4 validator keys + static-nodes.json (needs Docker + Node)
./besu/gen-config.sh                # -> besu/out/{genesis.json, static-nodes.json, node1..4/key}

# 4. Deploy Besu to the 4 VMs and start consensus
ansible-playbook -i ansible/inventory.ini ansible/site.yml

# 5. Point the harness at node 1 (eval phase)
#    export BESU_RPC=http://<node1-local-ip>:8545  (over VPN)
```

## Mapping to the paper

- §5.1 Experimental Setup: add the consortium environment (Besu QBFT, 4
  validators across two regions, block period, gas limit `0x1C9C380` = 30M to
  match the analytical bound).
- §5.5 Latency & Throughput: replace the analytical throughput ceiling with the
  measured sustained-throughput curve; report cross-region issuance latency.
- Threats to Validity: even across two regions this is a controlled campus
  network; `tc netem` (see `ansible/site.yml`, `netem` tag) can emulate a wider
  RTT if you want a WAN sensitivity point.

## Caveats baked in

- `min-gas-price=0` (free gas): matches the "private chain = 0 cost" column.
- solc 0.8.20's default EVM target is **Shanghai** (`PUSH0`), so the genesis sets
  `shanghaiTime: 0`. If your Besu image predates Shanghai, bump the image or
  recompile the contracts with `evmVersion: "london"` for this run only (does not
  affect latency/throughput).
