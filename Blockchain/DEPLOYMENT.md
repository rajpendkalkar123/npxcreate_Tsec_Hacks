# Croplock Blockchain - Deployment Summary

## 🎉 Successfully Deployed to Hoodi Testnet!

**Network**: Hoodi Testnet (Chain ID: 560048)  
**Deployer**: 0x8916DD1311c17aD008bB56bE3378E001a92e4375  
**Block Explorer**: https://hoodi.etherscan.io

---

## 📋 Deployed Contract Addresses

### Core Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| **RoleRegistry** | `0x44eb9CBB67624c43f5e24D1ACe95Ac9De2ae010d` | Manages warehouse & bank registration |
| **RangerToken** (ERC-1155) | `0x6E46fA6317F082F4c9D56e31c305a80e94Faac85` | eNWR tokenization with IPFS metadata |
| **Marketplace** | `0xD3f4369C3d8cA381Bc8Cb290c540dAc20Ba255b0` | P2P trading platform |
| **LendingPool** | `0xC00d5B92C459E9B207ccC16eaCce8af178f888cE` | Loan management with collateral |
| **MockFinternetGateway** | `0x6Ab158A01276Dea31794EE1c7cf75a57536Dce76` | Payment gateway (mock for testing) |

**View on Explorer**:
- RoleRegistry: https://hoodi.etherscan.io/address/0x44eb9CBB67624c43f5e24D1ACe95Ac9De2ae010d
- RangerToken: https://hoodi.etherscan.io/address/0x6E46fA6317F082F4c9D56e31c305a80e94Faac85
- Marketplace: https://hoodi.etherscan.io/address/0xD3f4369C3d8cA381Bc8Cb290c540dAc20Ba255b0
- LendingPool: https://hoodi.etherscan.io/address/0xC00d5B92C459E9B207ccC16eaCce8af178f888cE

---

## ✅ What's Been Configured

1. ✅ **BANK_ROLE** granted to LendingPool contract
2. ✅ All contracts interconnected (RangerToken ↔ Marketplace ↔ LendingPool)
3. ✅ Access control roles defined (MINTER_ROLE, BANK_ROLE, REGISTRY_ADMIN_ROLE)

---

## 📝 Next Steps to Complete Setup

### 1. Register Warehouse Operators
```javascript
// Connect to RoleRegistry
const roleRegistry = await ethers.getContractAt("RoleRegistry", "0x44eb9CBB67624c43f5e24D1ACe95Ac9De2ae010d");

// Register warehouse with WDRA details
await roleRegistry.registerWarehouse(
  "0xWarehouseOperatorAddress",
  "WDRA-MH-2023-123", // WDRA Registration Number
  "Mumbai Central Warehouse"
);

// Grant MINTER_ROLE to warehouse
const rangerToken = await ethers.getContractAt("RangerToken", "0x6E46fA6317F082F4c9D56e31c305a80e94Faac85");
const MINTER_ROLE = await rangerToken.MINTER_ROLE();
await rangerToken.grantRole(MINTER_ROLE, "0xWarehouseOperatorAddress");
```

### 2. Register Banks/Lenders
```javascript
// Register bank
await roleRegistry.registerBank(
  "0xBankAddress",
  "State Bank of India",
  "BANK-LIC-001"
);

// Grant BANK_ROLE
const BANK_ROLE = await rangerToken.BANK_ROLE();
await rangerToken.grantRole(BANK_ROLE, "0xBankAddress");
```

### 3. Issue First eNWR Token
```javascript
// Upload metadata to IPFS first
const ipfsHash = "ipfs://QmYourHash/wheat_receipt.json";

// Issue receipt (by warehouse operator)
const expiryTime = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year
await rangerToken.issueReceipt(
  "0xFarmerAddress",
  5000, // 5000 kg
  expiryTime,
  ipfsHash
);
```

---

## 🔗 Integration with Frontend

