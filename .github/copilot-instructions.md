# Copilot instructions (repo-specific)

## Project Overview
**Croplock (Ranger)** - WDRA-compliant tokenized warehouse receipt platform deployed on Hoodi testnet.

## Deployed Contracts (Hoodi Testnet - Chain ID: 560048)
- **RoleRegistry**: `0x4D4826DF5ebe538E24dB6D51bD2f0ffD262cdc93`
- **RangerToken (ERC-1155)**: `0x6f2BABe73a29295d9650525bBcFF98A585b55E5b`
- **Marketplace**: `0xd159Cf6f961aA1e9be863Bf3542933A827c4bd8a`
- **LendingPool**: `0x45c4Addc4125eF21c26eAFd2BA31E4ca079DC8d0`
- **MockFinternetGateway**: `0x07efDf0110a170392D17eb8e42Fa5C69ce81659b`

**Explorer**: https://hoodi.etherscan.io

## Architecture
- `Blockchain/contracts/` - 5 smart contracts (Solidity ^0.8.20)
  - RangerToken.sol: ERC-1155 eNWR tokenization with IPFS metadata
  - Marketplace.sol: P2P trading with instant settlements
  - LendingPool.sol: Collateralized loans against eNWR tokens
  - RoleRegistry.sol: WDRA warehouse & bank registration
  - MockFinternetGateway.sol: Payment gateway (replace in production)
- `Blockchain/test/` - 60+ test cases covering full lifecycle
- `Blockchain/scripts/deploy.js` - Deployment script with role setup

## Key Patterns
1. **IPFS Tokenization**: Each tokenId maps to IPFS URI with WDRA Form A metadata
2. **Pledge System**: Tokens locked as collateral cannot be transferred
3. **Expiry Validation**: Expired receipts blocked from all operations
4. **Role-Based Access**: MINTER_ROLE (warehouses), BANK_ROLE (lenders), ADMIN_ROLE

## Development Workflows
```bash
# Blockchain development
cd Blockchain
npm run compile          # Compile contracts
npm test                 # Run tests
npm run deploy:hoodi     # Deploy to Hoodi testnet
npx hardhat console --network hoodi  # Interact with deployed contracts
```

## Critical Files
- `Blockchain/.env` - **NEVER COMMIT** (contains private key)
- `Blockchain/DEPLOYMENT.md` - Deployment details & integration guide
- `Blockchain/DEVELOPMENT.md` - Full development guide
- `metadata/wheat_receipt_example.json` - WDRA Form A structure

## When Adding Features
- Update tests in `test/Croplock.test.js`
- Document in DEVELOPMENT.md
- Check ABIs in `artifacts/contracts/` after compilation
- For frontend integration: use deployed addresses from `deployments/hoodi.json`

## References
- Network: Hoodi testnet (RPC: https://ethereum-hoodi-rpc.publicnode.com)
- Token standard: ERC-1155
- Framework: Hardhat v2.22
- Libraries: OpenZeppelin v5
