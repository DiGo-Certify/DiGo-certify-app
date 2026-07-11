#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/code/config.json"
CODE_DIR="$SCRIPT_DIR/code"
ETH_DIR="$SCRIPT_DIR/code/services/ethereum"

LOCAL_RPC="http://127.0.0.1:8545/"
LOCAL_DEPLOYER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
LOCAL_DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

usage() {
    cat <<EOF
Usage:
  ./install.sh --local              Configure and deploy the local Hardhat demo.
  ./install.sh --local --rpc URL    Use a phone-reachable local RPC URL.
  ./install.sh                      Configure and deploy against a custom RPC.

For --local, start the chain first in another terminal:
  cd code/services/ethereum && npm run node
EOF
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "$1 is required but is not installed."
        exit 1
    fi
}

create_config_file() {
    cp "$CODE_DIR/config.example.json" "$CONFIG_FILE"
}

ensure_config_file() {
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "Config file not found. Creating $CONFIG_FILE..."
        create_config_file
    fi
}

update_deployer_config() {
    local address="$1"
    local private_key="$2"
    local rpc="$3"

    jq \
        --arg address "$address" \
        --arg key "$private_key" \
        --arg rpc "$rpc" \
        '.deployer.address = $address | .deployer.privateKey = $key | .rpc = $rpc' \
        "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
    mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
}

seed_local_institutions() {
    jq '
      .institutions = [
        {
          "institutionID": "3311",
          "wallet": {
            "address": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
            "privateKey": "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e"
          },
          "address": "",
          "abi": []
        },
        {
          "institutionID": "3117",
          "wallet": {
            "address": "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
            "privateKey": "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0"
          },
          "address": "",
          "abi": []
        },
        {
          "institutionID": "3111",
          "wallet": {
            "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            "privateKey": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
          },
          "address": "",
          "abi": []
        }
      ]' "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
    mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
}

check_rpc() {
    local rpc="$1"

    if ! command -v curl >/dev/null 2>&1; then
        echo "curl is not installed, skipping RPC reachability check."
        return
    fi

    if ! curl -s "$rpc" \
        -H "content-type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
        >/dev/null; then
        echo "Could not reach RPC at $rpc"
        echo "For local setup, start it first with: cd code/services/ethereum && npm run node"
        exit 1
    fi
}

install_dependencies() {
    echo "Installing app dependencies..."
    npm install --prefix "$CODE_DIR"

    echo "Installing Ethereum workspace dependencies..."
    npm install --prefix "$ETH_DIR"
}

deploy_contracts() {
    echo "Deploying registry contracts and institutional issuers..."
    npm run deploy --prefix "$CODE_DIR"
}

print_local_accounts() {
    cat <<EOF

Local demo accounts:
  Deployer / owner:
    $LOCAL_DEPLOYER_ADDRESS

  Accredited institutions:
    3311 -> 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
    3117 -> 0xdD2FD4581271e230360230F9337D5c0430Bf44C0
    3111 -> 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

  Suggested student wallet:
    0x90F79bf6EB2c4f870365E785982E1f101E93b906
    private key: 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d010b86aef14
EOF
}

MODE="custom"
RPC_OVERRIDE=""

while [ "$#" -gt 0 ]; do
    case "$1" in
        --help|-h)
            usage
            exit 0
            ;;
        --local)
            MODE="local"
            ;;
        --rpc)
            if [ -z "${2:-}" ]; then
                echo "--rpc requires a URL"
                exit 1
            fi
            RPC_OVERRIDE="$2"
            shift
            ;;
        *)
            usage
            exit 1
            ;;
    esac
    shift
done

require_command jq
ensure_config_file

if [ "$MODE" = "local" ]; then
    RPC_LINK="${RPC_OVERRIDE:-$LOCAL_RPC}"
    echo "Configuring local Hardhat demo..."
    update_deployer_config "$LOCAL_DEPLOYER_ADDRESS" "$LOCAL_DEPLOYER_PRIVATE_KEY" "$RPC_LINK"
    seed_local_institutions
    check_rpc "$RPC_LINK"
else
    read -r -p "Enter the address of the owner: " ADDRESS
    read -r -s -p "Enter the private key of the owner: " PRIVATE_KEY
    echo
    if [ -n "$RPC_OVERRIDE" ]; then
        RPC_LINK="$RPC_OVERRIDE"
    else
        read -r -p "Enter the RPC link: " RPC_LINK
    fi

    update_deployer_config "$ADDRESS" "$PRIVATE_KEY" "$RPC_LINK"
    check_rpc "$RPC_LINK"
fi

install_dependencies
deploy_contracts

if [ "$MODE" = "local" ]; then
    print_local_accounts
fi

echo "Setup completed successfully."
