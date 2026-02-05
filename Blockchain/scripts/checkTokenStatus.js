const { ethers } = require("hardhat");

async function main() {
  const RANGER_TOKEN_ADDRESS = "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b";
  
  // Your farmer address
  const FARMER_ADDRESS = "0x2e73869ca96E371DCa9E9430c470c8468820c3FF";
  const TOKEN_ID = 4; // The token you're trying to sell
  
  console.log(`🔍 Checking Token #${TOKEN_ID} for ${FARMER_ADDRESS}\n`);
  
  const rangerToken = await ethers.getContractAt("RangerToken", RANGER_TOKEN_ADDRESS);
  
  // Get balance
  const balance = await rangerToken.balanceOf(FARMER_ADDRESS, TOKEN_ID);
  console.log(`📦 Total Balance: ${balance} kg`);
  
  // Get pledge status
  const pledgeStatus = await rangerToken.getPledgeStatus(TOKEN_ID, FARMER_ADDRESS);
  const isPledged = pledgeStatus[0];
  const lender = pledgeStatus[1];
  const pledgedAmount = pledgeStatus[2];
  
  console.log(`\n🔒 Pledge Status:`);
  console.log(`  Is Pledged: ${isPledged}`);
  if (isPledged) {
    console.log(`  Lender: ${lender}`);
    console.log(`  Pledged Amount: ${pledgedAmount} kg`);
  }
  
  const availableToSell = balance - pledgedAmount;
  console.log(`\n✅ Available to Sell: ${availableToSell} kg`);
  
  if (availableToSell === 0n) {
    console.log(`\n⚠️  WARNING: All tokens are pledged as loan collateral!`);
    console.log(`You must repay your loan before selling these tokens.`);
  } else if (isPledged) {
    console.log(`\n⚠️  PARTIAL PLEDGE: You can only sell up to ${availableToSell} kg`);
  } else {
    console.log(`\n✅ No pledges - you can sell the full balance!`);
  }
  
  // Check validity
  const isValid = await rangerToken.isValid(TOKEN_ID);
  console.log(`\n📅 Valid: ${isValid}`);
  
  if (!isValid) {
    console.log(`⚠️  Token has expired - cannot be sold or traded`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
