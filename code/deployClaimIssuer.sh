#!/bin/bash

# Set the path to the directory where the deploy claim issuer script is located
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set the path to the config file
DEPLOY_CLAIM_ISSUER="$CURRENT_DIR/services/ethereum/scripts/claimIssuer/deploy-claim-issuer.js"

# Function to check if input is empty
is_empty() {
  if [[ -z "$1" ]]; then
    return 0
  else
    return 1
  fi
}

# Function to check if wallet private key is valid
is_valid_wallet_private_key() {
  if [[ "$1" =~ ^0x[a-fA-F0-9]{64}$ ]]; then
    return 0
  else
    return 1
  fi
}

# Ask for institution wallet private key
while true; do
  read -s -p "[#] Institution Wallet Private Key: " INSTITUTION_WALLET_PRIVATE_KEY
  echo
    if is_empty "$INSTITUTION_WALLET_PRIVATE_KEY"; then
        echo "Private key cannot be empty. Please try again."
    elif ! is_valid_wallet_private_key "$INSTITUTION_WALLET_PRIVATE_KEY"; then
        echo "Invalid private key. Please try again."
    else
        break
    fi
done 

# Ask for the institution code
while true; do
  read -p "[#] Institution Code: " INSTITUTION_CODE
  echo
    if is_empty "$INSTITUTION_CODE"; then
        echo "Code cannot be empty. Please try again."
    else
        break
    fi
done

# Call the deploy claim issuer script
node -e "
const deployClaimIssuer = require('$DEPLOY_CLAIM_ISSUER').deployClaimIssuer;
deployClaimIssuer(undefined, undefined, undefined, '$INSTITUTION_WALLET_PRIVATE_KEY', '$INSTITUTION_CODE');
"



