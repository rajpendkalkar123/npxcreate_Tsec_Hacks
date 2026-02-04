# Croplock - Blockchain Backend Development Guide

## 📋 Project Overview

**Croplock** (Ranger) is a blockchain-based platform for tokenizing WDRA-compliant Electronic Negotiable Warehouse Receipts (eNWRs). It enables farmers to:
- Tokenize agricultural commodities stored in WDRA-registered warehouses
- Trade eNWR tokens peer-to-peer with instant settlements
- Access loans by pledging tokens as collateral
- Maintain self-custody and full ownership control

### Tech Stack
- **Framework**: Hardhat
- **Language**: Solidity ^0.8.20
- **Token Standard**: ERC-1155 (multi-token with batch operations)
- **Libraries**: OpenZeppelin v5
- **Network**: Hoodisuite Testnet
- **Metadata Storage**: IPFS (off-chain)

---

## 🏗️ Architecture

### Smart Contracts

#### 1. **RoleRegistry.sol**
- Manages WDRA-registered warehouse operators and empaneled banks
- Provides role-based access control for ecosystem participants
- Functions:
  - `registerWarehouse(address, wdraRegNo, location)` - Register warehouse
  - `registerBank(address, name, licenseNo)` - Register bank/lender
  - `isWarehouseActive(address)` - Check warehouse status

#### 2. **RangerToken.sol** (Core eNWR Token)
- ERC-1155 implementation representing warehouse receipts
- 1 token = 1 kg of commodity
- Features:
  - Receipt issuance with IPFS metadata (WDRA Form A)
  - Expiry tracking and validation
  - Pledge/unpledge for loan collateral
  - Transfer restrictions (pledged/expired tokens)
- Key Functions:
  - `issueReceipt(farmer, quantity, expiry, ipfsHash)` - Mint eNWR
  - `pledgeCollateral(tokenId, amount, lender)` - Lock tokens
  - `unpledgeCollateral(tokenId, farmer, amount)` - Release tokens
  - `isValid(tokenId)` - Check expiry status
  - `uri(tokenId)` - Get IPFS metadata URI

#### 3. **Marketplace.sol**
- Peer-to-peer trading platform for eNWR tokens
- Instant payment settlements (Finternet integration)
- Functions:
  - `listForSale(tokenId, quantity, pricePerKg)` - Create listing
  - `buyToken(listingId, quantity)` - Purchase tokens
  - `cancelListing(listingId)` - Cancel listing

#### 4. **LendingPool.sol**
- Loan management with eNWR collateral
- Rule-based loan disbursement and repayment
- Functions:
  - `offerLoan(farmer, tokenId, collateral, loanAmount, interestRate, duration)` - Bank offers loan
  - `acceptLoan(offerId)` - Farmer accepts and receives funds
  - `repayLoan(offerId)` - Repay loan and release collateral
  - `liquidateCollateral(offerId)` - Liquidate overdue loans

#### 5. **MockFinternetGateway.sol**
- Test implementation of payment gateway
- Replace with actual Finternet SDK in production
- Interface: `IFinternetGateway.sol`

### Data Flow

```
Farmer Deposits Commodity
         ↓
Warehouse Issues eNWR (RangerToken.issueReceipt)
         ↓
Token appears in Farmer's wallet (IPFS metadata: WDRA Form A)
         ↓
    [Option A: Trade]              [Option B: Loan]
         ↓                                ↓
Marketplace.listForSale         Pledge collateral
         ↓                                ↓
Buyer purchases                 Bank offers loan
         ↓                                ↓
Payment via Finternet          Disbursement via Finternet
         ↓                                ↓
Token transferred              Farmer repays → Unpledge
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+ and npm
- Git
- Wallet with testnet tokens (for deployment)

### 1. Clone and Install Dependencies
```bash
cd Blockchain
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in:
```bash
# Hoodisuite Testnet Configuration
HOODISUITE_RPC_URL=https://rpc-testnet.hoodisuite.com
CHAIN_ID=12345
PRIVATE_KEY=your_private_key_here

# Block Explorer (for verification)
BLOCK_EXPLORER_URL=https://explorer.hoodisuite.com
BLOCK_EXPLORER_API=https://explorer-api.hoodisuite.com
ETHERSCAN_API_KEY=your_api_key_here

# Finternet Gateway (if applicable)
FINTERNET_GATEWAY_ADDRESS=0x0000000000000000000000000000000000000000
```

