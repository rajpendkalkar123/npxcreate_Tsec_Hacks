const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing automated MINTER_ROLE grant via RoleRegistry...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with admin wallet:", deployer.address);

  // Contract addresses
  const roleRegistryAddress = "0x8e6d0c2c657FEB01A3fb853f8cbDd89d1D039a8c";
  const rangerTokenAddress = "0x85d0D64e765cC3434D932da58A39eC49F75E3EDd";

  // Get contracts
  const roleRegistry = await hre.ethers.getContractAt("RoleRegistry", roleRegistryAddress);
  const rangerToken = await hre.ethers.getContractAt("RangerToken", rangerTokenAddress);
  
  const MINTER_ROLE = await rangerToken.MINTER_ROLE();

  // Test warehouse address (use a random address for testing)
  const testWarehouse = "0x1234567890123456789012345678901234567890";
  
  console.log("📍 Test warehouse address:", testWarehouse);
  console.log("\n1️⃣ Checking initial MINTER_ROLE status...");
  const hasRoleBeforewallet = await rangerToken.hasRole(MINTER_ROLE, testWarehouse);
  console.log("   Has MINTER_ROLE:", hasRoleBeforewallet);

  console.log("\n2️⃣ Registering warehouse via RoleRegistry...");
  const tx = await roleRegistry.registerWarehouse(
    testWarehouse,
    "WDRA-TEST-2026-001",
    "Test Warehouse Location"
  );
  console.log("   Transaction sent:", tx.hash);
  await tx.wait();
  console.log("   ✅ Transaction confirmed");

  console.log("\n3️⃣ Verifying MINTER_ROLE was automatically granted...");
  const hasRoleAfter = await rangerToken.hasRole(MINTER_ROLE, testWarehouse);
  console.log("   Has MINTER_ROLE:", hasRoleAfter);

  console.log("\n4️⃣ Verifying warehouse is active in RoleRegistry...");
  const isActive = await roleRegistry.isWarehouseActive(testWarehouse);
  console.log("   Is Active:", isActive);

  if (hasRoleAfter && isActive) {
    console.log("\n🎉 SUCCESS! Automated MINTER_ROLE grant is working!");
    console.log("   ✅ Warehouse registered in RoleRegistry");
    console.log("   ✅ MINTER_ROLE automatically granted in RangerToken");
  } else {
    console.log("\n❌ FAILED! Something went wrong:");
    console.log("   MINTER_ROLE granted:", hasRoleAfter);
    console.log("   Warehouse active:", isActive);
  }

  // Cleanup: Deactivate test warehouse
  console.log("\n5️⃣ Testing deactivation (should revoke MINTER_ROLE)...");
  const deactivateTx = await roleRegistry.deactivateWarehouse(testWarehouse);
  await deactivateTx.wait();
  console.log("   ✅ Warehouse deactivated");

  const hasRoleAfterDeactivate = await rangerToken.hasRole(MINTER_ROLE, testWarehouse);
  const isActiveAfterDeactivate = await roleRegistry.isWarehouseActive(testWarehouse);
  console.log("   Has MINTER_ROLE after deactivate:", hasRoleAfterDeactivate);
  console.log("   Is Active after deactivate:", isActiveAfterDeactivate);

  if (!hasRoleAfterDeactivate && !isActiveAfterDeactivate) {
    console.log("\n🎉 Deactivation also works correctly!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
