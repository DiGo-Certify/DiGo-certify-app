const { createHash } = require('crypto');

function encrypt(key) {
    const hash = createHash('sha256').update(key).digest('hex');
    return '0x' + hash;
}

module.exports = { encrypt };
