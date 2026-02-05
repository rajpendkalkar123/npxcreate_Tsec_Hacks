const { ethers } = require("hardhat");

async function main() {
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  const MARKETPLACE_ADDRESS = "0xd159Cf6f961aA1e9be863Bf3542933A827c4bd8a";
  
  const USER_ADDRESS = "0x2e73869ca96E371DCa9E9430c470c8468820c3FF"; // Your wallet
  
  console.log("\n📊 CHECKING BLOCKCHAIN STATE");
  console.log("=".repeat(60));
  console.log("User:", USER_ADDRESS);
  console.log("\n");
  
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  const marketplace = await ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
  
  // Check all tokens owned
  console.log("🪙 YOUR TOKENS:");
  console.log("-".repeat(60));
  
  let foundTokens = [];
  for (let tokenId = 1; tokenId <= 100; tokenId++) {
    try {
      const balance = await rangerToken.balanceOf(USER_ADDRESS, tokenId);
      
      if (balance > 0) {
        const pledgeStatus = await rangerToken.getPledgeStatus(tokenId, USER_ADDRESS);
        const isPledged = pledgeStatus[0];
        const pledgedAmount = pledgeStatus[2];
        const available = balance - pledgedAmount;
        
        foundTokens.push({ tokenId, balance, pledgedAmount, available });
        
        console.log(`\nToken #${tokenId}:`);
        console.log(`  Total Balance: ${balance} kg`);
        if (isPledged) {
          console.log(`  🔒 Pledged: ${pledgedAmount} kg`);
          console.log(`  ✅ Available: ${available} kg`);
        } else {
          console.log(`  ✅ Available: ${balance} kg (not pledged)`);
        }
      }
    } catch (err) {
      break;
    }
  }
  
  if (foundTokens.length === 0) {
    console.log("No tokens found!");
  }
  
  // Check marketplace listings
  console.log("\n\n🏪 MARKETPLACE LISTINGS:");
  console.log("-".repeat(60));
  
  let activeListings = [];
  for (let listingId = 1; listingId <= 50; listingId++) {
    try {
      const listing = await marketplace.getListing(listingId);
      
      if (listing.isActive) {
        const isYourListing = listing.seller.toLowerCase() === USER_ADDRESS.toLowerCase();
        
        activeListings.push({
          listingId,
          tokenId: listing.tokenId,
          quantity: listing.quantity,
          pricePerKg: ethers.formatEther(listing.pricePerKg),
          seller: listing.seller,
          isYours: isYourListing
        });
        
        console.log(`\nListing #${listingId}:`);
        console.log(`  Token: #${listing.tokenId}`);
        console.log(`  Quantity: ${listing.quantity} kg`);
        console.log(`  Price: ${ethers.formatEther(listing.pricePerKg)} ETH/kg`);
        console.log(`  Total: ${ethers.formatEther(listing.quantity * listing.pricePerKg)} ETH`);
        console.log(`  Seller: ${listing.seller}`);
        if (isYourListing) {
          console.log(`  👤 YOUR LISTING`);
        }
      }
    } catch (err) {
      break;
    }
  }
  
  if (activeListings.length === 0) {
    console.log("No active listings found!");
  }
  
  // Summary
  console.log("\n\n📈 SUMMARY:");
  console.log("=".repeat(60));
  console.log(`Total Tokens Owned: ${foundTokens.length}`);
  console.log(`Active Marketplace Listings: ${activeListings.length}`);
  console.log(`Your Own Listings: ${activeListings.filter(l => l.isYours).length}`);
  
  // What can you do?
  console.log("\n\n💡 WHAT YOU CAN DO:");
  console.log("=".repeat(60));
  
  const availableToSell = foundTokens.filter(t => t.available > 0);
  if (availableToSell.length > 0) {
    console.log("\n✅ You can list these tokens for sale:");
    availableToSell.forEach(t => {
      console.log(`   - Token #${t.tokenId}: ${t.available} kg available`);
    });
  } else {
    console.log("\n⚠️  No tokens available to sell (all pledged or sold)");
  }
  
  const yourListings = activeListings.filter(l => l.isYours);
  if (yourListings.length > 0) {
    console.log("\n📋 Your current marketplace listings:");
    yourListings.forEach(l => {
      console.log(`   - Listing #${l.listingId}: Token #${l.tokenId}, ${l.quantity} kg @ ${l.pricePerKg} ETH/kg`);
    });
    console.log("\n⚠️  NOTE: You cannot buy your own listings!");
    console.log("   You need a DIFFERENT wallet to test buying.");
  }
  
  const othersListings = activeListings.filter(l => !l.isYours);
  if (othersListings.length > 0) {
    console.log("\n🛒 Available to buy:");
    othersListings.forEach(l => {
      console.log(`   - Listing #${l.listingId}: Token #${l.tokenId}, ${l.quantity} kg @ ${l.pricePerKg} ETH/kg`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
