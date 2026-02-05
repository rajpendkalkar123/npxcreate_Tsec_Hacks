const { ethers } = require("hardhat");

async function main() {
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  const MARKETPLACE_ADDRESS = "0xd159Cf6f961aA1e9be863Bf3542933A827c4bd8a";
  
  // Your address (the one in the error)
  const SELLER_ADDRESS = "0x2e73869ca96E371DCa9E9430c470c8468820c3FF";
  
  console.log("🚀 Creating a Test Listing...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer: ${deployer.address}\n`);
  
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  const marketplace = await ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
  
  // First, issue a NEW token to the seller
  console.log("1️⃣  Issuing new token...");
  const quantity = 500; // 500 kg
  const expiryTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
  const ipfsHash = "ipfs://QmTestMarketplace123";
  
  const issueTx = await rangerToken.issueReceipt(
    SELLER_ADDRESS,
    quantity,
    expiryTimestamp,
    ipfsHash
  );
  const issueReceipt = await issueTx.wait();
  
  // Find token ID from event
  let newTokenId = 0;
  for (const log of issueReceipt.logs) {
    try {
      const parsed = rangerToken.interface.parseLog(log);
      if (parsed.name === 'ReceiptIssued') {
        newTokenId = parsed.args.tokenId;
        break;
      }
    } catch {}
  }
  
  console.log(`✅ Issued Token #${newTokenId} (${quantity} kg) to ${SELLER_ADDRESS}`);
  
  // Now create a listing using the seller's wallet
  console.log("\n2️⃣  Creating listing (you need to do this in the UI)...");
  console.log(`\nNOW DO THIS IN THE BROWSER:`);
  console.log(`1. Make sure you're logged in as ${SELLER_ADDRESS}`);
  console.log(`2. Go to "My Harvests"`);
  console.log(`3. You should see Token #${newTokenId}`);
  console.log(`4. Click "Sell"`);
  console.log(`5. Enter quantity: 100 kg (or any amount up to ${quantity})`);
  console.log(`6. Enter price: 0.001 ETH per kg`);
  console.log(`7. Submit`);
  console.log(`\nThen to BUY:`);
  console.log(`8. Logout and login with a DIFFERENT wallet`);
  console.log(`9. Go to "Market Insights"`);
  console.log(`10. You'll see the listing`);
  console.log(`11. Click "Buy Now (Finternet)"`);
  console.log(`12. Complete the purchase!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
