require('dotenv').config();
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
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
const contractABI = contractJson.abi;
//0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
const HARDCODED_RPC = 'http://localhost:8545';
const FILE_STORAGE_CONTRACT = '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44';
const HARD_CODED_PRIVATE_KEY =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const SECRET_KEY = 'change-it'; // A chave secreta usada para cifrar e decifrar

async function saveFileStorage(filePath) {
    try {
        const provider = useRpcProvider(HARDCODED_RPC, HARD_CODED_PRIVATE_KEY);
        const contractAddress = FILE_STORAGE_CONTRACT;
        const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            provider
        );
        const signer = new ethers.Wallet(
            HARD_CODED_PRIVATE_KEY,
            contract.provider
        );

        // Ler o conteúdo do arquivo
        const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });

        // Cifrar o conteúdo do arquivo
        const encryptedContent = CryptoJS.AES.encrypt(
            fileContent,
            SECRET_KEY
        ).toString();

        // Calcular o hash do conteúdo cifrado
        const fileHash = CryptoJS.SHA256(encryptedContent).toString();

        // Armazenar o hash na blockchain
        const tx = await contract
            .connect(signer)
            .storeFileHash(ethers.getBytes('0x' + fileHash));
        await tx.wait();

        console.log('Hash armazenado na blockchain com sucesso');

        // Retornar o conteúdo cifrado para armazenar off-chain
        return encryptedContent;
    } catch (error) {
        console.error('Erro ao cifrar e armazenar o hash do arquivo:', error);
        throw error;
    }
}

const configFilePath = path.join(__dirname, 'seu_arquivo_config.json');

// saveFileStorage(configFilePath)
//     .then(encryptedContent => {
//         // Salvar o conteúdo cifrado off-chain (por exemplo, em um arquivo)
//         const encryptedFilePath = path.join(__dirname, 'encrypted_config.json');
//         fs.writeFileSync(encryptedFilePath, encryptedContent, 'utf8');
//         console.log('Conteúdo cifrado salvo com sucesso:', encryptedFilePath);
//     })
//     .catch(error => {
//         console.error('Erro ao executar encryptAndSave:', error);
//     });

module.exports = { saveFileStorage };
