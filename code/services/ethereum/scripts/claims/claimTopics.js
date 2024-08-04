/**
 * Available claim topics.
 *
 * INSTITUTION:
 * - intitution DGES code,
 * - course ID
 *
 * STUDENT:
 * - student name,
 * - student number,
 *
 * CERTIFICATE:
 * - certificate URI,
 * - registration certificate number,
 *
 */
const CLAIM_TOPICS = ['INSTITUTION', 'STUDENT', 'CERTIFICATE'];

module.exports = {
    CLAIM_TOPICS,
    CLAIM_TOPICS_OBJ: {
        INSTITUTION: CLAIM_TOPICS[0],
        STUDENT: CLAIM_TOPICS[1],
        CERTIFICATE: CLAIM_TOPICS[2]
    }
};
