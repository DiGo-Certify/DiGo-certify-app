const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const CryptoJS = require('crypto-js');
const { getFileStorage } = require('../../scripts/config/get-file-storage');
const { saveFileStorage } = require('../../scripts/config/save-file-storage');

const HARD_CODED_PRIVATE_KEY =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('File Encryption and Storage Tests', function () {
    const configFilePath = path.join(__dirname, 'config.json');
    const encryptedFilePath = path.join(__dirname, 'encrypted_config.json');
    const SECRET_KEY = 'change-it'; // A chave secreta usada para cifrar e decifrar

    before(async function () {
        // Criar um arquivo de configuração de teste
        const configContent = JSON.stringify({ key: 'value' });
        fs.writeFileSync(configFilePath, configContent, 'utf8');
    });

    after(function () {
        // Limpar arquivos de teste
        if (fs.existsSync(configFilePath)) {
            fs.unlinkSync(configFilePath);
        }
        if (fs.existsSync(encryptedFilePath)) {
            fs.unlinkSync(encryptedFilePath);
        }
    });

    it('should encrypt and save the file hash on the blockchain', async function () {
        const contract = await getFileStorage();
        const signer = new ethers.Wallet(
            HARD_CODED_PRIVATE_KEY,
            contract.provider
        );

        const tx = await saveFileStorage(configFilePath);
        await tx.wait();

        // Verificar se o conteúdo cifrado foi salvo off-chain
        const encryptedContent = fs.readFileSync(encryptedFilePath, 'utf8');
        expect(encryptedContent).to.be.a('string');

        // Verificar se o hash foi armazenado na blockchain
        const fileHashBytes32 = await contract.connect(signer).getFileHash();
        const fileHash = ethers.utils.parseBytes32String(fileHashBytes32);
        expect(fileHash).to.be.a('string');
    });

    // it('should fetch and decrypt the file content', async function() {
    //     await fetchAndDecrypt(encryptedFilePath);

    //     // Verificar se o conteúdo foi restaurado corretamente
    //     const decryptedContent = fs.readFileSync(configFilePath, 'utf8');
    //     const originalContent = JSON.stringify({ key: 'value' });
    //     expect(decryptedContent).to.equal(originalContent);
    // });
});
