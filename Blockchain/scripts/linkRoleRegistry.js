const hre = require("hardhat");

async function main() {
  console.log("🔧 Fixing RoleRegistry → RangerToken permissions...\n");

  const roleRegistryAddress = "0xA7Fc01ad4b5b188A300bdBc47b1e6E2540E8DE8a";
  const rangerTokenAddress = "0x5b76201EA96A3D94a7bA107514357A490f8E76FD";

  console.log("RoleRegistry:", roleRegistryAddress);
  console.log("RangerToken:", rangerTokenAddress);

  const rangerToken = await hre.ethers.getContractAt("RangerToken", rangerTokenAddress);

  // Get DEFAULT_ADMIN_ROLE
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"; // bytes32(0)

  console.log("\n📊 Checking current status...");
  const hasRole = await rangerToken.hasRole(DEFAULT_ADMIN_ROLE, roleRegistryAddress);
  console.log("RoleRegistry has DEFAULT_ADMIN_ROLE:", hasRole);

  if (!hasRole) {
    console.log("\n⚠️  RoleRegistry doesn't have DEFAULT_ADMIN_ROLE in RangerToken");
    console.log("   This is required for auto-granting MINTER_ROLE!");
    console.log("\n🔐 Granting DEFAULT_ADMIN_ROLE to RoleRegistry...");
    
    const tx = await rangerToken.grantRole(DEFAULT_ADMIN_ROLE, roleRegistryAddress);
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ DEFAULT_ADMIN_ROLE granted!");

    // Verify
    const hasRoleAfter = await rangerToken.hasRole(DEFAULT_ADMIN_ROLE, roleRegistryAddress);
    console.log("\n✅ Verification - RoleRegistry now has DEFAULT_ADMIN_ROLE:", hasRoleAfter);
  } else {
    console.log("\n✅ RoleRegistry already has DEFAULT_ADMIN_ROLE!");
  }

  console.log("\n🎉 RoleRegistry can now automatically grant MINTER_ROLE when registering warehouses!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
