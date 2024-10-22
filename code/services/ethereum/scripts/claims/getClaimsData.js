const ethers = require('ethers');

/**
 * Returns all the data of the claims passed as argument
 * @param {*} claims - Array of claims
 */
function getClaimsData(claims) {
    const claimsData = [];
    for (const claim of claims) {
        console.log('CLAIM', ethers.toUtf8String(claim.data));
        claimsData.push({
            data: ethers.toUtf8String(claim.data)
        });
    }
    return claimsData;
}

module.exports = { getClaimsData };