### Web3 Setup (ethers.js v6)
```javascript
import { ethers } from "ethers";

// Connect to Hoodi testnet
const provider = new ethers.JsonRpcProvider("https://ethereum-hoodi-rpc.publicnode.com");
const signer = new ethers.Wallet(privateKey, provider);

// Contract instances
const rangerToken = new ethers.Contract(
  "0x6E46fA6317F082F4c9D56e31c305a80e94Faac85",
  rangerTokenABI,
  signer
);

const marketplace = new ethers.Contract(
  "0xD3f4369C3d8cA381Bc8Cb290c540dAc20Ba255b0",
  marketplaceABI,
  signer
);

const lendingPool = new ethers.Contract(
  "0xC00d5B92C459E9B207ccC16eaCce8af178f888cE",
  lendingPoolABI,
  signer
);
```

### Example: List Token for Sale
```javascript
// Approve marketplace to transfer tokens
await rangerToken.setApprovalForAll(marketplace.address, true);

// List 3000 kg for 0.01 ETH per kg
const pricePerKg = ethers.parseEther("0.01");
await marketplace.listForSale(tokenId, 3000, pricePerKg);
```

### Example: Pledge and Get Loan
```javascript
// Pledge collateral
await rangerToken.pledgeCollateral(tokenId, 3000, bankAddress);

// Bank offers loan (5% interest, 30 days)
await lendingPool.connect(bankSigner).offerLoan(
  farmerAddress,
  tokenId,
  3000, // collateral
  ethers.parseEther("10"), // 10 ETH loan
  500, // 5% interest (basis points)
  30 * 24 * 60 * 60 // 30 days
);

// Farmer accepts loan
await lendingPool.connect(farmerSigner).acceptLoan(offerId);
```

---

## 📊 Contract ABIs

ABIs are located in:
```
Blockchain/artifacts/contracts/
├── RoleRegistry.sol/RoleRegistry.json
├── RangerToken.sol/RangerToken.json
├── Marketplace.sol/Marketplace.json
├── LendingPool.sol/LendingPool.json
└── MockFinternetGateway.sol/MockFinternetGateway.json
```

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run specific test
npx hardhat test --grep "Should issue eNWR"

# Test coverage
npm run test:coverage

# Deploy to local network for testing
npm run node  # Terminal 1
npm run deploy:local  # Terminal 2
```

---

## 🔐 Security Notes

1. ✅ `.env` file properly gitignored (contains private key)
2. ✅ ReentrancyGuard enabled on Marketplace & LendingPool
3. ✅ Access Control via OpenZeppelin's AccessControl
4. ✅ Pausable mechanism for emergency stops
5. ⚠️ **Replace MockFinternetGateway with production SDK before mainnet**

---

## 📚 Documentation

- **Full Dev Guide**: See `DEVELOPMENT.md`
- **Architecture**: See contract comments and NatSpec
- **WDRA Compliance**: Metadata example in `metadata/wheat_receipt_example.json`

---

## 🛠️ Useful Commands

```bash
# Interact with contracts
npx hardhat console --network hoodi

# Check deployment
cat deployments/hoodi.json

# Verify contract (if Etherscan API available)
npx hardhat verify --network hoodi 0x6E46fA6317F082F4c9D56e31c305a80e94Faac85 "0x44eb9CBB67624c43f5e24D1ACe95Ac9De2ae010d"
```

---

## 🎯 Deployment Checklist

- [x] Compile all contracts
- [x] Deploy to Hoodi testnet
- [x] Grant BANK_ROLE to LendingPool
- [ ] Register warehouse operators
- [ ] Register banks/lenders
- [ ] Upload IPFS metadata
- [ ] Issue first test eNWR
- [ ] Test P2P trading flow
- [ ] Test loan disbursement flow
- [ ] Integrate with frontend
- [ ] Security audit

---

**Deployment Date**: February 4, 2026  
**Gas Used**: ~8.5M gas total  
**Network**: Hoodi Testnet (560048)
