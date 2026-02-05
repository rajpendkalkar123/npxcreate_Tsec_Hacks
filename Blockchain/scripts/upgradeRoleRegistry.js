const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Upgrading RoleRegistry with MINTER_ROLE management...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  // Load existing deployment addresses
  const deploymentPath = "./deployments/hoodi.json";
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const rangerTokenAddress = deployment.contracts.RangerToken;
  const marketplaceAddress = deployment.contracts.Marketplace;
  const lendingPoolAddress = deployment.contracts.LendingPool;

  console.log("\n📋 Existing contracts:");
  console.log("RangerToken:", rangerTokenAddress);
  console.log("Marketplace:", marketplaceAddress);
  console.log("LendingPool:", lendingPoolAddress);

  // Get RangerToken contract
  const rangerToken = await hre.ethers.getContractAt("RangerToken", rangerTokenAddress);
  const DEFAULT_ADMIN_ROLE = await rangerToken.DEFAULT_ADMIN_ROLE();

  // Deploy new RoleRegistry
  console.log("\n🏗️  Deploying new RoleRegistry...");
  const RoleRegistry = await hre.ethers.getContractFactory("RoleRegistry");
  const roleRegistry = await RoleRegistry.deploy();
  await roleRegistry.waitForDeployment();
  const roleRegistryAddress = await roleRegistry.getAddress();
  
  console.log("✅ RoleRegistry deployed to:", roleRegistryAddress);

  // Set RangerToken address in RoleRegistry
  console.log("\n🔗 Linking RangerToken to RoleRegistry...");
  const setTokenTx = await roleRegistry.setRangerToken(rangerTokenAddress);
  await setTokenTx.wait();
  console.log("✅ RangerToken linked to RoleRegistry");

  // Grant DEFAULT_ADMIN_ROLE to new RoleRegistry in RangerToken
  console.log("\n🔐 Granting DEFAULT_ADMIN_ROLE to new RoleRegistry...");
  const grantTx = await rangerToken.grantRole(DEFAULT_ADMIN_ROLE, roleRegistryAddress);
  await grantTx.wait();
  console.log("✅ RoleRegistry now has DEFAULT_ADMIN_ROLE in RangerToken");

  // Verify the role
  const hasRole = await rangerToken.hasRole(DEFAULT_ADMIN_ROLE, roleRegistryAddress);
  console.log("✅ Verification - RoleRegistry has DEFAULT_ADMIN_ROLE:", hasRole);

  // Grant REGISTRY_ADMIN_ROLE to deployer in new RoleRegistry
  console.log("\n👤 Setting up admin access in RoleRegistry...");
  const REGISTRY_ADMIN_ROLE = await roleRegistry.REGISTRY_ADMIN_ROLE();
  const adminTx = await roleRegistry.grantRole(REGISTRY_ADMIN_ROLE, deployer.address);
  await adminTx.wait();
  console.log("✅ Deployer has REGISTRY_ADMIN_ROLE in RoleRegistry");

  // Update deployment file
  console.log("\n💾 Updating deployment file...");
  const oldRoleRegistry = deployment.contracts.RoleRegistry;
  deployment.contracts.RoleRegistry = roleRegistryAddress;
  deployment.upgradeHistory = deployment.upgradeHistory || [];
  deployment.upgradeHistory.push({
    timestamp: new Date().toISOString(),
    contract: "RoleRegistry",
    oldAddress: oldRoleRegistry,
    newAddress: roleRegistryAddress,
    reason: "Added automatic MINTER_ROLE grant/revoke functionality"
  });

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("✅ Deployment file updated");

  console.log("\n🎉 Upgrade complete!");
  console.log("\n⚠️  IMPORTANT: Update frontend contracts.ts with new RoleRegistry address:");
  console.log(`   RoleRegistry: "${roleRegistryAddress}",`);
  console.log("\n📝 Now when you register a warehouse via admin panel:");
  console.log("   ✅ Warehouse will be registered in RoleRegistry");
  console.log("   ✅ MINTER_ROLE will be automatically granted in RangerToken");
  console.log("   ✅ No manual script execution needed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
