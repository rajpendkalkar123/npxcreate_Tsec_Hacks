const { ethers } = require("hardhat");

async function main() {
  console.log("🔥 RESETTING MARKETPLACE - FRESH START\n");
  
  const MARKETPLACE_ADDRESS = "0xd159Cf6f961aA1e9be863Bf3542933A827c4bd8a";
  const YOUR_ADDRESS = "0x2e73869ca96E371DCa9E9430c470c8468820c3FF";
  
  const [deployer] = await ethers.getSigners();
  console.log(`Admin: ${deployer.address}\n`);
  
  const marketplace = await ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
  
  // Cancel all active listings
  console.log("1️⃣  Canceling all marketplace listings...\n");
  let canceledCount = 0;
  
  for (let id = 1; id <= 50; id++) {
    try {
      const listing = await marketplace.getListing(id);
      
      if (listing.isActive) {
        console.log(`   Canceling Listing #${id}...`);
        console.log(`     Seller: ${listing.seller}`);
        console.log(`     Token: #${listing.tokenId}`);
        console.log(`     Quantity: ${listing.quantity} kg`);
        
        // Only deployer can cancel for demonstration
        // In production, only seller can cancel their own listing
        try {
          // Note: The Marketplace contract must have a cancelListing function
          // If it doesn't exist, listings will expire naturally or be bought
          console.log(`     ⚠️  Cannot cancel - no admin cancel function`);
          console.log(`     💡 Listing will remain until bought or you can redeploy contracts\n`);
        } catch (e) {
          console.log(`     ⚠️  Could not cancel: ${e.message}\n`);
        }
        
        canceledCount++;
      }
    } catch {
      break; // No more listings
    }
  }
  
  console.log(`\n📊 Found ${canceledCount} active listing(s)`);
  
  if (canceledCount > 0) {
    console.log("\n⚠️  IMPORTANT:");
    console.log("The Marketplace contract doesn't have an admin cancel function.");
    console.log("Listings can only be removed by:");
    console.log("  1. The seller canceling (not implemented)");
    console.log("  2. Someone buying them");
    console.log("  3. Redeploying the contracts\n");
    
    console.log("🎯 RECOMMENDED APPROACH:");
    console.log("Instead of removing listings, let's start fresh with NEW contracts!");
    console.log("\nRun this command:");
    console.log("  npm run deploy:hoodi\n");
    console.log("This will:");
    console.log("  ✅ Deploy fresh contracts");
    console.log("  ✅ No existing tokens");
    console.log("  ✅ Empty marketplace");
    console.log("  ✅ Clean slate to test properly\n");
  } else {
    console.log("\n✅ Marketplace is already empty!");
    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Login as Warehouse Authority");
    console.log("2. Issue a token to a farmer");
    console.log("3. Login as that farmer");
    console.log("4. List the token for sale");
    console.log("5. Login as a different wallet (buyer)");
    console.log("6. Buy from marketplace");
    console.log("7. Test Finternet payment integration!\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
