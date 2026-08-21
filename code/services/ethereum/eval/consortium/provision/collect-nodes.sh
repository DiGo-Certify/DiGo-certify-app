#!/usr/bin/env bash
#
# Merge the per-region node files (nodes-RegionT.env, nodes-RegionA.env) written
# by provision-region.sh into a single nodes.env, and generate the Ansible
# inventory. Node indices are 1..N in the order they were provisioned.
#
# Usage (from eval/consortium):  ./provision/collect-nodes.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."
source ./config.env

shopt -s nullglob
parts=(nodes-*.env)
if [[ ${#parts[@]} -eq 0 ]]; then
    echo "[!] No nodes-*.env files. Run provision-region.sh first." >&2; exit 1
fi

cat "${parts[@]}" > nodes.env
echo "[✓] Merged ${#parts[@]} region file(s) into nodes.env"
source ./nodes.env

# Collect indices present (NODE<idx>_IP).
indices="$(grep -oE '^NODE[0-9]+_IP' nodes.env | grep -oE '[0-9]+' | sort -n | uniq)"

mkdir -p ansible
inv="ansible/inventory.ini"
{
    echo "[besu]"
    for idx in $indices; do
        name_var="NODE${idx}_NAME"; ip_var="NODE${idx}_IP"
        echo "${!name_var} ansible_host=${!ip_var} node_index=${idx}"
    done
    echo
    echo "[besu:vars]"
    echo "ansible_user=${SSH_USER}"
    echo "ansible_ssh_private_key_file=${SSH_KEY}"
    echo "ansible_ssh_common_args='-o StrictHostKeyChecking=accept-new'"
} > "$inv"

echo "[✓] Wrote $inv:"
sed 's/^/    /' "$inv"
echo
echo "[i] Node table (index region ip):"
for idx in $indices; do
    r_var="NODE${idx}_REGION"; ip_var="NODE${idx}_IP"
    printf '    %s  %-10s %s\n' "$idx" "${!r_var}" "${!ip_var}"
done
