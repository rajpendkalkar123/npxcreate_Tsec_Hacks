const { ethers } = require("hardhat");

async function main() {
  const MARKETPLACE_ADDRESS = "0xd159Cf6f961aA1e9be863Bf3542933A827c4bd8a";
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  
  console.log("🔍 Checking Marketplace Listings...\n");
  
  const marketplace = await ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  
  const activeListings = [];
  
  // Check first 20 listing IDs
  for (let id = 1; id <= 20; id++) {
    try {
      const listing = await marketplace.getListing(id);
      
      if (listing.isActive) {
        const tokenId = listing.tokenId;
        let commodityName = "Unknown";
        
        try {
          const uri = await rangerToken.uri(tokenId);
          console.log(`  Token ${tokenId} URI:`, uri);
        } catch (e) {
          console.log(`  Token ${tokenId} - URI fetch failed`);
        }
        
        console.log(`\n📦 Listing #${id}:`);
        console.log(`  Seller: ${listing.seller}`);
        console.log(`  Token ID: ${tokenId.toString()}`);
        console.log(`  Quantity: ${listing.quantity.toString()} kg`);
        console.log(`  Price/kg: ${ethers.formatEther(listing.pricePerKg)} ETH`);
        console.log(`  Total: ${ethers.formatEther(listing.quantity * listing.pricePerKg)} ETH`);
        console.log(`  Active: ${listing.isActive}`);
        
        activeListings.push({
          id,
          seller: listing.seller,
          tokenId: tokenId.toString(),
          quantity: listing.quantity.toString(),
          pricePerKg: ethers.formatEther(listing.pricePerKg)
        });
      }
    } catch (error) {
      // Listing doesn't exist
      break;
    }
  }
  
  console.log(`\n\n📊 Summary: ${activeListings.length} active listing(s)`);
  
  if (activeListings.length === 0) {
    console.log("\n⚠️  No active listings found!");
    console.log("\nTo create a listing:");
    console.log("1. Login as farmer (wallet that owns tokens)");
    console.log("2. Go to 'My Harvests'");
    console.log("3. Click 'Sell' on a token");
    console.log("4. Enter price and submit");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
