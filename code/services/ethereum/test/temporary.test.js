const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const config = require('../../../config.json');
const { getClaimsByTopic } = require('../scripts/claims/getClaimsByTopic');
const { getIdentity } = require('../scripts/identities/getIdentity');
const { getContractAt } = require('../scripts/utils/ethers');
const { useRpcProvider } = require('../scripts/utils/useRpcProvider');
const { CLAIM_TOPICS_OBJ } = require('../scripts/claims/claimTopics');
const hash = require('../scripts/utils/hash');

describe('Temporary', function () {
    it(' jsdnsand', async function () {
        
        const signer = useRpcProvider(config.rpc, config.deployer.privateKey)
        const identityFactory = getContractAt(config.identityFactory.address, config.identityFactory.abi, signer)
        const identity = await getIdentity('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', identityFactory, signer)



        const claims = await getClaimsByTopic(identity, CLAIM_TOPICS_OBJ.CERTIFICATE)

        console.log(claims)
        expect(claims[0].data).to.be.equal(hash('https://example.com'))
        

        
    })
})