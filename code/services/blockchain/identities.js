import { ethers } from 'ethers';
import { getIdentity } from '../ethereum/scripts/identities/getIdentity';
import { deployIdentity } from '../ethereum/scripts/identities/deploy-identity';
import { addKeyToIdentity } from '../ethereum/scripts/claimIssuer/addKeyToIdentity';
import { getClaimsByTopic } from '../ethereum/scripts/claims/getClaimsByTopic';
import { CLAIM_TOPICS_OBJ } from '../ethereum/scripts/claims/claimTopics';
import { BLOCKCHAIN_CONFIG } from '../../constants/app';
import { BlockchainError, retryOperation } from '../errors/ErrorHandler';
import { getCacheKey, getFromCache, invalidateUserCache, setCache } from './cache';
import { getIdentityFactory, getSigner, getWalletFromPrivateKey } from './contracts';
import { getClaimSignerAddress, isTrustedIssuerForTopic } from './institutions';
import config from '../../config.json';

export async function getUserIdentity(walletAddress) {
    const cacheKey = getCacheKey('getUserIdentity', walletAddress);
    const cached = getFromCache(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        const identity = await retryOperation(
            async () => await getIdentity(walletAddress, getIdentityFactory(), getSigner()),
            BLOCKCHAIN_CONFIG.MAX_RETRIES,
            BLOCKCHAIN_CONFIG.RETRY_DELAY
        );

        if (identity) {
            setCache(cacheKey, identity);
        }

        return identity;
    } catch (error) {
        throw new BlockchainError(`Failed to get identity for ${walletAddress}: ${error.message}`);
    }
}

export async function getUserClaims(walletAddress, claimTopic = null) {
    const cacheKey = getCacheKey('getUserClaims', walletAddress, claimTopic);
    const cached = getFromCache(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        const identity = await getUserIdentity(walletAddress);

        if (!identity) {
            throw new BlockchainError('Identity not found');
        }

        const claims = await retryOperation(
            async () => {
                if (claimTopic) {
                    return await getClaimsByTopic(identity, claimTopic);
                }

                const [certificates, institutions, students] = await Promise.all([
                    getClaimsByTopic(identity, CLAIM_TOPICS_OBJ.CERTIFICATE),
                    getClaimsByTopic(identity, CLAIM_TOPICS_OBJ.INSTITUTION),
                    getClaimsByTopic(identity, CLAIM_TOPICS_OBJ.STUDENT),
                ]);

                return { certificates, institutions, students };
            },
            BLOCKCHAIN_CONFIG.MAX_RETRIES,
            BLOCKCHAIN_CONFIG.RETRY_DELAY
        );

        setCache(cacheKey, claims);
        return claims;
    } catch (error) {
        throw new BlockchainError(`Failed to get claims: ${error.message}`);
    }
}

export async function createIdentityForWallet(walletAddress) {
    try {
        if (!walletAddress) {
            throw new BlockchainError('Wallet address is required');
        }

        const salt = `digo-${walletAddress.toLowerCase()}`;
        const identity = await deployIdentity(getIdentityFactory(), walletAddress, salt, getSigner());

        invalidateUserCache(walletAddress);
        return identity;
    } catch (error) {
        if (error instanceof BlockchainError) throw error;
        throw new BlockchainError(`Failed to create identity: ${error.message}`);
    }
}

export async function authorizeAccreditedIssuersForWallet(wallet) {
    try {
        const { address, privateKey } = wallet ?? {};

        if (!address || !privateKey) {
            throw new BlockchainError('Wallet address and private key are required');
        }

        const identityWallet = getWalletFromPrivateKey(privateKey);
        const identity = await createIdentityForWallet(address);
        const results = [];

        for (const institution of config.institutions || []) {
            const issuerSignerAddress = getClaimSignerAddress(institution);
            if (!issuerSignerAddress || !institution.address) continue;

            const isTrusted = await isTrustedIssuerForTopic(
                institution.address,
                CLAIM_TOPICS_OBJ.CERTIFICATE
            );
            if (!isTrusted) {
                results.push({ institutionID: institution.institutionID, skipped: true, reason: 'not trusted' });
                continue;
            }

            const claimKey = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(['address'], [issuerSignerAddress])
            );
            const alreadyAuthorized = await identity.keyHasPurpose(claimKey, 3);

            if (alreadyAuthorized) {
                results.push({ institutionID: institution.institutionID, skipped: true });
                continue;
            }

            const result = await addKeyToIdentity(identity, identityWallet, { address: issuerSignerAddress }, 3, 1);
            results.push({ institutionID: institution.institutionID, result });
        }

        invalidateUserCache(address);
        return results;
    } catch (error) {
        if (error instanceof BlockchainError) throw error;
        throw new BlockchainError(`Failed to authorize issuers: ${error.message}`);
    }
}
