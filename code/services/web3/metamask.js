import { useSDK } from '@metamask/sdk-react';

const { connect } = useSDK();

const connectWallet = async () => {
    try {
        await connect();
    } catch (error) {
        console.error('Failed to connect wallet:', error);
    }
};
