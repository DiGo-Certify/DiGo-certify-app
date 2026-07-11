import { useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useWalletConnectModal } from '@walletconnect/modal-react-native';
import { useSession } from '@/contexts/SessionContext';
import ErrorHandler from '@/services/errors/ErrorHandler';
import { USER_TYPES } from '@/constants/app';
import config from '@/config.json';

function getUserTypeForWallet(address) {
    const normalizedAddress = address?.toLowerCase();
    const institution = config.institutions?.find(
        item => item.wallet?.address?.toLowerCase() === normalizedAddress
    );

    return institution ? USER_TYPES.ADMIN : USER_TYPES.DEFAULT;
}

export const useWalletConnectionManager = () => {
    const { setLoading, setError, setWallet, setUserType } = useSession();
    const { address, isConnected, open, provider } = useWalletConnectModal();

    const syncedAddress = useRef(null);

    useEffect(() => {
        const handleConnection = async () => {
            if (!isConnected || !address) {
                syncedAddress.current = null;
                return;
            }

            const normalizedAddress = address.toLowerCase();
            if (syncedAddress.current === normalizedAddress) {
                return;
            }

            try {
                syncedAddress.current = normalizedAddress;
                setLoading(true);

                await setWallet({ address });
                await setUserType({ type: getUserTypeForWallet(address) });
            } catch (err) {
                syncedAddress.current = null;
                console.error('Connection setup failed:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        handleConnection();
    }, [isConnected, address, setLoading, setError, setWallet, setUserType]);

    const connectWallet = useCallback(async () => {
        try {
            setLoading(true);

            if (isConnected) {
                await provider?.disconnect();
            } else {
                await open();
            }
        } catch (error) {
            const processedError = ErrorHandler.processError(error, 'connectWallet');
            setError(processedError.userMessage);
            Alert.alert('Connection Error', processedError.userMessage);
        } finally {
            setLoading(false);
        }
    }, [isConnected, open, provider, setLoading, setError]);

    return {
        isConnected,
        address,
        connectWallet,
    };
};
