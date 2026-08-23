import { ethers } from 'ethers';
import { CLAIM_TOPICS_OBJ } from '../../ethereum/scripts/claims/claimTopics';
import hash from '../../ethereum/scripts/utils/encryption/hash';
import { getCertificateVerifier } from '../contracts';
import { getUserClaims, getUserIdentity } from '../identities';
import { findInstitutionByIssuerAddress } from '../institutions';
import { validateCertificate } from '../validation';

jest.mock('../contracts', () => ({
    getCertificateVerifier: jest.fn(),
}));

jest.mock('../identities', () => ({
    getUserClaims: jest.fn(),
    getUserIdentity: jest.fn(),
}));

jest.mock('../institutions', () => ({
    findInstitutionByIssuerAddress: jest.fn(),
}));

describe('validateCertificate', () => {
    const userAddress = '0x0000000000000000000000000000000000000001';
    const identityAddress = '0x0000000000000000000000000000000000000002';
    const issuerAddress = '0x0000000000000000000000000000000000000003';
    const certificateReference = 'https://university.example/certificates/123';
    const claimData = '0x7b226365727469666963617465446967657374223a226f6e2d636861696e227d';
    const matchedClaim = {
        issuer: issuerAddress,
        topic: ethers.id(CLAIM_TOPICS_OBJ.CERTIFICATE),
        data: claimData,
        uri: hash(certificateReference),
    };

    let isCertifiedBy;

    beforeEach(() => {
        jest.clearAllMocks();
        isCertifiedBy = jest.fn();
        getCertificateVerifier.mockReturnValue({ isCertifiedBy });
        getUserIdentity.mockResolvedValue({ getAddress: jest.fn().mockResolvedValue(identityAddress) });
        findInstitutionByIssuerAddress.mockReturnValue({
            institutionID: 'university',
            address: issuerAddress,
        });
    });

    it('accepts a digest-matched claim when the on-chain verifier approves it', async () => {
        getUserClaims.mockResolvedValue([matchedClaim]);
        isCertifiedBy.mockResolvedValue(true);

        const result = await validateCertificate(userAddress, certificateReference);

        expect(result.isValid).toBe(true);
        expect(result.checks).toEqual({
            digestMatch: true,
            onChainVerified: true,
        });
        expect(isCertifiedBy).toHaveBeenCalledWith(identityAddress, ethers.id(CLAIM_TOPICS_OBJ.CERTIFICATE), claimData);
    });

    it('rejects a digest mismatch without calling the verifier', async () => {
        getUserClaims.mockResolvedValue([{ ...matchedClaim, uri: hash('different-reference') }]);

        const result = await validateCertificate(userAddress, certificateReference);

        expect(result.isValid).toBe(false);
        expect(result.checks).toEqual({
            digestMatch: false,
            onChainVerified: false,
        });
        expect(isCertifiedBy).not.toHaveBeenCalled();
    });

    it('rejects the certificate when the on-chain verifier rejects the matched claim', async () => {
        getUserClaims.mockResolvedValue([matchedClaim]);
        isCertifiedBy.mockResolvedValue(false);

        const result = await validateCertificate(userAddress, certificateReference);

        expect(result.isValid).toBe(false);
        expect(result.checks).toEqual({
            digestMatch: true,
            onChainVerified: false,
        });
    });
});
