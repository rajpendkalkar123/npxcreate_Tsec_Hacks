const { ethers } = require("hardhat");

async function main() {
  const ROLE_REGISTRY_ADDRESS = "0x4D4826DF5ebe538E24dB6D51bD2f0ffD262cdc93";
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  
  // The warehouse address trying to issue tokens
  const WAREHOUSE_ADDRESS = "0x8916DD1311c17aD008bB56bE3378E001a92e4375";
  
  console.log("🔍 Checking warehouse registration status...\n");
  
  // Get deployer (should have admin role)
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  
  // Get contracts
  const roleRegistry = await ethers.getContractAt("RoleRegistry", ROLE_REGISTRY_ADDRESS);
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  
  // Check if warehouse is registered
  const warehouseInfo = await roleRegistry.warehouses(WAREHOUSE_ADDRESS);
  console.log("\n📋 Warehouse Info:");
  console.log("  WDRA Reg No:", warehouseInfo.wdraRegNo);
  console.log("  Location:", warehouseInfo.location);
  console.log("  Is Active:", warehouseInfo.isActive);
  
  const timestamp = Number(warehouseInfo.registeredAt);
  if (timestamp > 0) {
    console.log("  Registered At:", new Date(timestamp * 1000).toISOString());
  } else {
    console.log("  Registered At: N/A");
  }
  
  if (warehouseInfo.isActive) {
    console.log("\n✅ Warehouse is already registered and active!");
  } else if (warehouseInfo.wdraRegNo && warehouseInfo.wdraRegNo !== "") {
    console.log("\n⚠️  Warehouse is registered but NOT active!");
    console.log("Activating warehouse...");
    const activateTx = await roleRegistry.connect(deployer).updateWarehouseStatus(WAREHOUSE_ADDRESS, true);
    await activateTx.wait();
    console.log("✅ Warehouse activated!");
  } else {
    console.log("\n❌ Warehouse not found in registry!");
    console.log("Registering warehouse...");
    
    // Register the warehouse
    const registerTx = await roleRegistry.connect(deployer).registerWarehouse(
      WAREHOUSE_ADDRESS,
      "WDRA-MH-2023-123",
      "Mumbai Central Warehouse"
    );
    await registerTx.wait();
    console.log("✅ Warehouse registered!");
  }
  
  // Check MINTER_ROLE
  console.log("\n🔐 Checking MINTER_ROLE...");
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const hasRole = await rangerToken.hasRole(MINTER_ROLE, WAREHOUSE_ADDRESS);
  console.log(`  Has MINTER_ROLE: ${hasRole}`);
  
  if (!hasRole) {
    console.log("Granting MINTER_ROLE...");
    const grantTx = await rangerToken.connect(deployer).grantRole(MINTER_ROLE, WAREHOUSE_ADDRESS);
    await grantTx.wait();
    console.log("✅ MINTER_ROLE granted!");
  } else {
    console.log("✅ Already has MINTER_ROLE!");
  }
  
  // Final verification
  console.log("\n🎯 Final Verification:");
  const isActive = await roleRegistry.isWarehouseActive(WAREHOUSE_ADDRESS);
  const stillHasRole = await rangerToken.hasRole(MINTER_ROLE, WAREHOUSE_ADDRESS);
  
  console.log(`  Warehouse Active: ${isActive}`);
  console.log(`  Has MINTER_ROLE: ${stillHasRole}`);
  
  if (isActive && stillHasRole) {
    console.log("\n✅✅✅ ALL CHECKS PASSED! Warehouse can now issue eNWR tokens!");
  } else {
    console.log("\n❌ Something is still wrong. Manual intervention needed.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
