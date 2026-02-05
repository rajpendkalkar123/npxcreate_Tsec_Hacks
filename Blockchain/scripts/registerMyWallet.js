const { ethers } = require("hardhat");

async function main() {
  const ROLE_REGISTRY_ADDRESS = "0x4D4826DF5ebe538E24dB6D51bD2f0ffD262cdc93";
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  
  // YOUR MetaMask wallet address (update this!)
  const YOUR_WALLET = "0x2e73869ca96E371DCa9E9430c470c8468820c3FF";
  
  console.log(`🔧 Registering ${YOUR_WALLET} as warehouse...\n`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`Admin: ${deployer.address}\n`);
  
  const roleRegistry = await ethers.getContractAt("RoleRegistry", ROLE_REGISTRY_ADDRESS);
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  
  // Register warehouse
  console.log("1️⃣  Registering in RoleRegistry...");
  try {
    const registerTx = await roleRegistry.registerWarehouse(
      YOUR_WALLET,
      "WDRA-MH-2024-456",
      "Your Warehouse Location"
    );
    await registerTx.wait();
    console.log("✅ Registered!");
  } catch (error) {
    if (error.message.includes("already registered")) {
      console.log("✅ Already registered!");
    } else {
      throw error;
    }
  }
  
  // Grant MINTER_ROLE
  console.log("\n2️⃣  Granting MINTER_ROLE...");
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const hasRole = await rangerToken.hasRole(MINTER_ROLE, YOUR_WALLET);
  
  if (!hasRole) {
    const grantTx = await rangerToken.grantRole(MINTER_ROLE, YOUR_WALLET);
    await grantTx.wait();
    console.log("✅ MINTER_ROLE granted!");
  } else {
    console.log("✅ Already has MINTER_ROLE!");
  }
  
  // Verify
  console.log("\n✅✅✅ Setup complete!");
  console.log(`\nNow you can login with MetaMask using ${YOUR_WALLET}`);
  console.log("and issue eNWR tokens as Warehouse Authority!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
