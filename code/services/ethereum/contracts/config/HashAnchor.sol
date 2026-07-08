// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

/**
 * @title HashAnchor
 * @notice Minimal Blockcerts-style hash-anchoring certificate registry, used as
 *         the baseline in the paper's evaluation (RQ2). A certificate is reduced
 *         to the SHA-256 digest of its document; issuing records the digest
 *         on-chain and validation is a read.
 *
 *         This is deliberately the *bare* anchoring approach: there is no
 *         on-chain identity binding, no issuer accreditation whitelist, and no
 *         gated revocation. Any account may anchor any digest, and a digest is
 *         not bound to the subject who earned the certificate. Those are exactly
 *         the properties the OnchainID/T-REX design adds on top, and isolating
 *         this baseline lets us price that identity + compliance layer.
 */
contract HashAnchor {
    // certificate digest => account that anchored it (address(0) == not anchored)
    mapping(bytes32 => address) private _anchoredBy;

    event CertificateAnchored(bytes32 indexed digest, address indexed issuer);

    /// @notice Anchor a certificate digest. Any caller may anchor any digest.
    ///         A first anchor of a fresh digest is a cold SSTORE (issuance); an
    ///         anchor of an already-recorded digest is a warm SSTORE (the update
    ///         path), mirroring the cold/warm split measured for `addClaim`.
    function anchor(bytes32 digest) external {
        _anchoredBy[digest] = msg.sender;
        emit CertificateAnchored(digest, msg.sender);
    }

    /// @notice Validate a certificate by its digest. Returns the account that
    ///         anchored it, or address(0) if never anchored. Read-only, so it
    ///         costs no gas to the verifier and needs no wallet.
    function issuerOf(bytes32 digest) external view returns (address) {
        return _anchoredBy[digest];
    }
}
