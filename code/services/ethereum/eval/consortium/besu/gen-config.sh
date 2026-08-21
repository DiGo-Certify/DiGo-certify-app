#!/usr/bin/env bash
#
# Generate the QBFT genesis, four validator keys, and static-nodes.json from the
# provisioned node IPs. Requires Docker (runs the Besu image) and Node (derives
# the prefunded accounts via the project's ethers).
#
# Prereq: provision-region.sh + collect-nodes.sh have produced nodes.env.
# Output: besu/out/{genesis.json, static-nodes.json, node<idx>/key, node<idx>/key.pub}
#
set -euo pipefail
cd "$(dirname "$0")/.."
source ./config.env
source ./nodes.env

here="$(pwd)/besu"
out="$here/out"
rm -rf "$out"; mkdir -p "$out"

indices="$(grep -oE '^NODE[0-9]+_IP' nodes.env | grep -oE '[0-9]+' | sort -n | uniq)"
n_nodes="$(echo "$indices" | wc -w | tr -d ' ')"
echo "[*] Generating QBFT config for $n_nodes validators (block period ${BLOCK_PERIOD}s, chainId ${CHAIN_ID})"

# 1. Prefunded accounts (run from the ethereum dir so it resolves ethers).
echo "[*] Deriving $PREFUND_COUNT prefunded accounts from the mnemonic ..."
( cd ../.. && MNEMONIC="$MNEMONIC" PREFUND_COUNT="$PREFUND_COUNT" \
    node eval/consortium/besu/derive-accounts.js ) > "$here/alloc.json"

# 2. Assemble the generate-blockchain-config input.
req_timeout=$(( BLOCK_PERIOD * 2 )); [[ $req_timeout -lt 4 ]] && req_timeout=4
cat > "$here/qbft-config.json" <<JSON
{
  "genesis": {
    "config": {
      "chainId": ${CHAIN_ID},
      "londonBlock": 0,
      "shanghaiTime": 0,
      "zeroBaseFee": true,
      "qbft": {
        "blockperiodseconds": ${BLOCK_PERIOD},
        "epochlength": 30000,
        "requesttimeoutseconds": ${req_timeout}
      }
    },
    "nonce": "0x0",
    "timestamp": "0x0",
    "gasLimit": "${GAS_LIMIT}",
    "difficulty": "0x1",
    "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
    "coinbase": "0x0000000000000000000000000000000000000000",
    "alloc": $(cat "$here/alloc.json")
  },
  "blockchain": {
    "nodes": { "generate": true, "count": ${n_nodes} }
  }
}
JSON

# 3. Run Besu to generate genesis + node keys.
echo "[*] Running ${BESU_IMAGE} operator generate-blockchain-config ..."
docker run --rm -u "$(id -u):$(id -g)" -v "$here:/data" "$BESU_IMAGE" \
    operator generate-blockchain-config \
    --config-file=/data/qbft-config.json \
    --to=/data/out \
    --private-key-file-name=key >/dev/null

# 3b. Besu's generate-blockchain-config emits the genesis WITHOUT the alloc it was
#     given; merge the prefunded accounts back in so harness signers are funded.
python3 - "$out/genesis.json" "$here/alloc.json" <<'PY'
import json, sys
gp, ap = sys.argv[1], sys.argv[2]
g = json.load(open(gp)); g['alloc'] = json.load(open(ap))
json.dump(g, open(gp, 'w'), indent=2)
PY

# 4. Map the generated key dirs (named by validator address) to node1..N and
#    build static-nodes.json from the local IPs.
mapfile -t keydirs < <(find "$out/keys" -mindepth 1 -maxdepth 1 -type d | sort)
if [[ ${#keydirs[@]} -ne $n_nodes ]]; then
    echo "[!] Expected $n_nodes key dirs, found ${#keydirs[@]}" >&2; exit 1
fi

static="$out/static-nodes.json"
echo "[" > "$static"
i=0
first=1
for idx in $indices; do
    ip_var="NODE${idx}_IP"; ip="${!ip_var}"
    kd="${keydirs[$i]}"
    pub="$(tr -d '\n' < "$kd/key.pub")"; pub="${pub#0x}"
    mkdir -p "$out/node${idx}"
    cp "$kd/key" "$out/node${idx}/key"
    cp "$kd/key.pub" "$out/node${idx}/key.pub"
    [[ $first -eq 0 ]] && echo "," >> "$static"
    printf '  "enode://%s@%s:30303"' "$pub" "$ip" >> "$static"
    first=0
    echo "[+] node${idx}  ip=${ip}  enode=${pub:0:16}…"
    i=$((i + 1))
done
printf '\n]\n' >> "$static"

echo "[✓] Wrote $out/genesis.json and $static"
echo "[i] Deploy with: ansible-playbook -i ansible/inventory.ini ansible/site.yml"
