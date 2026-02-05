# Croplock (Ranger) - WDRA-Compliant Tokenized Warehouse Receipt Platform

> **TSEC Hacks 2026 Project** - Deployed on Hoodi Testnet (Chain ID: 560048)

## 🌾 Project Overview

Croplock (Ranger) is a blockchain-based platform that tokenizes agricultural warehouse receipts as ERC-1155 NFTs (eNWRs), enabling farmers to access credit by using stored crops as collateral. The platform is compliant with India's Warehousing Development and Regulation Act (WDRA) requirements.

### Key Features
- **ERC-1155 eNWR Tokenization** - Each token represents stored agricultural commodities with IPFS metadata
- **P2P Marketplace** - Direct trading of warehouse receipts between farmers and traders
- **Collateralized Lending** - Farmers can pledge eNWRs to access loans from registered banks
- **WDRA Compliance** - Automated warehouse registration, role management, and expiry validation
- **Finternet Payment Integration** - Mock gateway for real-time settlements (production-ready interface)

---

## 🚀 Deployed Contracts (Hoodi Testnet)

**Deployment Date:** February 5, 2026  
**Deployer Address:** `0x8916DD1311c17aD008bB56bE3378E001a92e4375`  
**Network:** Hoodi Testnet (Chain ID: 560048)  
**Block Explorer:** https://hoodi.etherscan.io

