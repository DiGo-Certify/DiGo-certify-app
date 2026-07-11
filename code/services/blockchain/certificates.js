import { ethers } from 'ethers';
import { addClaim } from '../ethereum/scripts/claims/add-claim';
import { CLAIM_TOPICS_OBJ } from '../ethereum/scripts/claims/claimTopics';
import hash from '../ethereum/scripts/utils/encryption/hash';
import { encrypt } from '../ethereum/scripts/utils/encryption/aes-256';
import { BlockchainError } from '../errors/ErrorHandler';
import { formatCertificateClaim } from './claimFormat';
import { getClaimIssuerContract, getTrustedIssuerRegistry, getWalletFromPrivateKey } from './contracts';
import { getUserClaims, getUserIdentity } from './identities';
import { findInstitutionByWallet, isTrustedIssuerForTopic } from './institutions';
import { invalidateUserCache } from './cache';

export async function issueCertificate({
    issuerWallet,
    receiverWalletAddress,
    registrationCode,
    courseID,
    grade,
    certificateReference,
    password,
    replaceExisting = false,
}) {
    try {
        const institution = getIssuingInstitution(issuerWallet);

        if (!certificateReference) {
            throw new BlockchainError('Certificate reference is required');
        }

        const identity = await getUserIdentity(receiverWalletAddress);

        if (!identity) {
            throw new BlockchainError('Student identity not found');
        }

        const claimIssuerWallet = getWalletFromPrivateKey(institution.wallet.privateKey);
        await assertIssuerCanWriteCertificate(identity, institution, claimIssuerWallet.address);

        if (!replaceExisting && await hasCertificateFromIssuer(identity, institution.address)) {
            throw new BlockchainError(
                'This institution has already issued a certificate for this student in the certificate topic.',
                'CERTIFICATE_EXISTS'
            );
        }

        const operations = buildCertificateClaims({
            institution,
            registrationCode,
            courseID,
            grade,
            certificateReference,
            password,
        });

        const trustedIR = getTrustedIssuerRegistry();
        const claimIssuerContract = getClaimIssuerContract(institution);

        for (const operation of operations) {
            await addClaim(
                trustedIR,
                identity,
                claimIssuerContract,
                claimIssuerWallet,
                operation.claimTopic,
                operation.claimData,
                1,
                operation.uri || '',
                operation.password
            );
        }

        invalidateUserCache(receiverWalletAddress);
        return true;
    } catch (error) {
        if (error instanceof BlockchainError) throw error;
        throw new BlockchainError(`Failed to issue certificate: ${error.message}`);
    }
}

async function hasCertificateFromIssuer(identity, issuerAddress) {
    const topic = ethers.id(CLAIM_TOPICS_OBJ.CERTIFICATE);
    const expectedClaimId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [issuerAddress, topic])
    );
    const claimIds = await identity.getClaimIdsByTopic(topic);

    return claimIds.some(claimId => claimId.toLowerCase() === expectedClaimId.toLowerCase());
}

export async function revokeCertificate({ issuerWallet, receiverWalletAddress, claimId = null }) {
    try {
        const institution = getIssuingInstitution(issuerWallet);
        const identity = await getUserIdentity(receiverWalletAddress);

        if (!identity) {
            throw new BlockchainError('Student identity not found');
        }

        const certificates = await getUserClaims(receiverWalletAddress, CLAIM_TOPICS_OBJ.CERTIFICATE);
        const targetClaim = findRevocationTarget(certificates, institution, claimId);

        if (!targetClaim) {
            throw new BlockchainError('Certificate claim not found for this institution');
        }

        const claimIssuerWallet = getWalletFromPrivateKey(institution.wallet.privateKey);
        const tx = await identity.connect(claimIssuerWallet).removeClaim(targetClaim.id);
        await tx.wait();

        invalidateUserCache(receiverWalletAddress);
        return true;
    } catch (error) {
        if (error instanceof BlockchainError) throw error;
        throw new BlockchainError(`Failed to revoke certificate: ${error.message}`);
    }
}

export async function getCertificatesForWallet(walletAddress) {
    try {
        const claims = await getUserClaims(walletAddress, CLAIM_TOPICS_OBJ.CERTIFICATE);
        return claims.map((claim, index) => formatCertificateClaim(claim, index));
    } catch (error) {
        throw new BlockchainError(`Failed to get certificates: ${error.message}`);
    }
}

function getIssuingInstitution(issuerWallet) {
    const institution = findInstitutionByWallet(issuerWallet?.address);

    if (!institution?.wallet?.privateKey) {
        throw new BlockchainError('Connected wallet is not an accredited institution');
    }

    if (!institution.address || !institution.abi?.length) {
        throw new BlockchainError(
            'Institution ClaimIssuer is not deployed in the current app config. Run ./install.sh --local, then reload the app.'
        );
    }

    return institution;
}

async function assertIssuerCanWriteCertificate(identity, institution, claimSignerAddress) {
    const claimKey = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address'], [claimSignerAddress])
    );
    const issuerAuthorizedOnIdentity = await identity.keyHasPurpose(claimKey, 3);

    if (!issuerAuthorizedOnIdentity) {
        throw new BlockchainError(
            'Student identity has not authorized this institution yet. Log in as the student and activate the identity from Home with the student private key.'
        );
    }

    const canIssueCertificates = await isTrustedIssuerForTopic(
        institution.address,
        CLAIM_TOPICS_OBJ.CERTIFICATE
    );
    if (!canIssueCertificates) {
        throw new BlockchainError('Institution is not accredited to issue certificate claims');
    }
}

function buildCertificateClaims({
    institution,
    registrationCode,
    courseID,
    grade,
    certificateReference,
    password,
}) {
    return [
        {
            claimTopic: CLAIM_TOPICS_OBJ.INSTITUTION,
            claimData: JSON.stringify({
                institutionID: institution.institutionID.toString(),
                courseID,
            }),
        },
        {
            claimTopic: CLAIM_TOPICS_OBJ.STUDENT,
            claimData: JSON.stringify({ grade }),
        },
        {
            claimTopic: CLAIM_TOPICS_OBJ.CERTIFICATE,
            claimData: JSON.stringify({
                registrationCode,
                courseID,
                grade,
                certificateDigest: hash(certificateReference),
                encryptedCertificateReference: password ? encrypt(certificateReference, password) : '',
            }),
            uri: certificateReference,
            password,
        },
    ];
}

function findRevocationTarget(certificates, institution, claimId) {
    if (claimId !== null) {
        return certificates.find(claim => claim.id === claimId);
    }

    return certificates.find(claim => claim.issuer?.toLowerCase() === institution.address.toLowerCase());
}
