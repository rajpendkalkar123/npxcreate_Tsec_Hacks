const { ethers } = require("hardhat");

async function main() {
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  const MARKETPLACE_ADDRESS = "0xd159Cf6f961aA1e9be863Bf3542933A827c4bd8a";
  
  const SELLER_ADDRESS = "0x2e73869ca96E371DCa9E9430c470c8468820c3FF"; // Your wallet
  const BUYER_ADDRESS = "0x8916DD1311c17aD008bB56bE3378E001a92e4375"; // Deployer (different wallet)
  
  console.log("🎬 Complete Marketplace Demo (2 Wallets)\n");
  console.log("SELLER:", SELLER_ADDRESS);
  console.log("BUYER:", BUYER_ADDRESS);
  console.log("\n" + "=".repeat(60) + "\n");
  
  const [deployer] = await ethers.getSigners();
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  const marketplace = await ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
  
  // STEP 1: Issue token to SELLER
  console.log("STEP 1: Warehouse issues eNWR to Farmer (Seller)");
  console.log("-".repeat(60));
  
  const quantity = 1000;
  const expiryTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
  
  const issueTx = await rangerToken.issueReceipt(
    SELLER_ADDRESS,
    quantity,
    expiryTimestamp,
    "ipfs://QmDemoToken123"
  );
  const issueReceipt = await issueTx.wait();
  
  let tokenId = 0;
  for (const log of issueReceipt.logs) {
    try {
      const parsed = rangerToken.interface.parseLog(log);
      if (parsed.name === 'ReceiptIssued') {
        tokenId = parsed.args.tokenId;
        break;
      }
    } catch {}
  }
  
  console.log(`✅ Token #${tokenId} issued to SELLER`);
  console.log(`   Quantity: ${quantity} kg`);
  console.log(`   Transaction: ${issueReceipt.hash}`);
  
  // STEP 2: Seller approves marketplace
  console.log("\n\nSTEP 2: Seller approves Marketplace (SIMULATION)");
  console.log("-".repeat(60));
  console.log("⚠️  In the UI, this happens when you click 'Sell'");
  console.log("   The seller needs to approve the marketplace contract");
  console.log("   This is done via MetaMask in the browser");
  
  // STEP 3: Seller lists token (SIMULATION)
  console.log("\n\nSTEP 3: Seller lists token on Marketplace (SIMULATION)");
  console.log("-".repeat(60));
  console.log("⚠️  In the UI:");
  console.log("   1. Seller logs in with MetaMask");
  console.log("   2. Goes to 'My Harvests'");
  console.log(`   3. Clicks 'Sell' on Token #${tokenId}`);
  console.log("   4. Enters quantity and price");
  console.log("   5. Submits transaction");
  console.log("\n📝 This creates a marketplace listing");
  
  // STEP 4: Show buyer purchasing
  console.log("\n\nSTEP 4: Buyer purchases from Marketplace (SIMULATION)");
  console.log("-".repeat(60));
  console.log("⚠️  In the UI:");
  console.log("   1. DIFFERENT wallet logs in (BUYER)");
  console.log("   2. Goes to 'Market Insights'");
  console.log("   3. Sees the listing");
  console.log("   4. Clicks 'Buy Now (Finternet)'");
  console.log("   5. Finternet payment window opens");
  console.log("   6. Completes payment ($$$)");
  console.log("   7. Blockchain transfer executes");
  console.log("   8. Token transfers from Seller to Buyer");
  
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Token #${tokenId} created (${quantity} kg)`);
  console.log(`✅ Owned by: ${SELLER_ADDRESS}`);
  console.log("\n🎯 NEXT STEPS IN THE UI:");
  console.log(`\n1. LOGIN as SELLER (${SELLER_ADDRESS})`);
  console.log(`   - Go to "My Harvests"`);
  console.log(`   - Find Token #${tokenId}`);
  console.log(`   - Click "Sell"`);
  console.log(`   - Quantity: 500 kg`);
  console.log(`   - Price: 0.001 ETH per kg`);
  console.log(`   - Submit`);
  console.log(`\n2. LOGOUT and LOGIN as BUYER (${BUYER_ADDRESS})`);
  console.log(`   - Go to "Market Insights"`);
  console.log(`   - See the listing`);
  console.log(`   - Click "Buy Now (Finternet)"`);
  console.log(`   - Complete purchase`);
  console.log(`\n3. VERIFY:`);
  console.log(`   - Buyer now has Token #${tokenId}`);
  console.log(`   - Seller's balance reduced by 500 kg`);
  console.log(`   - Listing removed from marketplace`);
  console.log(`   - Finternet payment processed`);
  
  console.log("\n\n⚠️  IMPORTANT:");
  console.log("You MUST use 2 different MetaMask accounts!");
  console.log("You CANNOT buy your own listings!");
  console.log("\nTo add a second account in MetaMask:");
  console.log("1. Click your account icon (top right)");
  console.log("2. Click 'Add account' or 'Import account'");
  console.log("3. Use the deployer private key from .env:");
  console.log("   0x851f2396c6ff431410782c211db3a996a332f0decad132f21d5f60bb077f35e9");
  console.log("4. Now you have 2 accounts to test with!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
