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

# Ask the user for trusted issuer registry address
while true; do
  read -p "[W] Enter the address of the trusted issuer registry: " TRUSTED_ISSUER_REGISTRY
  if is_empty "$TRUSTED_ISSUER_REGISTRY"; then
    echo "Trusted issuer registry cannot be empty. Please try again."
  else
    break
  fi
done

# Ask for institution wallet private key
while true; do
  read -s -p "[$] Institution Wallet Private Key: " INSTITUTION_WALLET_PRIVATE_KEY
  echo
    if is_empty "$INSTITUTION_WALLET_PRIVATE_KEY"; then
        echo "Institution wallet private key cannot be empty. Please try again."
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
deployClaimIssuer('$TRUSTED_ISSUER_REGISTRY', undefined, undefined, '$INSTITUTION_WALLET_PRIVATE_KEY', '$INSTITUTION_CODE');
"



