const config = require('../../../../config.json');
const { getIdentity } = require('../identities/getIdentity');
const { getContractAt } = require('../utils/ethers');
const { useRpcProvider } = require('../utils/useRpcProvider');
const { CLAIM_TOPICS_OBJ } = require('./claimTopics');
const { ethers } = require('ethers');

/**
 * Get the claims of a given identity/claim issuer contract
 * @returns {Object} claims - The claims of the identity/claim issuer divided by topics
 */
async function getClaimsByTopic(identity, topic) {
    try {
        if (!(topic in CLAIM_TOPICS_OBJ)) {
            throw new Error('[x] Invalid topic');
        }

        try {
            console.log(
                '[i] Getting claims for identity: ',
                await identity.getAddress(),
                'by topic:',
                topic
            );
        } catch (error) {
            console.error('[x] Error getting identity address:', error);
        }

        let claims = [];

        if (topic === CLAIM_TOPICS_OBJ.INSTITUTION) {
            // Get all the claim ids by topic and push them to the claims object
            const institutionClaims = await identity.getClaimIdsByTopic(
                ethers.id(CLAIM_TOPICS_OBJ.INSTITUTION)
            );

            console.log('[i] Institution claims:', institutionClaims);

            await Promise.all(
                institutionClaims.map(async claimId => {
                    const claimArray = await identity.getClaim(claimId); // see return at https://github.com/onchain-id/solidity/blob/main/contracts/Identity.sol
                    claims.push({
                        id: claimId,
                        topic: claimArray[0],
                        issuer: claimArray[2],
                        signature: claimArray[3],
                        data: claimArray[4],
                        uri: claimArray[5]
                    });
                })
            ).catch(error => {
                console.error('[x] Error getting institution claims:', error);
            });
        } else if (topic === CLAIM_TOPICS_OBJ.CERTIFICATE) {
            const certificateClaims = await identity.getClaimIdsByTopic(
                ethers.id(CLAIM_TOPICS_OBJ.CERTIFICATE)
            );

            await Promise.all(
                certificateClaims.map(async claimId => {
                    const claimArray = await identity.getClaim(claimId);
                    claims.push({
                        id: claimId,
                        topic: claimArray[0],
                        issuer: claimArray[2],
                        signature: claimArray[3],
                        data: claimArray[4],
                        uri: claimArray[5]
                    });
                })
            ).catch(error => {
                console.error('[x] Error getting certificate claims:', error);
            });
        } else if (topic === CLAIM_TOPICS_OBJ.STUDENT) {
            const studentClaims = await identity.getClaimIdsByTopic(
                ethers.id(CLAIM_TOPICS_OBJ.STUDENT)
            );

            await Promise.all(
                studentClaims.map(async claimId => {
                    const claimArray = await identity.getClaim(claimId);
                    claims.push({
                        id: claimId,
                        topic: claimArray[0],
                        issuer: claimArray[2],
                        signature: claimArray[3],
                        data: claimArray[4],
                        uri: claimArray[5]
                    });
                })
            ).catch(error => {
                console.error('[x] Error getting student claims:', error);
            });
        }

        return claims;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { getClaimsByTopic };
