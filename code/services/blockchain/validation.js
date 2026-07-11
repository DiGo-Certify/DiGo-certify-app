import { CLAIM_TOPICS_OBJ } from '../ethereum/scripts/claims/claimTopics';
import hash from '../ethereum/scripts/utils/encryption/hash';
import { BlockchainError } from '../errors/ErrorHandler';
import { parseClaimData, formatCertificateClaim } from './claimFormat';
import { getContractAt, getSigner } from './contracts';
import { getUserClaims, getUserIdentity } from './identities';
import { findInstitutionByIssuerAddress, isTrustedIssuerForTopic } from './institutions';

const CLAIM_ISSUER_VALIDATION_ABI = [
    'function isClaimValid(address identity, uint256 claimTopic, bytes sig, bytes data) view returns (bool)',
];

const failedChecks = {
    digestMatch: false,
    issuerTrusted: false,
    signatureValid: false,
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
        const issuerTrusted = await isTrustedIssuerForTopic(matchedClaim.issuer, CLAIM_TOPICS_OBJ.CERTIFICATE);
        const signatureValid = await validateClaimSignature(identityAddress, matchedClaim, institution);
        const isValid = issuerTrusted && signatureValid;

        return {
            isValid,
            reason: isValid ? null : 'Certificate claim exists, but issuer trust or signature validation failed',
            checks: {
                digestMatch: true,
                issuerTrusted,
                signatureValid,
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

async function validateClaimSignature(identityAddress, claim, institution) {
    try {
        const claimIssuerContract = getContractAt(
            claim.issuer,
            institution?.abi || CLAIM_ISSUER_VALIDATION_ABI,
            getSigner()
        );

        return await claimIssuerContract.isClaimValid(
            identityAddress,
            claim.topic,
            claim.signature,
            claim.data
        );
    } catch {
        return false;
    }
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
