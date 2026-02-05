const { ethers } = require("hardhat");

async function main() {
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  const MARKETPLACE_ADDRESS = "0xd159Cf6f961aA1e9be863Bf3542933A827c4bd8a";
  
  console.log("\n🧪 TESTING MARKETPLACE BUY FUNCTION");
  console.log("=".repeat(60));
  
  const [buyer] = await ethers.getSigners();
  console.log("Buyer (test wallet):", buyer.address);
  
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  const marketplace = await ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
  
  // Find first active listing not owned by buyer
  console.log("\n🔍 Finding available listing...");
  
  let targetListing = null;
  for (let listingId = 1; listingId <= 50; listingId++) {
    try {
      const listing = await marketplace.getListing(listingId);
      
      if (listing.isActive && listing.seller.toLowerCase() !== buyer.address.toLowerCase()) {
        // Check if seller has tokens
        const sellerBalance = await rangerToken.balanceOf(listing.seller, listing.tokenId);
        
        if (sellerBalance >= listing.quantity) {
          targetListing = {
            listingId,
            seller: listing.seller,
            tokenId: listing.tokenId,
            quantity: listing.quantity,
            pricePerKg: listing.pricePerKg,
            isActive: listing.isActive
          };
          break;
        }
      }
    } catch {}
  }
  
  if (!targetListing) {
    console.log("❌ No available listings found!");
    console.log("\nCreate a listing first:");
    console.log("1. Use different wallet to list tokens");
    console.log("2. Or use deployer wallet to create test listing");
    return;
  }
  
  console.log("\n✅ Found listing:");
  console.log(`  Listing ID: ${targetListing.listingId}`);
  console.log(`  Token ID: ${targetListing.tokenId}`);
  console.log(`  Quantity: ${targetListing.quantity} kg`);
  console.log(`  Price/kg: ${ethers.formatEther(targetListing.pricePerKg)} ETH`);
  console.log(`  Total: ${ethers.formatEther(targetListing.quantity * targetListing.pricePerKg)} ETH`);
  console.log(`  Seller: ${targetListing.seller}`);
  
  // Check buyer balance
  const buyerBalance = await ethers.provider.getBalance(buyer.address);
  console.log(`\n💰 Buyer ETH balance: ${ethers.formatEther(buyerBalance)} ETH`);
  
  const totalPrice = targetListing.quantity * targetListing.pricePerKg;
  console.log(`   Required: ${ethers.formatEther(totalPrice)} ETH`);
  
  if (buyerBalance < totalPrice) {
    console.log("❌ Insufficient ETH balance!");
    return;
  }
  
  // Check buyer token balance before
  const balanceBefore = await rangerToken.balanceOf(buyer.address, targetListing.tokenId);
  console.log(`\n📊 Buyer token balance BEFORE: ${balanceBefore} kg`);
  
  // Attempt purchase
  console.log("\n🛒 Attempting purchase...");
  try {
    const tx = await marketplace.buyToken(
      targetListing.listingId,
      targetListing.quantity,
      { value: totalPrice }
    );
    
    console.log("⏳ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    
    // Check buyer token balance after
    const balanceAfter = await rangerToken.balanceOf(buyer.address, targetListing.tokenId);
    console.log(`\n📊 Buyer token balance AFTER: ${balanceAfter} kg`);
    console.log(`   Received: ${balanceAfter - balanceBefore} kg`);
    
    // Check if listing is still active
    const updatedListing = await marketplace.getListing(targetListing.listingId);
    console.log(`\n📋 Listing status: ${updatedListing.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    
    if (!updatedListing.isActive) {
      console.log("✅ Listing properly marked as inactive");
    }
    
    console.log("\n🎉 PURCHASE TEST SUCCESSFUL!");
    
  } catch (error) {
    console.error("\n❌ PURCHASE FAILED!");
    console.error("Error:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.data) {
      console.error("Data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
