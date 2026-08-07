// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@onchain-id/solidity/contracts/interface/IClaimIssuer.sol";
import "@onchain-id/solidity/contracts/interface/IIdentity.sol";
import "../registry/interface/ITrustedIssuersRegistry.sol";

/**
 * @title CertificateVerifier
 * @dev On-chain, trust-authoritative verification of an identity-bound academic
 * certificate. It composes, in a single read-only call, the two checks that
 * decide whether a claim counts as a valid certificate:
 *
 *   (a) accreditation -- the claim's issuer must be currently registered in the
 *       trusted-issuer registry for the claim topic, and
 *   (b) authenticity  -- the claim must satisfy the issuer's own isClaimValid
 *       (signature recovery, claim-key purpose, and issuer-side revocation).
 *
 * The logic mirrors T-REX IdentityRegistry.isVerified, but is parameterised by
 * an explicit (subject, topic) rather than tied to token registration, and it
 * reads the *current* trusted-issuer set, so a de-accredited issuer or a removed
 * claim causes verification to fail immediately. Because the result is computed
 * entirely on-chain from registry and identity state, a verifier obtains an
 * authoritative verdict via a single eth_call and need not trust any off-chain
 * client -- addressing the concern that accreditation could be enforced only in
 * client code and bypassed by calling the identity contract directly.
 */
contract CertificateVerifier {
    /// @dev The trusted-issuer registry that defines which issuers are accredited.
    ITrustedIssuersRegistry public immutable trustedIssuersRegistry;

    constructor(address _trustedIssuersRegistry) {
        require(_trustedIssuersRegistry != address(0), "TIR is the zero address");
        trustedIssuersRegistry = ITrustedIssuersRegistry(_trustedIssuersRegistry);
    }

    /**
     * @dev Returns true iff `subject` holds a claim for `topic` that is signed
     * by a currently accredited issuer and accepted by that issuer's
     * isClaimValid. When `expectedData` is non-empty, the stored claim's data
     * must additionally equal it, binding the verdict to a specific certificate
     * payload; passing an empty `expectedData` checks only that the subject is
     * certified for `topic` by some accredited issuer.
     *
     * The check consults only on-chain state (the trusted-issuer registry and
     * the subject's identity), so its result is authoritative and independent of
     * any client. It is a view function: external callers pay no gas.
     *
     * @param subject      the identity that should hold the certificate claim
     * @param topic        the claim topic (uint256 of the topic identifier)
     * @param expectedData the exact claim payload to bind to, or empty to skip
     */
    function isCertifiedBy(
        IIdentity subject,
        uint256 topic,
        bytes calldata expectedData
    ) external view returns (bool) {
        if (address(subject) == address(0)) {
            return false;
        }

        IClaimIssuer[] memory trustedIssuers =
            trustedIssuersRegistry.getTrustedIssuersForClaimTopic(topic);

        for (uint256 i = 0; i < trustedIssuers.length; i++) {
            // A claim is keyed by keccak256(issuer, topic); at most one claim
            // per accredited issuer can match this topic on the subject.
            bytes32 claimId = keccak256(abi.encode(trustedIssuers[i], topic));

            (uint256 foundTopic, , address issuer, bytes memory sig, bytes memory data, ) =
                subject.getClaim(claimId);

            if (foundTopic != topic) {
                continue; // no claim from this accredited issuer for the topic
            }
            if (expectedData.length != 0 && keccak256(data) != keccak256(expectedData)) {
                continue; // claim exists but does not bind this certificate
            }

            // Authenticity is delegated to the issuer's own isClaimValid, which
            // works for both a full ClaimIssuer and a lightweight identity-proxy
            // issuer. A reverting issuer is treated as a non-match.
            try IClaimIssuer(issuer).isClaimValid(subject, topic, sig, data) returns (bool valid) {
                if (valid) {
                    return true;
                }
            } catch {
                continue;
            }
        }

        return false;
    }
}
