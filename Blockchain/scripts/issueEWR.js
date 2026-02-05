const hre = require("hardhat");
const { uploadJsonToPinata, createWDRAMetadata } = require('../utils/ipfs');
require('dotenv').config();

async function main() {
  console.log('🌾 Complete eNWR Issuance Workflow\n');
  console.log('='.repeat(60));

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  const farmerAddress = "0x8916DD1311c17aD008bB56bE3378E001a92e4375"; // Use deployer as farmer for testing
  console.log('👤 Deployer (Warehouse):', deployer.address);
  console.log('👨‍🌾 Farmer:', farmerAddress);
  console.log('');

  // Load deployed contracts
  const deploymentInfo = require('../deployments/hoodi.json');
  
  const rangerToken = await hre.ethers.getContractAt(
    "RangerToken",
    deploymentInfo.contracts.RangerToken
  );
  
  const roleRegistry = await hre.ethers.getContractAt(
    "RoleRegistry",
    deploymentInfo.contracts.RoleRegistry
  );

  // Step 1: Register warehouse (if not already registered)
  console.log('1️⃣  Registering warehouse...');
  try {
    const warehouseInfo = await roleRegistry.warehouses(deployer.address);
    if (warehouseInfo.isActive) {
      console.log('   ✅ Warehouse already registered');
    } else {
      await roleRegistry.registerWarehouse(
        deployer.address,
        "WDRA-MH-2023-123",
        "Mumbai Central Warehouse"
      );
      console.log('   ✅ Warehouse registered');
    }
  } catch (error) {
    console.log('   ⚠️  Registration check failed, attempting to register...');
    try {
      await roleRegistry.registerWarehouse(
        deployer.address,
        "WDRA-MH-2023-123",
        "Mumbai Central Warehouse"
      );
      console.log('   ✅ Warehouse registered');
    } catch (e) {
      console.log('   ℹ️  Warehouse may already be registered');
    }
  }

  // Step 2: Grant MINTER_ROLE to deployer (warehouse)
  console.log('\n2️⃣  Granting MINTER_ROLE...');
  const MINTER_ROLE = await rangerToken.MINTER_ROLE();
  const hasRole = await rangerToken.hasRole(MINTER_ROLE, deployer.address);
  
  if (!hasRole) {
    const grantTx = await rangerToken.grantRole(MINTER_ROLE, deployer.address);
    await grantTx.wait();
    console.log('   ✅ MINTER_ROLE granted');
  } else {
    console.log('   ✅ MINTER_ROLE already granted');
  }

  // Step 3: Create and upload metadata to IPFS
  console.log('\n3️⃣  Creating WDRA Form A metadata...');
  const currentDate = new Date();
  const expiryDate = new Date(currentDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
  
  const receiptData = {
    receiptNumber: 'WB/MUM/2024/001',
    wdraRegNo: 'WDRA-MH-2023-123',
    depositorAccountNo: 'FAR-001-2024',
    commodityName: 'Wheat',
    qualityGrade: 'FAQ (Fair Average Quality)',
    numberOfPackages: 100,
    quantity: 5000, // kg
    marketValue: '₹250,000',
    stackLotNumber: 'STACK-A-12',
    warehouseLocation: 'Mumbai Central Warehouse, Maharashtra',
    insurancePolicyNo: 'INS-2024-FIRE-XYZ789',
    insuranceCompany: 'National Insurance Company Ltd.',
    insuranceValidFrom: currentDate.toISOString().split('T')[0],
    insuranceValidTo: expiryDate.toISOString().split('T')[0],
    storageRate: '₹2.00/kg/month',
    handlingRate: '₹0.50/kg',
    issuedDate: currentDate.toISOString().split('T')[0],
    validUntil: expiryDate.toISOString().split('T')[0], // 1 year expiry
    depositorName: 'Ramesh Kumar',
    warehousemanName: 'Maharashtra Warehousing Corp.'
  };

  const metadata = createWDRAMetadata(receiptData);
  console.log('   ✅ Metadata created (1 year expiry)');
  console.log('   📅 Valid until:', receiptData.validUntil);

  console.log('\n4️⃣  Uploading to IPFS via Pinata...');
  const { ipfsHash, ipfsUrl } = await uploadJsonToPinata(
    metadata,
    `wheat_receipt_${receiptData.receiptNumber.replace(/\//g, '_')}.json`
  );

  // Step 4: Issue eNWR token
  console.log('\n5️⃣  Issuing eNWR token on-chain...');
  const quantity = receiptData.quantity;
  const expiryTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year

  const issueTx = await rangerToken.issueReceipt(
    farmerAddress,
    quantity,
    expiryTimestamp,
    ipfsUrl
  );
  const receipt = await issueTx.wait();
  
  // Get tokenId from event
  const event = receipt.logs.find(log => {
    try {
      return rangerToken.interface.parseLog(log).name === 'ReceiptIssued';
    } catch (e) {
      return false;
    }
  });
  const tokenId = event ? rangerToken.interface.parseLog(event).args.tokenId : 1;

  console.log('   ✅ eNWR Token Issued!');
  console.log('   Token ID:', tokenId.toString());
  console.log('   Quantity:', quantity, 'kg');
  console.log('   Owner:', farmerAddress);

  // Step 5: Verify token details
  console.log('\n6️⃣  Verifying token details...');
  const balance = await rangerToken.balanceOf(farmerAddress, tokenId);
  const tokenUri = await rangerToken.uri(tokenId);
  const isValid = await rangerToken.isValid(tokenId);

  console.log('   Balance:', balance.toString(), 'tokens (kg)');
  console.log('   Metadata URI:', tokenUri);
  console.log('   Valid:', isValid);

  console.log('\n' + '='.repeat(60));
  console.log('✅ eNWR Issuance Complete!');
  console.log('='.repeat(60));
  console.log('📋 Summary:');
  console.log('   Token ID:', tokenId.toString());
  console.log('   Farmer:', farmerAddress);
  console.log('   Quantity:', quantity, 'kg');
  console.log('   IPFS Hash:', ipfsHash);
  console.log('   View Metadata:', `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
  console.log('   View Token:', `https://hoodi.etherscan.io/token/${rangerToken.target}?a=${tokenId}`);
  console.log('\n💡 Next Steps:');
  console.log('   - Trade on Marketplace: marketplace.listForSale()');
  console.log('   - Pledge for loan: rangerToken.pledgeCollateral()');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
