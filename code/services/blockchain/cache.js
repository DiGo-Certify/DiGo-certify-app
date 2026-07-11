import { BLOCKCHAIN_CONFIG } from '../../constants/app';

const cache = new Map();

export function getCacheKey(method, ...args) {
    return `${method}_${JSON.stringify(args)}`;
}

export function getFromCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < BLOCKCHAIN_CONFIG.CACHE_TTL) {
        return cached.data;
    }

    cache.delete(key);
    return null;
}

export function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateUserCache(walletAddress) {
    const keysToDelete = [];

    for (const key of cache.keys()) {
        if (key.includes(walletAddress)) {
            keysToDelete.push(key);
        }
    }

    keysToDelete.forEach(key => cache.delete(key));
}

export function clearCache() {
    cache.clear();
}
