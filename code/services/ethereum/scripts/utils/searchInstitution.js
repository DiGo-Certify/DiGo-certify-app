const config = require('@/config.json');

/**
 * Search for an admin by address in the list of institutions
 * of the configuration file
 *
 * @param {string} address The address to search for
 */
function searchInstitution(address) {
    const institutions = config.institutions;
    let admin;
    for (let i = 0; i < institutions.length; i++) {
        if (institutions[i].wallet.address.toLowerCase() === address) {
            admin = institutions[i];
        }
    }
    return admin;
}

module.exports = searchInstitution;
