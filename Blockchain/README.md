# Croplock - Tokenized Warehouse Receipt Platform

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow)](https://hardhat.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**Croplock (Ranger)** is a WDRA-compliant blockchain platform for tokenizing Electronic Negotiable Warehouse Receipts (eNWRs), enabling farmers to access liquidity through peer-to-peer trading and collateralized loans.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Git

### Installation
```bash
cd Blockchain
npm install
```

### Deploy & Test
```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Hoodi testnet
npm run deploy:hoodi

# Issue your first eNWR
npm run issue:ewr
```

---

## 📋 Deployed Contracts (Hoodi Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **RoleRegistry** | `0x44eb9CBB67624c43f5e24D1ACe95Ac9De2ae010d` | Warehouse & bank registration |
| **RangerToken** | `0x6E46fA6317F082F4c9D56e31c305a80e94Faac85` | ERC-1155 eNWR tokens |
| **Marketplace** | `0xD3f4369C3d8cA381Bc8Cb290c540dAc20Ba255b0` | P2P trading |
| **LendingPool** | `0xC00d5B92C459E9B207ccC16eaCce8af178f888cE` | Collateralized loans |

**Explorer**: [https://hoodi.etherscan.io](https://hoodi.etherscan.io)

---

## 🏗️ Architecture

### Smart Contracts
```
contracts/
├── RoleRegistry.sol          # WDRA warehouse & bank registration
├── RangerToken.sol            # ERC-1155 eNWR tokenization with IPFS
├── Marketplace.sol            # P2P trading with instant settlements
├── LendingPool.sol            # Loan management with collateral
├── MockFinternetGateway.sol   # Payment gateway (mock)
└── interfaces/
    └── IFinternetGateway.sol  # Payment gateway interface
```

### Key Features
- ✅ **WDRA Compliance**: Metadata follows WDRA Form A structure
- ✅ **IPFS Integration**: Immutable metadata storage via Pinata
- ✅ **ERC-1155**: Efficient multi-token standard (1 token = 1 kg)
- ✅ **Pledge System**: Tokens locked as collateral cannot be transferred
- ✅ **Expiry Validation**: Expired receipts blocked from operations
- ✅ **Role-Based Access**: Warehouse operators, banks, and admin roles

---

## 📝 Usage Examples

### Issue eNWR Token
```javascript
const rangerToken = await ethers.getContractAt("RangerToken", "0x6E46...");

// Upload metadata to IPFS
const metadata = createWDRAMetadata({
  receiptNumber: "WB/MUM/2024/001",
  commodityName: "Wheat",
  quantity: 5000,
  // ... WDRA Form A fields
});
const { ipfsUrl } = await uploadJsonToPinata(metadata);

// Issue token
await rangerToken.issueReceipt(
  farmerAddress,
  5000, // 5000 kg
  expiryTimestamp,
  ipfsUrl
);
```

### List for Sale (Marketplace)
```javascript
const marketplace = await ethers.getContractAt("Marketplace", "0xD3f4...");

// Approve marketplace
await rangerToken.setApprovalForAll(marketplace.address, true);

// List 3000 kg for 0.01 ETH per kg
await marketplace.listForSale(tokenId, 3000, ethers.parseEther("0.01"));
```

### Pledge & Get Loan
```javascript
// Farmer pledges collateral
await rangerToken.pledgeCollateral(tokenId, 3000, bankAddress);

// Bank offers loan (5% interest, 30 days)
await lendingPool.offerLoan(
  farmerAddress,
  tokenId,
  3000, // collateral
  ethers.parseEther("10"), // 10 ETH
  500, // 5% (basis points)
  30 * 24 * 60 * 60
);

// Farmer accepts
await lendingPool.acceptLoan(offerId);
```

---

## 🧪 Testing

```bash
# Run all tests (60+ test cases)
npm test

# Test coverage
npm run test:coverage

# Run specific test
npx hardhat test --grep "Should issue eNWR"
```

### Test Coverage
- ✅ Role registration & access control
- ✅ eNWR issuance with IPFS metadata
- ✅ Pledge/unpledge mechanics
- ✅ Transfer restrictions (pledged/expired)
- ✅ P2P marketplace flows
- ✅ Loan lifecycle (offer → accept → repay)
- ✅ Collateral liquidation

---

## 🛠️ Development Commands

```bash
# Blockchain development
npm run compile          # Compile contracts
npm test                 # Run tests
npm run deploy:hoodi     # Deploy to Hoodi testnet
npm run issue:ewr        # Issue eNWR with IPFS metadata
npm run upload:metadata  # Upload metadata to IPFS
npm run console:hoodi    # Hardhat console

# Cleanup
npm run clean            # Clean artifacts
```

---

## 📊 WDRA Compliance

Each eNWR token links to IPFS metadata following **WDRA Form A**:

```json
{
  "name": "eNWR - Wheat Receipt #WB/MUM/2024/001",
  "attributes": [
    {"trait_type": "Receipt Number", "value": "WB/MUM/2024/001"},
    {"trait_type": "WDRA Registration No", "value": "WDRA-MH-2023-123"},
    {"trait_type": "Commodity Name", "value": "Wheat"},
    {"trait_type": "Quantity (kg)", "value": 5000},
    {"trait_type": "Market Value", "value": "₹250,000"},
    {"trait_type": "Insurance Policy No", "value": "INS-2024-XYZ"},
    {"trait_type": "Valid Until", "value": "2024-12-31"}
  ]
}
```

**Example**: [View on IPFS](https://gateway.pinata.cloud/ipfs/Qmf1Cj8k5vvYN1NmseumAUJK4vibG8zuQrCMYb3oJ8Ujbx)

---

## 🔐 Security

- ✅ **OpenZeppelin** contracts (AccessControl, ReentrancyGuard, Pausable)
- ✅ **Transfer Restrictions**: Pledged/expired tokens blocked
- ✅ **Role-Based Access**: MINTER_ROLE, BANK_ROLE, ADMIN_ROLE
- ✅ **Emergency Pause**: Admin can pause operations
- ⚠️ **Audit Recommended**: Before mainnet deployment

---

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide & contract addresses
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Full development guide
- **[metadata/](metadata/)** - WDRA Form A examples

---

## 🌐 Network Configuration

**Hoodi Testnet**
- RPC: `https://ethereum-hoodi-rpc.publicnode.com`
- Chain ID: `560048`
- Explorer: `https://hoodi.etherscan.io`
- Faucet: [Get test tokens]

---

## 🛣️ Roadmap

- [x] Core contracts (RangerToken, Marketplace, LendingPool)
- [x] IPFS integration via Pinata
- [x] Deploy to Hoodi testnet
- [x] Comprehensive test suite
- [ ] Frontend dashboard (farmers, banks, warehouses)
- [ ] Production Finternet Gateway integration
- [ ] Security audit
- [ ] Mainnet deployment

---

## 📞 Support

- **Documentation**: See [DEVELOPMENT.md](DEVELOPMENT.md)
- **Issues**: Check deployed contracts on [Hoodi Explorer](https://hoodi.etherscan.io)
- **Tests**: Review [test/Croplock.test.js](test/Croplock.test.js)

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

**Built with** ❤️ **for Indian farmers** 🌾

*Croplock - Empowering farmers through blockchain technology*
