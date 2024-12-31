// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract FileStorage {
    // Mapping to store file hashes (off-chain) linked to Ethereum addresses
    mapping(address => bytes32) private fileHashes;

    // Event emitted when a new file hash is stored
    event FileStored(address indexed user, bytes32 fileHash);

    // Function to store a file hash
    function storeFileHash(bytes32 _fileHash) external {
        fileHashes[msg.sender] = _fileHash;
        emit FileStored(msg.sender, _fileHash);
    }

    // Function to retrieve a file hash
    function getFileHash() external view returns (bytes32) {
        return fileHashes[msg.sender];
    }
}
