const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const CryptoJS = require('crypto-js');
const { FILE } = require('dns');

// Carregar o ABI do contrato a partir do arquivo JSON
const contractJsonPath = path.join(
    __dirname,
    'artifacts/contracts/FileStorage.sol/FileStorage.json'
);
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
const contractABI = contractJson.abi;

const HARCODED_RPC = 'http://localhost:8545';
const FILE_STORAGE_CONTRACT = '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44';

async function getFileStorage() {
    const provider = new ethers.providers.JsonRpcProvider(HARCODED_RPC);
    const contractAddress = FILE_STORAGE_CONTRACT;
    const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
    );

    return contract;
}
