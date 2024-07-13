// const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
// const { expect } = require('chai');
// const { ethers } = require('hardhat');
// const config = require('../../../config.json');
// const { getContractAt } = require('../scripts/utils/ethers');
// const { useRpcProvider } = require('../scripts/utils/useRpcProvider');
// const { deployFullTREXSuiteFixture } = require('./fixtures');
// const { deployIdentity } = require('../scripts/identities/deploy-identity');
// const { deployClaimIssuer } = require('../scripts/claimIssuer/deploy-claim-issuer');
// const { CLAIM_TOPICS, CLAIM_TOPICS_OBJ } = require('../scripts/claims/claimTopics');
// const { addClaim } = require('../scripts/claims/add-claim');
// const { addKeyToIdentity } = require('../scripts/claimIssuer/addKeyToIdentity');
// const { getClaimsByTopic } = require('../scripts/claims/getClaimsByTopic');
// const { v4 } = require('uuid');

// describe('End to end test', async function () {
//     let provider;
//     let signer;
//     let trustedIssuersRegistry;
//     let studentWallet;
//     let studentIdentity;
//     let identityFactory;
//     let claimIssuerWallet;
//     let claimIssuer;
    

//     beforeEach(async function () {
//         provider = new ethers.JsonRpcProvider(config.rpc);
//         signer = new ethers.Wallet(config.deployer.privateKey, provider);

//         identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer);
//         trustedIssuersRegistry = getContractAt(config.trex.trustedIssuersRegistry.address, config.trex.trustedIssuersRegistry.abi, provider);

//         studentIdentity = await deployIdentity(identityFactory, studentWallet.address, v4(), signer);

//         console.log('Claimissuerwallet:', claimIssuerWallet)

//         const {claimIssuerContract } = await deployClaimIssuer(trustedIssuersRegistry, CLAIM_TOPICS, claimIssuerWallet, provider, 3117, config.deployer.privateKey);
//         claimIssuer = claimIssuerContract;

//     });

//     it('Student should be able to ask for a certificate', async function () {
//         const issuers = await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(ethers.id(CLAIM_TOPICS_OBJ.INSTITUTION));
//         expect(issuers).to.have.lengthOf(1);
//         expect(issuers[0]).to.equal(claimIssuer.address);

//         // For each issuer in the config file, search for the institution that matches the institution code 
//         for (const issuer of issuers) {
//             // Get contract of the issuer, by searching the issuer address in the configuration file
//             for (const institution of config.institutions) {
//                 if (institution.address === issuer && institution.institutionID === 3117) {
//                     const issuerWallet = getWallet(institution.wallet.privateKey, provider);
//                     await addKeyToIdentity(studentIdentity, studentWallet, issuerWallet, 3, 1);
//                 }
//             }
//         }

//         expect(await studentIdentity.getKeysByPurpose(3)).to.have.lengthOf(1);
//         expect(await studentIdentity.getKeysByPurpose(3)).to.be.deep.equal(
//             ethers.keccak256(
//                 ethers.AbiCoder.defaultAbiCoder().encode(
//                     ['address'],
//                     [claimIssuerWallet.address]
//                 )
//             )
//         );

//         // Self assign the student number and name (CLAIM_TOPICS: STUDENT)
//         await addClaim(trustedIssuersRegistry, studentIdentity, studentIdentity, studentWallet, CLAIM_TOPICS_OBJ.STUDENT, form.name);
//         const claims = await addClaim(trustedIssuersRegistry, studentIdentity, studentIdentity, studentWallet, CLAIM_TOPICS_OBJ.STUDENT, form.studentNumber);

//         expect(await getClaimsByTopic(studentIdentity, CLAIM_TOPICS_OBJ.STUDENT)).to.have.lengthOf(2);
//         expect(await getClaimsByTopic(studentIdentity, CLAIM_TOPICS_OBJ.STUDENT)).to.be.deep.equal(claims);
        
//     })
// });
