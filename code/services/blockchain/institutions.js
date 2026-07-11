import { ethers } from 'ethers';
import { getTrustedIssuerRegistry } from './contracts';
import config from '../../config.json';

export function findInstitutionByWallet(walletAddress) {
    const normalizedAddress = walletAddress?.toLowerCase();
    if (!normalizedAddress) return null;

    return config.institutions?.find(
        institution => institution.wallet?.address?.toLowerCase() === normalizedAddress
    );
}

export function findInstitutionByIssuerAddress(issuerAddress) {
    const normalizedAddress = issuerAddress?.toLowerCase();
    if (!normalizedAddress) return null;

    return config.institutions?.find(institution => institution.address?.toLowerCase() === normalizedAddress);
}

export function getClaimSignerAddress(institution) {
    return institution?.wallet?.address || null;
}

export async function isTrustedIssuerForTopic(issuerAddress, claimTopic) {
    if (!issuerAddress || !claimTopic) return false;

    const trustedIR = getTrustedIssuerRegistry();
    const topic = ethers.id(claimTopic);
    return await trustedIR.hasClaimTopic(issuerAddress, topic);
}
