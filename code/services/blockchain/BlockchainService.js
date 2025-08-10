// Blockchain service with caching and retry logic
import { getContractAt, getWallet } from '../ethereum/scripts/utils/ethers';
import { getIdentity } from '../ethereum/scripts/identities/getIdentity';
import { useRpcProvider } from '../ethereum/scripts/utils/useRpcProvider';
import { addClaim } from '../ethereum/scripts/claims/add-claim';
import { getClaimsByTopic } from '../ethereum/scripts/claims/getClaimsByTopic';
import { CLAIM_TOPICS_OBJ } from '../ethereum/scripts/claims/claimTopics';
import { BLOCKCHAIN_CONFIG } from '../../constants/app';
import ErrorHandler, { BlockchainError, retryOperation } from '../errors/ErrorHandler';
import config from '../../config.json';

class BlockchainService {
    constructor() {
        this.cache = new Map();
        this.signer = null;
    }

    // Initialize signer
    getSigner() {
        if (!this.signer) {
            this.signer = useRpcProvider(config.rpc, config.deployer.privateKey);
        }
        return this.signer;
    }

    // Cache management
    getCacheKey(method, ...args) {
        return `${method}_${JSON.stringify(args)}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < BLOCKCHAIN_CONFIG.CACHE_TTL) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    // Get user identity with caching
    async getUserIdentity(walletAddress) {
        const cacheKey = this.getCacheKey('getUserIdentity', walletAddress);
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const identity = await retryOperation(
                async () => {
                    const signer = this.getSigner();
                    const identityFactory = getContractAt(
                        config.identityFactory.address,
                        config.identityFactory.abi,
                        signer
                    );

                    return await getIdentity(walletAddress, identityFactory, signer);
                },
                BLOCKCHAIN_CONFIG.MAX_RETRIES,
                BLOCKCHAIN_CONFIG.RETRY_DELAY
            );

            if (identity) {
                this.setCache(cacheKey, identity);
            }

            return identity;
        } catch (error) {
            throw new BlockchainError(`Failed to get identity for ${walletAddress}: ${error.message}`);
        }
    }

    // Get user claims with caching
    async getUserClaims(walletAddress, claimTopic = null) {
        const cacheKey = this.getCacheKey('getUserClaims', walletAddress, claimTopic);
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const identity = await this.getUserIdentity(walletAddress);

            if (!identity) {
                throw new BlockchainError('Identity not found');
            }

            const claims = await retryOperation(
                async () => {
                    if (claimTopic) {
                        return await getClaimsByTopic(identity, claimTopic);
                    }

                    // Get all claim types
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

            this.setCache(cacheKey, claims);
            return claims;
        } catch (error) {
            throw new BlockchainError(`Failed to get claims: ${error.message}`);
        }
    }

    // Add claim to identity
    async addClaimToIdentity({
        receiverWalletAddress,
        claimIssuerContract,
        claimIssuerWallet,
        claimTopic,
        claimData,
        claimScheme = 1,
        uri = '',
        password = undefined,
    }) {
        try {
            const identity = await this.getUserIdentity(receiverWalletAddress);

            if (!identity) {
                throw new BlockchainError('Receiver identity not found');
            }

            const signer = this.getSigner();
            const trustedIR = getContractAt(
                config.trex.trustedIssuersRegistry.address,
                config.trex.trustedIssuersRegistry.abi,
                signer
            );

            await retryOperation(
                async () => {
                    return await addClaim(
                        trustedIR,
                        identity,
                        claimIssuerContract,
                        claimIssuerWallet,
                        claimTopic,
                        claimData,
                        claimScheme,
                        uri,
                        password
                    );
                },
                BLOCKCHAIN_CONFIG.MAX_RETRIES,
                BLOCKCHAIN_CONFIG.RETRY_DELAY
            );

            // Invalidate cache for this user
            this.invalidateUserCache(receiverWalletAddress);

            return true;
        } catch (error) {
            throw new BlockchainError(`Failed to add claim: ${error.message}`);
        }
    }

    // Validate certificate
    async validateCertificate(userAddress, certificateData) {
        try {
            const claims = await this.getUserClaims(userAddress, CLAIM_TOPICS_OBJ.CERTIFICATE);

            if (!claims || claims.length === 0) {
                return { isValid: false, reason: 'No certificates found for this address' };
            }

            // Certificate validation logic here
            // This would involve comparing hashes, verifying signatures, etc.

            return { isValid: true, claims };
        } catch (error) {
            throw new BlockchainError(`Certificate validation failed: ${error.message}`);
        }
    }

    // Batch operations for efficiency
    async batchAddClaims(operations) {
        const results = [];

        for (const operation of operations) {
            try {
                const result = await this.addClaimToIdentity(operation);
                results.push({ success: true, result });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }

        return results;
    }

    // Cache invalidation
    invalidateUserCache(walletAddress) {
        const keysToDelete = [];

        for (const key of this.cache.keys()) {
            if (key.includes(walletAddress)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    // Clear all cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache stats (useful for debugging)
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// Export singleton instance
export default new BlockchainService();
