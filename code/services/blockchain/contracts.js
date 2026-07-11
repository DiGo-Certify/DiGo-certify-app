import { getContractAt, getWallet, jsonRpcProvider } from '../ethereum/scripts/utils/ethers';
import { useRpcProvider } from '../ethereum/scripts/utils/useRpcProvider';
import config from '../../config.json';

let signer = null;

export function getSigner() {
    if (!signer) {
        signer = useRpcProvider(config.rpc, config.deployer.privateKey);
    }

    return signer;
}

export function getProvider() {
    return jsonRpcProvider(config.rpc);
}

export function getIdentityFactory() {
    return getContractAt(config.identityFactory.address, config.identityFactory.abi, getSigner());
}

export function getTrustedIssuerRegistry() {
    return getContractAt(
        config.trex.trustedIssuersRegistry.address,
        config.trex.trustedIssuersRegistry.abi,
        getSigner()
    );
}

export function getClaimIssuerContract(institution) {
    return getContractAt(institution.address, institution.abi, getSigner());
}

export function getWalletFromPrivateKey(privateKey) {
    return getWallet(privateKey, getProvider());
}

export { getContractAt };
