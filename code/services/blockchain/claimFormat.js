import { ethers } from 'ethers';

export function parseClaimData(data) {
    try {
        const text = ethers.toUtf8String(data);
        return JSON.parse(text);
    } catch {
        return {};
    }
}

export function formatCertificateClaim(claim, index) {
    const data = parseClaimData(claim.data);

    return {
        id: claim.id || claim.claimId || `${claim.issuer}-${index}`,
        title: data.courseID ? `Course ${data.courseID}` : `Certificate #${index + 1}`,
        registrationCode: data.registrationCode,
        grade: data.grade,
        issuer: claim.issuer,
        digest: data.certificateDigest || claim.uri,
        uri: claim.uri,
        encryptedReference: data.encryptedCertificateReference || '',
        rawData: data,
        rawClaim: claim,
    };
}
