import '@walletconnect/react-native-compat';

import React from 'react';
import { WalletConnectModal } from '@walletconnect/modal-react-native';

const projectId = 'b57487c51107cc8b2509a12a8d028338';

const providerMetadata = {
    name: 'DiGo Certify',
    description: 'Issue and validate academic certificates on Ethereum.',
    url: 'https://github.com/DiGo-Certify/DiGo-certify-app',
    icons: ['https://raw.githubusercontent.com/DiGo-Certify/DiGo-certify-app/main/docs/images/logo.png'],
    redirect: {
        native: 'digo-certify://',
    },
};

export default function WalletConnectProvider() {
    return <WalletConnectModal projectId={projectId} providerMetadata={providerMetadata} />;
}
