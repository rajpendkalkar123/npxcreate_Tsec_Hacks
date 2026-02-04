const hre = require("hardhat");

async function main() {
  const deploymentInfo = require('../deployments/hoodi.json');
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('🔍 Checking Contract State\n');
  console.log('='.repeat(60));
  console.log('📍 Address:', deployer.address);
  console.log('');
  
  const rangerToken = await hre.ethers.getContractAt(
    "RangerToken",
    deploymentInfo.contracts.RangerToken
  );
  
  // Check if user has any tokens
  console.log('📊 Token Balances:');
  for (let tokenId = 1; tokenId <= 5; tokenId++) {
    try {
      const balance = await rangerToken.balanceOf(deployer.address, tokenId);
      if (balance > 0n) {
        console.log(`   Token ID ${tokenId}: ${balance.toString()} units`);
        
        // Get receipt details
        const details = await rangerToken.getReceiptDetails(tokenId);
        console.log(`      - Total Supply: ${details.supply.toString()}`);
        console.log(`      - IPFS Hash: ${details.ipfsHash}`);
        console.log(`      - Valid: ${details.valid}`);
        console.log(`      - Expiry: ${new Date(Number(details.expiry) * 1000).toLocaleDateString()}`);
        console.log('');
      }
    } catch (e) {
      // Token doesn't exist
      break;
    }
  }
  
  // Check roles
  console.log('🔑 Roles:');
  const MINTER_ROLE = await rangerToken.MINTER_ROLE();
  const BANK_ROLE = await rangerToken.BANK_ROLE();
  const DEFAULT_ADMIN_ROLE = await rangerToken.DEFAULT_ADMIN_ROLE();
  
  console.log(`   MINTER_ROLE: ${await rangerToken.hasRole(MINTER_ROLE, deployer.address)}`);
  console.log(`   BANK_ROLE: ${await rangerToken.hasRole(BANK_ROLE, deployer.address)}`);
  console.log(`   DEFAULT_ADMIN_ROLE: ${await rangerToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)}`);
  console.log('');
  
  // Check warehouse registration
  const roleRegistry = await hre.ethers.getContractAt(
    "RoleRegistry",
    deploymentInfo.contracts.RoleRegistry
  );
  
  const warehouseInfo = await roleRegistry.warehouses(deployer.address);
  console.log('🏭 Warehouse Status:');
  console.log(`   Registered: ${warehouseInfo.isActive}`);
  if (warehouseInfo.isActive) {
    console.log(`   WDRA Reg No: ${warehouseInfo.wdraRegNo}`);
    console.log(`   Location: ${warehouseInfo.location}`);
  }
  
  console.log('\n' + '='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
