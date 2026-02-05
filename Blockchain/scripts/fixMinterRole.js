// Quick fix to grant MINTER_ROLE
const hre = require("hardhat");

async function main() {
  const warehouseAddress = "0x8916DD1311c17aD008bB56bE3378E001a92e4375";
  
  console.log("\n🔧 Fixing MINTER_ROLE for:", warehouseAddress);
  
  const rangerToken = await hre.ethers.getContractAt(
    "RangerToken",
    "0x85d0D64e765cC3434D932da58A39eC49F75E3EDd"
  );
  
  const MINTER_ROLE = await rangerToken.MINTER_ROLE();
  const hasMinterRole = await rangerToken.hasRole(MINTER_ROLE, warehouseAddress);
  
  console.log("Current MINTER_ROLE status:", hasMinterRole);
  
  if (!hasMinterRole) {
    console.log("\n❌ No MINTER_ROLE found. Granting now...");
    const tx = await rangerToken.grantRole(MINTER_ROLE, warehouseAddress);
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ MINTER_ROLE granted!");
  } else {
    console.log("✅ Already has MINTER_ROLE");
  }
  
  // Verify
  const finalCheck = await rangerToken.hasRole(MINTER_ROLE, warehouseAddress);
  console.log("\n🎉 Final verification - Has MINTER_ROLE:", finalCheck);
  
  if (finalCheck) {
    console.log("\n✅ SUCCESS! You can now mint eNWR tokens with this wallet!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
