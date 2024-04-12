# ONCHAINID

[ONCHAINID](https://docs.onchainid.com/docs/concepts/intro) is a set of smart contracts(ERC743-735) and applications that allows someone to be identified digitally and to assign them rights over a descentralized infrastructure.

Every entity can have attached to them CHAINID `Claims` that are verified by a third party.

## Claims

Claims are issued by a **Claim Issuer** that is allowed by the identity owner to publish claims about the entity.

Example:

- Isel (Claim Issuer) can emit a claim that says that `John Doe` is a portuguese citizen.

This claim is assigned by the Claim Issuer **BUT** is the entity owner that decided whether or not a claim is added to hir/her identity.

And if it is `sensitive information`?

## Storing Claims

- The Claim Issuer will store the claim private data on secure off-chain servers and publish publicity on-chain a signature attesting the data verification.

- Therefore, anyone knows that a trusted thirt party has successfully checked the identity.

- To access the data, the entity will need explicit consent of the Identity Owner allowing the consultation of the private data.

Claims are stored in the **Identity Contract** thanks tot he function `ClaimHolder`implemented in standard **ERC735**, that are implemented on the Identity Contract.

### Good Pratices for Storing Claims

To ensure compliance, a hash of the private data should be stored with the claim added to the Identity. This hash should not only be referenced to the list of possibilities (i.e. gendr, country, age, ...) beccause it can be easy to find the provate data from the hash. It is important to hash a concatenation of data with another data that is not part on the list of claim (e.g. last name or first name of the user).

## If you want to use it, ONCHAINID provides:

- The smart contracts to be used for identity management on the blockchain, based on the ERC734/735 standards (such contracts are already used in production on both Ethereum and Polygon by TREX tokens stakeholders);

- Documentations, APIs and SDKs (Software Development Kits) to create and interact with these identities (in particular for trusted third parties);

- Interfaces needed to create and administer the identities, as part or independently of a security token subscription process.

## Enrich and Control Identity Information

The service that deployed the Identity will probably store name, email, phone, address, etc. A service that stores and diffuses information about the identity is called `Information Provider`

Any service provider is able to request this information from Information Provider and it only provides the data if the service provider is allowed to access it.


## Questions:

- Why the contract IdFactory does not exist but Factory does?
- What is the _isLibrary flag in the Identity contract? 
- After the identity is created now they have this:
  - Identity Contract (The identity itself)
  - Implementation Authority 
  - Identity Factory 
- Why do they need the implementation authority and the identity factory?

- What does the addKey function do?
  - It is used after we created the contract of a ClaimIssuer into an entity.

My interpretation is that the addKey function is used to say that an entity is now a ClaimIssuer and can issue claims about other entities.
Is that correct? 