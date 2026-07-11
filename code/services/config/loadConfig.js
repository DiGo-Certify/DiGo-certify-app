let config;

try {
    config = require('../../config.json');
} catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
    }

    config = require('../../config.example.json');
}

module.exports = config;
