import '@walletconnect/react-native-compat';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAppKit } from '@reown/appkit-react-native';
import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import { safeJsonParse, safeJsonStringify } from '@walletconnect/safe-json';
import { mainnet, sepolia } from 'viem/chains';

import config from '@/config.json';

const projectId = 'b57487c51107cc8b2509a12a8d028338';
const storagePrefix = '@digo-certify/appkit-v1:';

const getStorageKey = key => `${storagePrefix}${key}`;

const hardhat = {
    id: 31337,
    name: 'Hardhat',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [config.rpc] },
    },
    chainNamespace: 'eip155',
    caipNetworkId: 'eip155:31337',
    testnet: true,
};

const storage = {
    getKeys: async () => {
        const keys = await AsyncStorage.getAllKeys();
        return keys.filter(key => key.startsWith(storagePrefix)).map(key => key.slice(storagePrefix.length));
    },
    getEntries: async () => {
        const keys = await storage.getKeys();
        const entries = await AsyncStorage.multiGet(keys.map(getStorageKey));
        return entries.map(([key, value]) => [key.slice(storagePrefix.length), safeJsonParse(value ?? '')]);
    },
    getItem: async key => {
        const value = await AsyncStorage.getItem(getStorageKey(key));
        return value === null ? undefined : safeJsonParse(value);
    },
    setItem: (key, value) => AsyncStorage.setItem(getStorageKey(key), safeJsonStringify(value)),
    removeItem: key => AsyncStorage.removeItem(getStorageKey(key)),
};

export const appKit = createAppKit({
    projectId,
    adapters: [new EthersAdapter()],
    networks: [hardhat, sepolia, mainnet],
    defaultNetwork: hardhat,
    storage,
    metadata: {
        name: 'DiGo Certify',
        description: 'Issue and validate academic certificates on Ethereum.',
        url: 'https://github.com/DiGo-Certify/DiGo-certify-app',
        icons: ['https://raw.githubusercontent.com/DiGo-Certify/DiGo-certify-app/main/docs/images/logo.png'],
        redirect: {
            native: 'digo-certify://',
        },
    },
    features: {
        swaps: false,
        onramp: false,
        socials: false,
        showWallets: true,
    },
    enableAnalytics: false,
});
