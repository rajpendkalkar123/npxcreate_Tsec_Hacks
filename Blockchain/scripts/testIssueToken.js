const { ethers } = require("hardhat");

async function main() {
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  
  // The warehouse trying to issue
  const WAREHOUSE_ADDRESS = "0x8916DD1311c17aD008bB56bE3378E001a92e4375";
  
  // Test farmer address
  const FARMER_ADDRESS = "0x2e73869ca96E371DCa9E9430c470c8468820c3FF";
  
  console.log("🧪 Testing Token Issuance...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log(`Signer: ${deployer.address}`);
  console.log(`Expected warehouse: ${WAREHOUSE_ADDRESS}`);
  
  if (deployer.address.toLowerCase() !== WAREHOUSE_ADDRESS.toLowerCase()) {
    console.log("\n⚠️  WARNING: You're not signing as the warehouse address!");
    console.log("The .env private key doesn't match the warehouse address.");
    console.log("This might be why you're getting errors.\n");
  }
  
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  
  // Try to issue a token
  const quantity = 1000; // 1000 kg
  const expiryTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year
  const ipfsHash = "ipfs://QmTest123456789";
  
  console.log("📝 Attempting to issue token with:");
  console.log(`  Farmer: ${FARMER_ADDRESS}`);
  console.log(`  Quantity: ${quantity} kg`);
  console.log(`  Expiry: ${new Date(expiryTimestamp * 1000).toISOString()}`);
  console.log(`  IPFS: ${ipfsHash}\n`);
  
  try {
    const tx = await rangerToken.issueReceipt(
      FARMER_ADDRESS,
      quantity,
      expiryTimestamp,
      ipfsHash
    );
    
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`✅ SUCCESS! Token issued in tx: ${receipt.hash}`);
    
    // Find the token ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = rangerToken.interface.parseLog(log);
        return parsed.name === 'ReceiptIssued';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = rangerToken.interface.parseLog(event);
      console.log(`🎉 Token ID: ${parsed.args.tokenId}`);
    }
    
  } catch (error) {
    console.error("❌ FAILED:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
    if (error.reason) {
      console.log("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