**⚠️ IMPORTANT**: Never commit `.env` file to Git!

### 3. Compile Contracts
```bash
npx hardhat compile
```

### 4. Run Tests
```bash
npx hardhat test
```

Expected output:
```
  Croplock - Complete Integration Tests
    ✔ Should register warehouse with WDRA details
    ✔ Should issue eNWR token with IPFS metadata
    ✔ Should pledge tokens as collateral
    ✔ Should list tokens for sale
    ✔ Should offer loan against pledged collateral
    ...
  60 passing (5s)
```

### 5. Deploy to Local Network (for testing)
```bash
npx hardhat node  # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2
```

### 6. Deploy to Hoodisuite Testnet
```bash
npx hardhat run scripts/deploy.js --network hoodisuite
```

Deployment output saved to `deployments/hoodisuite.json`

---

## 📝 WDRA Compliance

### Form A Metadata Structure
Each eNWR token links to an IPFS JSON file containing WDRA Form A fields:

```json
{
  "name": "eNWR - Wheat Receipt #WB/MUM/2024/001",
  "description": "WDRA-compliant Electronic Negotiable Warehouse Receipt",
  "attributes": [
    {"trait_type": "Receipt Number", "value": "WB/MUM/2024/001"},
    {"trait_type": "WDRA Registration No", "value": "WDRA-MH-2023-123"},
    {"trait_type": "Commodity Name", "value": "Wheat"},
    {"trait_type": "Quantity (kg)", "value": 5000},
    {"trait_type": "Market Value at Deposit", "value": "₹25,000"},
    {"trait_type": "Insurance Policy No", "value": "INS-2024-XYZ"},
    {"trait_type": "Stack/Lot Number", "value": "STACK-A-12"},
    {"trait_type": "Valid Until", "value": "2024-12-31"}
  ]
}
```

**Example**: See `metadata/wheat_receipt_example.json`

### Compliance Features
- ✅ **Receipt Expiry**: On-chain `expiryTimestamp` prevents expired trades
- ✅ **Insurance Tracking**: Off-chain metadata includes policy details
- ✅ **Market Value Snapshot**: Used for Loan-to-Value (LTV) calculations
- ✅ **Non-Transferability**: Pledged tokens cannot be transferred
- ✅ **Immutable Records**: IPFS ensures tamper-proof metadata

---

## 🛠️ Common Commands

### Development
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run specific test
npx hardhat test --grep "Should issue eNWR"

# Test coverage
npx hardhat coverage

# Clean artifacts
npx hardhat clean
```

### Deployment
```bash
# Local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Testnet
npx hardhat run scripts/deploy.js --network hoodisuite

# Verify contract (if block explorer supports it)
npx hardhat verify --network hoodisuite <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Interaction (Hardhat Console)
```bash
npx hardhat console --network hoodisuite
```

Example interactions:
```javascript
const RangerToken = await ethers.getContractAt("RangerToken", "0x...");
const balance = await RangerToken.balanceOf("0xFarmerAddress", 1);
console.log("Farmer balance:", balance.toString());
```

---

## 🧪 Testing Strategy

### Unit Tests (Isolated)
- Role registration and access control
- Token issuance with valid/invalid parameters
- Pledge logic and balance checks
- Expiry validation

### Integration Tests (End-to-End)
- Complete lifecycle: Issue → Pledge → Loan → Repay
- Marketplace flow: List → Buy → Transfer
- Cross-contract interactions

### Test Coverage
```bash
npx hardhat coverage
```

Target: >90% line coverage for production deployment

---

## 🔐 Security Considerations

### Implemented Guards
1. **ReentrancyGuard**: Prevents reentrancy attacks on Marketplace/LendingPool
2. **Access Control**: Role-based permissions (MINTER_ROLE, BANK_ROLE)
3. **Pausable**: Emergency stop mechanism for RangerToken
4. **Transfer Restrictions**: Prevents transfer of pledged/expired tokens
5. **Input Validation**: Checks for zero addresses, zero amounts, etc.

### Pre-Audit Checklist
- [ ] Run Slither static analysis: `slither .`
- [ ] Run Mythril security scanner
- [ ] Test with Hardhat gas reporter
- [ ] Review OpenZeppelin contracts used
- [ ] Manual code review of custom logic

