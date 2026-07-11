const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../../config.json');
const exampleConfigPath = path.resolve(__dirname, '../../config.example.json');

module.exports = require(fs.existsSync(configPath) ? configPath : exampleConfigPath);