| Contract | Address | Purpose |
|----------|---------|---------|
| **RoleRegistry** | [`0xA7Fc01ad4b5b188A300bdBc47b1e6E2540E8DE8a`](https://hoodi.etherscan.io/address/0xA7Fc01ad4b5b188A300bdBc47b1e6E2540E8DE8a) | Warehouse & bank registration with automatic MINTER_ROLE management |
| **RangerToken** | [`0x5b76201EA96A3D94a7bA107514357A490f8E76FD`](https://hoodi.etherscan.io/address/0x5b76201EA96A3D94a7bA107514357A490f8E76FD) | ERC-1155 eNWR token contract with pledge system |
| **Marketplace** | [`0xD7751F0470D1898E47c272074413E71cEd140AC2`](https://hoodi.etherscan.io/address/0xD7751F0470D1898E47c272074413E71cEd140AC2) | P2P trading with 2.5% platform fee |
| **LendingPool** | [`0x792085c0D236ABd3C76305E9Fba605Fe1dC6F4CC`](https://hoodi.etherscan.io/address/0x792085c0D236ABd3C76305E9Fba605Fe1dC6F4CC) | Collateralized loans with 5% annual interest |
| **MockFinternetGateway** | [`0xC1B6C2eD61Cb818a59a734f1298DB30806646118`](https://hoodi.etherscan.io/address/0xC1B6C2eD61Cb818a59a734f1298DB30806646118) | Payment gateway (replace in production) |

### Network Configuration
```javascript
{
  chainId: 560048,
  chainName: 'Hoodi Testnet',
  rpcUrl: 'https://ethereum-hoodi-rpc.publicnode.com',
  blockExplorer: 'https://hoodi.etherscan.io',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
}
```

---

## 📁 Project Structure

```
npxcreate_Tsec_Hacks/
├── Blockchain/                      # Smart contracts & deployment
│   ├── contracts/
│   │   ├── RoleRegistry.sol         # ⭐ Auto-grants MINTER_ROLE on registration
│   │   ├── RangerToken.sol          # ERC-1155 eNWR with IPFS metadata
│   │   ├── Marketplace.sol          # P2P trading platform
│   │   ├── LendingPool.sol          # Collateralized lending
│   │   └── MockFinternetGateway.sol # Payment gateway stub
│   ├── scripts/
│   │   ├── deploy.js                # Main deployment script
│   │   ├── issueEWR.js              # Test token issuance
│   │   └── checkBalance.js          # Check wallet status
│   ├── test/
│   │   └── Croplock.test.js         # 60+ comprehensive tests
│   ├── deployments/
│   │   └── hoodi.json               # Deployment addresses
│   └── RangerToken_flattened.sol    # For Etherscan verification
│
├── frontend/                        # Next.js 16.1 (React 19) UI
│   ├── src/
│   │   ├── app/                     # App router pages
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── login/               # Privy authentication
│   │   │   └── dashboard/           # Role-based dashboard
│   │   ├── components/
│   │   │   ├── admin/               # Admin panel (role management, fees)
│   │   │   ├── authority/           # Warehouse crop inspection form
│   │   │   ├── farmer/              # Farmer token management
│   │   │   ├── bank/                # Lender loan management
│   │   │   └── marketplace/         # Trading interface
│   │   └── lib/
│   │       ├── contracts.ts         # ⭐ Contract addresses (updated)
│   │       ├── web3Provider.tsx     # Privy + MetaMask integration
│   │       ├── ipfs.ts              # Pinata IPFS integration
│   │       └── abis/                # Contract ABIs
│   └── .env.local                   # Privy & Pinata config
│
├── metadata/                        # WDRA Form A examples
│   └── wheat_receipt_example.json
│
└── docs/                            # Project documentation
    ├── ADMIN_GUIDE.md
    ├── SECURITY_IMPROVEMENTS.md
    └── FUTURE_IMPROVEMENTS.md
```

---

## 🔧 Tech Stack

### Blockchain
- **Solidity:** ^0.8.20
- **Framework:** Hardhat v2.22
- **Token Standard:** ERC-1155 (OpenZeppelin v5)
- **Access Control:** Role-based (MINTER_ROLE, BANK_ROLE, ADMIN_ROLE)
- **Network:** Hoodi Testnet

### Frontend
- **Framework:** Next.js 16.1.6 with Turbopack
- **React:** 19.0.0
- **Web3:** ethers.js 6.16.0
- **Authentication:** Privy (app ID: `cml8at2ap033sl20cozup6es0`)
- **UI:** Tailwind CSS, shadcn/ui, Radix UI
- **Storage:** IPFS via Pinata

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js >= 18.x
npm or yarn
MetaMask wallet (for blockchain transactions)
```

### 1. Install Dependencies

```bash
# Blockchain
cd Blockchain
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Blockchain/.env:**
```env
PRIVATE_KEY=your_private_key_here
HOODI_RPC_URL=https://ethereum-hoodi-rpc.publicnode.com
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_PRIVY_APP_ID=cml8at2ap033sl20cozup6es0
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
```

### 3. Run the Application

```bash
# Start frontend dev server
cd frontend
npm run dev
# Open http://localhost:3000
```

### 4. Deploy Contracts (if needed)

```bash
cd Blockchain
npm run compile
npm run deploy:hoodi
```

---

## 👥 User Roles & Workflows

### 1. Admin
**Access:** Admin panel via dashboard after login

**Capabilities:**
- Register WDRA-approved warehouses (auto-grants MINTER_ROLE)
- Register empaneled banks
- Activate/deactivate warehouses and banks
- Withdraw platform fees (2.5% marketplace, 5% lending)

**Key Feature:** Registering a warehouse in RoleRegistry automatically grants MINTER_ROLE in RangerToken (no manual script needed!)

### 2. Warehouse Authority
**Access:** Crop inspection form after login with registered warehouse wallet

**Workflow:**
1. Login with MetaMask (warehouse wallet)
2. Fill crop inspection form (farmer address, commodity details)
3. Upload metadata to IPFS
4. Issue eNWR token on blockchain
5. QR code generated for farmer

**Requirements:**
- Must be registered in RoleRegistry by admin
- Wallet must have MINTER_ROLE (auto-granted on registration)
- Must use MetaMask for transactions (Privy is view-only)

### 3. Farmer
**Access:** Dashboard shows owned eNWR tokens

**Capabilities:**
- View all owned warehouse receipts
- List tokens on marketplace
- Pledge tokens as loan collateral
- Redeem physical commodities (burns token)

### 4. Bank/Lender
**Access:** Loan management interface

**Capabilities:**
- Create loan offers (LTV ratio, interest rate, duration)
- Accept pledged eNWRs as collateral
- Manage active loans
- Liquidate defaulted loans

### 5. Trader
**Capabilities:**
- Browse marketplace listings
- Purchase eNWR tokens
- Redeem physical commodities from warehouse

---

## 🔐 Security Features

1. **Role-Based Access Control** - Only authorized warehouses can mint tokens
2. **Expiry Validation** - Expired receipts blocked from all operations
3. **Pledge System** - Pledged tokens cannot be transferred until loan settled
4. **Warehouse Deactivation Protection** - Cannot deactivate warehouses with active tokens
5. **WDRA Form A Compliance** - Complete metadata stored on IPFS
6. **Reentrancy Guards** - All critical functions protected

---

## 📝 Development Commands

### Blockchain
```bash
cd Blockchain

# Compile contracts
npm run compile

# Run tests (60+ test cases)
npm test

# Deploy to Hoodi testnet
npm run deploy:hoodi

# Flatten contract for Etherscan verification
npx hardhat flatten contracts/RangerToken.sol > RangerToken_flattened.sol

# Interact with contracts
npx hardhat console --network hoodi

# Check wallet status
npx hardhat run scripts/checkBalance.js --network hoodi

# Issue test token
npx hardhat run scripts/issueEWR.js --network hoodi
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run type-check

# Lint
npm run lint
```

---

## 🧪 Testing

Full test coverage with Hardhat:

```bash
cd Blockchain
npm test
```

**Test Coverage:**
- ✅ Token minting & transfers
- ✅ Marketplace listings & purchases
- ✅ Loan creation & repayment
- ✅ Collateral pledge & liquidation
- ✅ Role management
- ✅ Expiry validation
- ✅ Edge cases & security scenarios

---

## 📊 Platform Economics

### Marketplace
- **Platform Fee:** 2.5% per transaction
- **Instant Settlement:** Via Finternet Gateway
- **Fee Withdrawal:** Admin only

### Lending Pool
- **Interest Rate:** Configurable per loan offer
- **Platform Fee:** 5% of interest earned
- **LTV Ratio:** Set by lender (typically 50-80%)
- **Liquidation:** Automatic if loan defaults after maturity

---

## 🔄 Contract Verification on Etherscan

**Why Verify?**  
Unverified contracts won't show NFT transfers or token details on block explorers.

**How to Verify:**
1. Go to https://hoodi.etherscan.io/address/0x5b76201EA96A3D94a7bA107514357A490f8E76FD#code
2. Click "Verify and Publish"
3. Upload `Blockchain/RangerToken_flattened.sol`
4. Compiler: v0.8.20, Optimization: Yes (200 runs)
5. Submit

See `Blockchain/ETHERSCAN_VERIFICATION.md` for detailed instructions.

---

## 🗺️ Deployment History

| Date | Event | Contract | Address |
|------|-------|----------|---------|
| **2026-02-05** | **Latest Deployment** | All contracts | See table above ⬆️ |
| 2026-02-04 | Upgraded RoleRegistry | RoleRegistry | 0x8e6d0c2c657FEB01A3fb853f8cbDd89d1D039a8c |
| 2026-02-04 | Initial deployment | All contracts | (deprecated) |

---

## 🛠️ Admin Setup Guide

After deployment, follow these steps:

### 1. Register Your Admin Wallet
```bash
# Already done during deployment
# Admin wallet: 0x8916DD1311c17aD008bB56bE3378E001a92e4375
```

### 2. Register a Warehouse
Via Admin Panel UI or script:
```bash
npx hardhat run scripts/grantWarehouseRole.js --network hoodi
```

**Important:** Registering via admin panel automatically grants MINTER_ROLE!

### 3. Register a Bank
Via Admin Panel → Role Management → Register Bank

### 4. Test Token Issuance
Login with warehouse wallet → Crop Inspection Form → Issue eNWR

---

## 🐛 Troubleshooting

### "Execution reverted (0xe2517d3f)"
- **Cause:** Wallet missing MINTER_ROLE
- **Fix:** Admin must register warehouse via Role Management panel

### Privy wallet can't issue tokens
- **Cause:** Privy embedded wallets are view-only
- **Fix:** Logout and login with MetaMask for blockchain transactions

### NFT not showing on Etherscan
- **Cause:** Contract not verified
- **Fix:** Follow verification steps above

### Transaction fails silently
- **Cause:** Insufficient gas or network issues
- **Fix:** Check wallet has test ETH, verify RPC connection

---

## 📚 Additional Documentation

- **Admin Guide:** `docs/ADMIN_GUIDE.md`
- **Security Notes:** `docs/SECURITY_IMPROVEMENTS.md`
- **Future Roadmap:** `docs/FUTURE_IMPROVEMENTS.md`
- **Blockchain Details:** `Blockchain/README.md`
- **Contract Verification:** `Blockchain/ETHERSCAN_VERIFICATION.md`

---

## 🤝 Contributing

This is a hackathon project. For production deployment:

1. Replace MockFinternetGateway with actual Finternet integration
2. Implement proper KYC/AML for bank registration
3. Add oracle price feeds for accurate collateral valuation
4. Conduct professional security audit
5. Deploy to Ethereum mainnet or production L2

---

## 📄 License

MIT License - See individual contract headers for details

---

## 🏆 TSEC Hacks 2026

**Team:** Ranger  
**Category:** Blockchain/DeFi  
**Focus:** Agricultural Finance & Supply Chain

**Contact:** [Your contact info]

---

## ⚡ Quick Reference Card

```
Network:      Hoodi Testnet (560048)
RPC:          https://ethereum-hoodi-rpc.publicnode.com
Explorer:     https://hoodi.etherscan.io

Frontend:     http://localhost:3000
Privy App:    cml8at2ap033sl20cozup6es0

Admin Wallet: 0x8916DD1311c17aD008bB56bE3378E001a92e4375

Key Contracts:
- RangerToken:  0x5b76201EA96A3D94a7bA107514357A490f8E76FD
- RoleRegistry: 0xA7Fc01ad4b5b188A300bdBc47b1e6E2540E8DE8a
- Marketplace:  0xD7751F0470D1898E47c272074413E71cEd140AC2
```

---

**Last Updated:** February 5, 2026  
**Deployment Version:** v2.0 (Auto-MINTER_ROLE)
