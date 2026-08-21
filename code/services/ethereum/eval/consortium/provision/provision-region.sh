#!/usr/bin/env bash
#
# Boot the validator VMs in the CURRENTLY SOURCED OpenStack region (no floating
# IPs; VMs use their tenant/local IPs). Ensures the security group exists, then
# creates NODES_PER_REGION servers named ${NAME_PREFIX}-${START_INDEX..}.
#
# Usage (from eval/consortium):
#   source ../../../../../openstack/openrc-tp.sh
#   START_INDEX=1 NODES_PER_REGION=2 ./provision/provision-region.sh
#   source ../../../../../openstack/openrc-al.sh
#   START_INDEX=3 NODES_PER_REGION=2 ./provision/provision-region.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."
source ./config.env

: "${OS_REGION_NAME:?Source a region openrc first (openstack/openrc-*.sh)}"
NAME_PREFIX="${NAME_PREFIX:-besu}"
START_INDEX="${START_INDEX:-1}"

echo "[*] Region: $OS_REGION_NAME  image=$IMAGE flavor=$FLAVOR net=$NET nodes=$NODES_PER_REGION"

# --- security group (idempotent) ---
if ! openstack security group show "$SECGROUP" >/dev/null 2>&1; then
    echo "[*] Creating security group $SECGROUP"
    openstack security group create "$SECGROUP" --description "Besu QBFT consortium" >/dev/null
    openstack security group rule create "$SECGROUP" --proto tcp --dst-port 22   --remote-ip "$ADMIN_CIDR"   >/dev/null
    openstack security group rule create "$SECGROUP" --proto tcp --dst-port 8545 --remote-ip "$HARNESS_CIDR" >/dev/null
    for cidr in $P2P_CIDRS; do
        openstack security group rule create "$SECGROUP" --proto tcp --dst-port 30303 --remote-ip "$cidr" >/dev/null
        openstack security group rule create "$SECGROUP" --proto udp --dst-port 30303 --remote-ip "$cidr" >/dev/null
    done
    openstack security group rule create "$SECGROUP" --proto icmp --remote-ip "$ADMIN_CIDR" >/dev/null || true
else
    echo "[=] Security group $SECGROUP already exists (leaving rules as-is)"
fi

out="nodes-${OS_REGION_NAME}.env"
: > "$out"

for i in $(seq 0 $((NODES_PER_REGION - 1))); do
    idx=$((START_INDEX + i))
    name="${NAME_PREFIX}-${idx}"

    if openstack server show "$name" >/dev/null 2>&1; then
        echo "[=] $name already exists"
    else
        echo "[*] Booting $name ..."
        openstack server create "$name" \
            --image "$IMAGE" --flavor "$FLAVOR" --key-name "$KEYPAIR" \
            --network "$NET" --security-group "$SECGROUP" \
            --wait >/dev/null
    fi

    # First IPv4 on the tenant network.
    ip="$(openstack server show "$name" -f value -c addresses \
          | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1)"
    if [[ -z "$ip" ]]; then
        echo "[!] Could not determine local IP for $name" >&2; exit 1
    fi

    echo "[+] $name -> $ip ($OS_REGION_NAME)"
    {
        echo "NODE${idx}_NAME=$name"
        echo "NODE${idx}_REGION=$OS_REGION_NAME"
        echo "NODE${idx}_IP=$ip"
    } >> "$out"
done

echo "[✓] Wrote $out"
