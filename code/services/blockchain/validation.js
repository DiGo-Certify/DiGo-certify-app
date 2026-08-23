import { CLAIM_TOPICS_OBJ } from '../ethereum/scripts/claims/claimTopics';
import { ethers } from 'ethers';
import hash from '../ethereum/scripts/utils/encryption/hash';
import { BlockchainError } from '../errors/ErrorHandler';
import { parseClaimData, formatCertificateClaim } from './claimFormat';
import { getCertificateVerifier } from './contracts';
import { getUserClaims, getUserIdentity } from './identities';
import { findInstitutionByIssuerAddress } from './institutions';

const failedChecks = {
    digestMatch: false,
    onChainVerified: false,
};

export async function validateCertificate(userAddress, certificateData) {
    try {
        const claims = await getUserClaims(userAddress, CLAIM_TOPICS_OBJ.CERTIFICATE);

        if (!claims || claims.length === 0) {
            return invalidResult('No certificates found for this address');
        }

        const certificateReference = getCertificateReference(certificateData);
        if (!certificateReference) {
            return invalidResult('No certificate reference provided');
        }

        const matchedClaim = findMatchingClaim(claims, certificateReference);
        if (!matchedClaim) {
            return {
                ...invalidResult('Certificate digest does not match any on-chain claim'),
                claims,
            };
        }

        const identity = await getUserIdentity(userAddress);
        const identityAddress = await identity.getAddress();
        const institution = findInstitutionByIssuerAddress(matchedClaim.issuer);
        const isValid = await getCertificateVerifier().isCertifiedBy(
            identityAddress,
            ethers.id(CLAIM_TOPICS_OBJ.CERTIFICATE),
            matchedClaim.data
        );

        return {
            isValid,
            reason: isValid ? null : 'Certificate claim exists, but on-chain verification failed',
            checks: {
                digestMatch: true,
                onChainVerified: isValid,
            },
            issuer: formatIssuer(institution, matchedClaim.issuer),
            claim: formatCertificateClaim(matchedClaim, 0),
            claims,
        };
    } catch (error) {
        throw new BlockchainError(`Certificate validation failed: ${error.message}`);
    }
}

function invalidResult(reason) {
    return {
        isValid: false,
        reason,
        checks: { ...failedChecks },
    };
}

function getCertificateReference(certificateData) {
    if (typeof certificateData === 'string') {
        return certificateData;
    }

    return certificateData?.content || certificateData?.certificateLink || certificateData?.uri;
}

function findMatchingClaim(claims, certificateReference) {
    const targetHash = hash(certificateReference);

    return claims.find(claim => {
        const data = parseClaimData(claim.data);
        return claim.uri === targetHash || data.certificateDigest === targetHash;
    });
}

function formatIssuer(institution, issuerAddress) {
    if (!institution) {
        return { address: issuerAddress };
    }

    return {
        institutionID: institution.institutionID,
        address: institution.address,
    };
}
