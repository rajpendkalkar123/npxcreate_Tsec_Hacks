// Script to check and grant warehouse role
const hre = require("hardhat");

async function main() {
  console.log("🔐 Fixing REGISTRY_ADMIN_ROLE for admin wallet...\n");

  const [deployer] = await hre.ethers.getSigners();
  const adminWallet = "0x8916DD1311c17aD008bB56bE3378E001a92e4375";
  const roleRegistryAddress = "0xA7Fc01ad4b5b188A300bdBc47b1e6E2540E8DE8a";

  console.log("Admin wallet:", adminWallet);
  console.log("RoleRegistry:", roleRegistryAddress);
  console.log("Deployer:", deployer.address);

  const roleRegistry = await hre.ethers.getContractAt("RoleRegistry", roleRegistryAddress);

  // Get roles
  const REGISTRY_ADMIN_ROLE = await roleRegistry.REGISTRY_ADMIN_ROLE();
  const DEFAULT_ADMIN_ROLE = await roleRegistry.DEFAULT_ADMIN_ROLE();

  console.log("\n📊 Current Status:");
  const hasRegistryAdmin = await roleRegistry.hasRole(REGISTRY_ADMIN_ROLE, adminWallet);
  const hasDefaultAdmin = await roleRegistry.hasRole(DEFAULT_ADMIN_ROLE, adminWallet);
  
  console.log("Has REGISTRY_ADMIN_ROLE:", hasRegistryAdmin);
  console.log("Has DEFAULT_ADMIN_ROLE:", hasDefaultAdmin);

  if (!hasRegistryAdmin) {
    console.log("\n⚠️  Missing REGISTRY_ADMIN_ROLE. Granting now...");
    const tx = await roleRegistry.grantRole(REGISTRY_ADMIN_ROLE, adminWallet);
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ REGISTRY_ADMIN_ROLE granted!");
  } else {
    console.log("\n✅ Already has REGISTRY_ADMIN_ROLE");
  }

  if (!hasDefaultAdmin) {
    console.log("\n⚠️  Missing DEFAULT_ADMIN_ROLE. Granting now...");
    const tx = await roleRegistry.grantRole(DEFAULT_ADMIN_ROLE, adminWallet);
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ DEFAULT_ADMIN_ROLE granted!");
  } else {
    console.log("✅ Already has DEFAULT_ADMIN_ROLE");
  }

  console.log("\n🎉 Admin wallet is now ready to register warehouses!");
}

async function oldMain() {
  const warehouseAddress = "0x8916DD1311c17aD008bB56bE3378E001a92e4375"; // Your wallet
  
  console.log("\n🔍 Checking warehouse registration...");
  console.log("Address:", warehouseAddress);
  
  // Get contracts
  const roleRegistry = await hre.ethers.getContractAt(
    "RoleRegistry",
    "0x956C171BDE2ec7Bb2a2fb2D650E128a02dAa549B"
  );
  
  const rangerToken = await hre.ethers.getContractAt(
    "RangerToken",
    "0x85d0D64e765cC3434D932da58A39eC49F75E3EDd"
  );
  
  // Check if warehouse is registered in RoleRegistry
  const isActive = await roleRegistry.isWarehouseActive(warehouseAddress);
  console.log("\n📋 RoleRegistry Status:");
  console.log("  - Is warehouse active:", isActive);
  
  if (!isActive) {
    console.log("\n❌ Warehouse not registered! Registering now...");
    const tx = await roleRegistry.registerWarehouse(
      warehouseAddress,
      "WDRA-TEST-2024-001",
      "Mumbai, Maharashtra"
    );
    await tx.wait();
    console.log("✅ Warehouse registered in RoleRegistry");
  }
  
  // Check MINTER_ROLE in RangerToken
  const MINTER_ROLE = await rangerToken.MINTER_ROLE();
  const hasMinterRole = await rangerToken.hasRole(MINTER_ROLE, warehouseAddress);
  
  console.log("\n🎫 RangerToken Status:");
  console.log("  - Has MINTER_ROLE:", hasMinterRole);
  
  if (!hasMinterRole) {
    console.log("\n❌ MINTER_ROLE not granted! Granting now...");
    const tx = await rangerToken.grantRole(MINTER_ROLE, warehouseAddress);
    await tx.wait();
    console.log("✅ MINTER_ROLE granted to warehouse");
  }
  
  // Final verification
  console.log("\n✅ Final Status:");
  const finalActive = await roleRegistry.isWarehouseActive(warehouseAddress);
  const finalMinter = await rangerToken.hasRole(MINTER_ROLE, warehouseAddress);
  console.log("  - Warehouse active:", finalActive);
  console.log("  - Has MINTER_ROLE:", finalMinter);
  
  if (finalActive && finalMinter) {
    console.log("\n🎉 SUCCESS! Wallet is ready to mint eNWR tokens!");
  } else {
    console.log("\n⚠️ WARNING: Setup incomplete. Please check manually.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
