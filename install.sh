#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CONFIG_FILE="$SCRIPT_DIR/code/config.json"
ETH_DIR="$SCRIPT_DIR/code/services/ethereum"

# Function to check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo "jq is required but it's not installed. Please install jq and try again."
        exit 1
    fi
}

# Function to create config file if it doesn't exist
create_config_file() {
    cat <<EOF > $CONFIG_FILE
{
    "rpc": "",
    "deployer": {},
    "identityFactory": {
        "address": "",
        "abi": [],
        "bytecode": ""
    },
    "trex": {
        "implementationAuthority": {
            "address": "",
            "abi": []
        },
        "claimsTopicRegistry": {
            "address": "",
            "abi": []
        },
        "trustedIssuersRegistry": {},
        "identityRegistry": {},
        "identityRegistryStorage": {},
        "modularCompliance": {},
        "token": {}
    },
    "institutions": []
}
EOF
}

# Check if jq is installed
check_jq

# Ask the user for the address
read -p "Enter the Address of the owner: " ADDRESS
echo

# Ask the user for the private key
read -p "Enter the private key of the owner: " PRIVATE_KEY
echo

# Ask the user for the RPC link
read -p "Enter the RPC link: " RPC_LINK
echo

# Check if config file exists, if not create it
if [ ! -f $CONFIG_FILE ]; then
    echo "Config file not found. Creating $CONFIG_FILE..."
    create_config_file
fi

# Update the deployer section of the config file with the private key and RPC link
jq --arg address "$ADDRESS" --arg key "$PRIVATE_KEY" --arg rpc "$RPC_LINK" '.deployer.address = $address | .deployer.privateKey = $key | .rpc = $rpc' $CONFIG_FILE > tmp.$$.json && mv tmp.$$.json $CONFIG_FILE

# Run npm install in the current directory
echo "Running npm install on frontend..."
cd "$SCRIPT_DIR"/code/ || exit
npm install

# Run npm install on backend
echo "Running npm install on backend..."
cd "$ETH_DIR" || exit
npm install

# Change directory to the code directory
cd "$SCRIPT_DIR"/code/ || exit

# Run npm run deploy in the code directory
echo "Running npm run deploy..."
npm run deploy

echo "Setup completed successfully."