### Production Recommendations
- [ ] Professional smart contract audit (CertiK, Trail of Bits, etc.)
- [ ] Multisig wallet for admin operations
- [ ] Timelock for critical functions
- [ ] Bug bounty program

---

## 📊 Gas Optimization

### Current Strategy
- ERC-1155 for batch operations (saves gas vs. ERC-721)
- Minimal on-chain storage (heavy data in IPFS)
- Solidity optimizer enabled (200 runs)

### Estimated Gas Costs (Local Network)
- Deploy RoleRegistry: ~1.5M gas
- Deploy RangerToken: ~3.5M gas
- Issue eNWR: ~150k gas
- Pledge collateral: ~80k gas
- Marketplace listing: ~120k gas
- Loan acceptance: ~200k gas

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Insufficient funds for gas"
**Solution**: Get testnet tokens from Hoodisuite faucet

#### 2. "Receipt expired" error during transfer
**Solution**: Check expiry timestamp: `await rangerToken.isValid(tokenId)`

#### 3. "Insufficient unpledged balance"
**Solution**: Check pledge status: `await rangerToken.getPledgeStatus(tokenId, farmer)`

#### 4. Compilation errors with OpenZeppelin
**Solution**: Ensure correct versions:
```bash
npm install @openzeppelin/contracts@^5.0.0
```

#### 5. Deployment script fails
**Solution**: 
- Check `.env` file configuration
- Verify RPC URL is accessible
- Ensure private key has sufficient balance

---

## 📚 Additional Resources

### Documentation
- [Hardhat Docs](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/5.x/)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [WDRA eNWR Guidelines](https://wdra.nic.in/)

### Tools
- [Remix IDE](https://remix.ethereum.org/) - Browser-based Solidity IDE
- [Etherscan](https://etherscan.io/) - Block explorer
- [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/) - Local IPFS node

---

## 🚧 Next Steps After Deployment

### 1. Register Participants
```javascript
// Register warehouse operators
await roleRegistry.registerWarehouse(
  "0xWarehouseAddress", 
  "WDRA-MH-2023-123", 
  "Mumbai Central Warehouse"
);

// Grant MINTER_ROLE
await rangerToken.grantRole(MINTER_ROLE, "0xWarehouseAddress");

// Register banks
await roleRegistry.registerBank(
  "0xBankAddress",
  "State Bank of India",
  "BANK-LIC-001"
);
```

### 2. Upload Metadata to IPFS
```bash
# Using IPFS CLI
ipfs add metadata/wheat_receipt_example.json
# Returns: QmExampleHash...

# Or use Pinata/Infura IPFS pinning services
```

### 3. Issue First eNWR
```javascript
const expiryTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year
await rangerToken.issueReceipt(
  "0xFarmerAddress",
  5000, // 5000 kg
  expiryTime,
  "ipfs://QmExampleHash/wheat_receipt.json"
);
```

### 4. Integrate Frontend
- Use ethers.js v6 to connect to deployed contracts
- Implement wallet connection (MetaMask, WalletConnect)
- Display eNWR tokens with IPFS metadata
- Build adaptive dashboard for farmers/banks/warehouses

---

## 📞 Support

For questions or issues:
1. Check this documentation
2. Review test cases for usage examples
3. Consult Hardhat/OpenZeppelin docs
4. Open GitHub issue (if applicable)

---

## ✅ Implementation Checklist

### Phase 1: Core Contracts ✅
- [x] RoleRegistry with WDRA compliance
- [x] RangerToken (ERC-1155) with IPFS mapping
- [x] Pledge/unpledge mechanism
- [x] Transfer restrictions (pledged/expired)
- [x] Emergency pause functionality

### Phase 2: Trading & Lending ✅
- [x] Marketplace for P2P trading
- [x] LendingPool with collateral management
- [x] Finternet Gateway interface
- [x] Mock Gateway for testing

### Phase 3: Testing & Deployment ✅
- [x] Comprehensive unit tests (60+ test cases)
- [x] Integration tests (end-to-end flows)
- [x] Deployment script with role setup
- [x] Network configuration (Hoodisuite)

### Phase 4: Production Readiness (Pending)
- [ ] Security audit
- [ ] Gas optimization review
- [ ] Frontend integration
- [ ] Replace MockFinternetGateway with production SDK
- [ ] Multisig setup for admin operations
- [ ] Monitoring and alerting

---

**Last Updated**: February 4, 2026  
**Version**: 1.0.0  
**Network**: Hoodisuite Testnet
