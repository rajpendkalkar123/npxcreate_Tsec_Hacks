const hre = require("hardhat");

async function main() {
  console.log("📊 Checking ALL eNWR tokens in the system...\n");

  const rangerTokenAddress = "0x85d0D64e765cC3434D932da58A39eC49F75E3EDd";
  const rangerToken = await hre.ethers.getContractAt("RangerToken", rangerTokenAddress);

  try {
    // Get total supply of tokens ever minted
    const totalTokenIds = await rangerToken.totalTokenIds();
    console.log("Total unique token IDs minted:", totalTokenIds.toString());

    if (totalTokenIds === 0n) {
      console.log("\n❌ No tokens have been minted yet!");
      console.log("\n💡 Possible issues:");
      console.log("   1. Transaction might still be pending");
      console.log("   2. Transaction failed silently");
      console.log("   3. Using wrong contract address");
      return;
    }

    // List all tokens
    console.log("\n📦 All eNWR Tokens:\n");
    for (let i = 1n; i <= totalTokenIds; i++) {
      try {
        const details = await rangerToken.getTokenDetails(i);
        console.log(`Token ID ${i}:`);
        console.log(`  Farmer: ${details.farmer}`);
        console.log(`  Issuer: ${details.issuer}`);
        console.log(`  Commodity: ${details.commodity}`);
        console.log(`  Quantity: ${details.quantity} ${details.unit}`);
        console.log(`  Issue Date: ${new Date(Number(details.issueDate) * 1000).toLocaleDateString()}`);
        console.log(`  Redeemed: ${details.isRedeemed}`);
        
        // Get metadata URI
        const uri = await rangerToken.uri(i);
        console.log(`  Metadata: ${uri}`);
        console.log();
      } catch (err) {
        console.log(`  ❌ Could not fetch details: ${err.message}\n`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
