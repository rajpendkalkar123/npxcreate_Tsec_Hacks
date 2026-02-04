const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Croplock deployment to", hre.network.name);
  console.log("=".repeat(60));

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("");

  // 1. Deploy RoleRegistry
  console.log("1️⃣  Deploying RoleRegistry...");
  const RoleRegistry = await hre.ethers.getContractFactory("RoleRegistry");
  const roleRegistry = await RoleRegistry.deploy();
  await roleRegistry.waitForDeployment();
  const roleRegistryAddress = await roleRegistry.getAddress();
  console.log("✅ RoleRegistry deployed to:", roleRegistryAddress);
  console.log("");

  // 2. Deploy MockFinternetGateway (for testing)
  console.log("2️⃣  Deploying MockFinternetGateway...");
  const MockFinternetGateway = await hre.ethers.getContractFactory("MockFinternetGateway");
  const finternetGateway = await MockFinternetGateway.deploy();
  await finternetGateway.waitForDeployment();
  const finternetGatewayAddress = await finternetGateway.getAddress();
  console.log("✅ MockFinternetGateway deployed to:", finternetGatewayAddress);
  console.log("⚠️  Note: Replace with actual Finternet Gateway in production");
  console.log("");

  // 3. Deploy RangerToken
  console.log("3️⃣  Deploying RangerToken...");
  const RangerToken = await hre.ethers.getContractFactory("RangerToken");
  const rangerToken = await RangerToken.deploy(roleRegistryAddress);
  await rangerToken.waitForDeployment();
  const rangerTokenAddress = await rangerToken.getAddress();
  console.log("✅ RangerToken deployed to:", rangerTokenAddress);
  console.log("");

  // 4. Deploy Marketplace
  console.log("4️⃣  Deploying Marketplace...");
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(rangerTokenAddress, finternetGatewayAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", marketplaceAddress);
  console.log("");

  // 5. Deploy LendingPool
  console.log("5️⃣  Deploying LendingPool...");
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(
    rangerTokenAddress,
    roleRegistryAddress,
    finternetGatewayAddress
  );
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("✅ LendingPool deployed to:", lendingPoolAddress);
  console.log("");

  // Grant roles
  console.log("6️⃣  Configuring roles...");
  const MINTER_ROLE = await rangerToken.MINTER_ROLE();
  const BANK_ROLE = await rangerToken.BANK_ROLE();

  // Example: Grant BANK_ROLE to LendingPool contract
  const grantBankRoleTx = await rangerToken.grantRole(BANK_ROLE, lendingPoolAddress);
  await grantBankRoleTx.wait();
  console.log("✅ Granted BANK_ROLE to LendingPool");
  console.log("");

  // Summary
  console.log("=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));
  console.log("📋 Contract Addresses:");
  console.log("   RoleRegistry:        ", roleRegistryAddress);
  console.log("   MockFinternetGateway:", finternetGatewayAddress);
  console.log("   RangerToken:         ", rangerTokenAddress);
  console.log("   Marketplace:         ", marketplaceAddress);
  console.log("   LendingPool:         ", lendingPoolAddress);
  console.log("=".repeat(60));
  console.log("");
  console.log("📝 Next Steps:");
  console.log("   1. Save these addresses to your .env file");
  console.log("   2. Register warehouse operators: roleRegistry.registerWarehouse(...)");
  console.log("   3. Register banks: roleRegistry.registerBank(...)");
  console.log("   4. Grant MINTER_ROLE to warehouse operators");
  console.log("   5. Verify contracts on block explorer (if applicable)");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      RoleRegistry: roleRegistryAddress,
      MockFinternetGateway: finternetGatewayAddress,
      RangerToken: rangerTokenAddress,
      Marketplace: marketplaceAddress,
      LendingPool: lendingPoolAddress,
    },
  };

  const deploymentPath = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath);
  }
  fs.writeFileSync(
    path.join(deploymentPath, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to deployments/" + hre.network.name + ".json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
