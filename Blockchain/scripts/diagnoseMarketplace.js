const { ethers } = require("hardhat");

async function main() {
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  const MARKETPLACE_ADDRESS = "0xd159Cf6f961aA1e9be863Bf3542933A827c4bd8a";
  
  // Your address
  const YOUR_ADDRESS = "0x2e73869ca96E371DCa9E9430c470c8468820c3FF";
  
  console.log("🔍 Diagnosing Marketplace Issue...\n");
  
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  const marketplace = await ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
  
  // 1. Check your tokens
  console.log("📦 Checking your tokens...");
  const ownedTokens = [];
  
  for (let tokenId = 1; tokenId <= 20; tokenId++) {
    try {
      const balance = await rangerToken.balanceOf(YOUR_ADDRESS, tokenId);
      if (balance > 0n) {
        const pledgeStatus = await rangerToken.getPledgeStatus(tokenId, YOUR_ADDRESS);
        const isPledged = pledgeStatus[0];
        const pledgedAmount = pledgeStatus[2];
        const availableBalance = balance - pledgedAmount;
        
        ownedTokens.push({
          tokenId,
          balance: balance.toString(),
          pledged: pledgedAmount.toString(),
          available: availableBalance.toString(),
          canSell: availableBalance > 0n
        });
        
        console.log(`\n  Token #${tokenId}:`);
        console.log(`    Balance: ${balance} kg`);
        console.log(`    Pledged: ${pledgedAmount} kg`);
        console.log(`    Available: ${availableBalance} kg`);
        console.log(`    ${availableBalance > 0n ? '✅ CAN SELL' : '❌ FULLY PLEDGED'}`);
      }
    } catch (e) {
      // Token doesn't exist
    }
  }
  
  if (ownedTokens.length === 0) {
    console.log("\n❌ You don't own any tokens!");
    console.log("\nTo get tokens:");
    console.log("1. Login as Warehouse Authority");
    console.log("2. Issue a token to your address");
    return;
  }
  
  // 2. Check marketplace listings
  console.log("\n\n📊 Checking marketplace listings...");
  const activeListings = [];
  
  for (let id = 1; id <= 20; id++) {
    try {
      const listing = await marketplace.getListing(id);
      if (listing.isActive) {
        activeListings.push({
          id,
          seller: listing.seller,
          tokenId: listing.tokenId.toString(),
          quantity: listing.quantity.toString(),
          pricePerKg: ethers.formatEther(listing.pricePerKg)
        });
        
        console.log(`\n  Listing #${id}:`);
        console.log(`    Seller: ${listing.seller}`);
        console.log(`    Token ID: ${listing.tokenId}`);
        console.log(`    Quantity: ${listing.quantity} kg`);
        console.log(`    Price: ${ethers.formatEther(listing.pricePerKg)} ETH/kg`);
        console.log(`    Total: ${ethers.formatEther(listing.quantity * listing.pricePerKg)} ETH`);
      }
    } catch {
      break;
    }
  }
  
  console.log(`\n\n📈 Summary:`);
  console.log(`  Tokens you own: ${ownedTokens.length}`);
  console.log(`  Tokens you can sell: ${ownedTokens.filter(t => t.canSell).length}`);
  console.log(`  Active marketplace listings: ${activeListings.length}`);
  
  if (activeListings.length === 0) {
    console.log("\n⚠️  MARKETPLACE IS EMPTY!");
    console.log("\nTo create a listing:");
    
    const sellableTokens = ownedTokens.filter(t => t.canSell);
    if (sellableTokens.length > 0) {
      console.log(`\n✅ You can sell these tokens:`);
      sellableTokens.forEach(t => {
        console.log(`   - Token #${t.tokenId}: ${t.available} kg available`);
      });
      console.log("\n1. Login as Farmer");
      console.log("2. Go to 'My Harvests'");
      console.log("3. Click 'Sell' on one of the tokens above");
      console.log(`4. Enter quantity (max: ${sellableTokens[0].available} kg)`);
      console.log("5. Enter price (e.g., 0.001 ETH per kg)");
      console.log("6. Submit");
    } else {
      console.log("\n❌ All your tokens are pledged as collateral!");
      console.log("You need to repay loans before selling.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
