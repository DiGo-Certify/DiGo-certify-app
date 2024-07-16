const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const CryptoJS = require('crypto-js');
const { useRpcProvider } = require('../utils/useRpcProvider');

// Carregar o ABI do contrato a partir do arquivo JSON
const contractJsonPath = path.join(
    __dirname,
    '../../artifacts/contracts/config/FileStorage.sol/FileStorage.json'
);
console.log('Json path ' + contractJsonPath);
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
const contractABI = contractJson.abi;

const HARCODED_RPC = 'https://4442-2001-8a0-f972-ce00-5c99-9c8e-a23f-8595.ngrok-free.app';
const FILE_STORAGE_CONTRACT = '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44';
const HARD_CODED_PRIVATE_KEY =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    
async function getFileStorage() {
    const provider = useRpcProvider(HARCODED_RPC, HARD_CODED_PRIVATE_KEY);
    const contractAddress = FILE_STORAGE_CONTRACT;
    const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
    );

    return contract;
}

module.exports = { getFileStorage };
