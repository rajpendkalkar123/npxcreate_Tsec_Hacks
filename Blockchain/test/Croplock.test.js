const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Croplock - Complete Integration Tests", function () {
  let roleRegistry,
    rangerToken,
    marketplace,
    lendingPool,
    finternetGateway;
  let deployer, warehouse, bank, farmer1, farmer2, buyer;
  let MINTER_ROLE, BANK_ROLE, REGISTRY_ADMIN_ROLE;

  const IPFS_HASH_1 = "ipfs://QmExampleHash1/wheat_receipt.json";
  const IPFS_HASH_2 = "ipfs://QmExampleHash2/rice_receipt.json";

  beforeEach(async function () {
    [deployer, warehouse, bank, farmer1, farmer2, buyer] = await ethers.getSigners();

    // Deploy RoleRegistry
    const RoleRegistry = await ethers.getContractFactory("RoleRegistry");
    roleRegistry = await RoleRegistry.deploy();
    await roleRegistry.waitForDeployment();

    // Deploy MockFinternetGateway
    const MockFinternetGateway = await ethers.getContractFactory("MockFinternetGateway");
    finternetGateway = await MockFinternetGateway.deploy();
    await finternetGateway.waitForDeployment();

    // Deploy RangerToken
    const RangerToken = await ethers.getContractFactory("RangerToken");
    rangerToken = await RangerToken.deploy(await roleRegistry.getAddress());
    await rangerToken.waitForDeployment();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(
      await rangerToken.getAddress(),
      await finternetGateway.getAddress()
    );
    await marketplace.waitForDeployment();

    // Deploy LendingPool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPool.deploy(
      await rangerToken.getAddress(),
      await roleRegistry.getAddress(),
      await finternetGateway.getAddress()
    );
    await lendingPool.waitForDeployment();

    // Get role identifiers
    MINTER_ROLE = await rangerToken.MINTER_ROLE();
    BANK_ROLE = await rangerToken.BANK_ROLE();
    REGISTRY_ADMIN_ROLE = await roleRegistry.REGISTRY_ADMIN_ROLE();

    // Setup: Register warehouse and bank
    await roleRegistry.registerWarehouse(warehouse.address, "WDRA-MH-2023-123", "Mumbai");
    await roleRegistry.registerBank(bank.address, "State Bank of India", "BANK-LIC-001");

    // Grant roles
    await rangerToken.grantRole(MINTER_ROLE, warehouse.address);
    await rangerToken.grantRole(BANK_ROLE, await lendingPool.getAddress());
  });

  describe("1. Role Registry", function () {
    it("Should register warehouse with WDRA details", async function () {
      const warehouseInfo = await roleRegistry.warehouses(warehouse.address);
      expect(warehouseInfo.wdraRegNo).to.equal("WDRA-MH-2023-123");
      expect(warehouseInfo.isActive).to.be.true;
    });

    it("Should register bank", async function () {
      const bankInfo = await roleRegistry.banks(bank.address);
      expect(bankInfo.name).to.equal("State Bank of India");
      expect(bankInfo.isActive).to.be.true;
    });

    it("Should prevent non-admin from registering warehouse", async function () {
      await expect(
        roleRegistry.connect(farmer1).registerWarehouse(farmer2.address, "WDRA-001", "Delhi")
      ).to.be.reverted;
    });
  });

  describe("2. eNWR Token Issuance", function () {
    it("Should issue eNWR token with IPFS metadata", async function () {
      const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60; // 1 year
      const quantity = 5000; // 5000 kg

      await expect(
        rangerToken.connect(warehouse).issueReceipt(farmer1.address, quantity, expiryTime, IPFS_HASH_1)
      )
        .to.emit(rangerToken, "ReceiptIssued")
        .withArgs(1, farmer1.address, quantity, expiryTime, IPFS_HASH_1);

      const balance = await rangerToken.balanceOf(farmer1.address, 1);
      expect(balance).to.equal(quantity);

      const uri = await rangerToken.uri(1);
      expect(uri).to.equal(IPFS_HASH_1);
    });

    it("Should prevent issuance with expired date", async function () {
      const pastTime = (await time.latest()) - 1000;
      await expect(
        rangerToken.connect(warehouse).issueReceipt(farmer1.address, 1000, pastTime, IPFS_HASH_1)
      ).to.be.revertedWith("Expiry must be in future");
    });

    it("Should prevent non-warehouse from issuing", async function () {
      const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
      await expect(
        rangerToken.connect(farmer1).issueReceipt(farmer2.address, 1000, expiryTime, IPFS_HASH_1)
      ).to.be.reverted;
    });

    it("Should get receipt details correctly", async function () {
      const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
      await rangerToken.connect(warehouse).issueReceipt(farmer1.address, 3000, expiryTime, IPFS_HASH_1);

      const details = await rangerToken.getReceiptDetails(1);
      expect(details.supply).to.equal(3000);
      expect(details.expiry).to.equal(expiryTime);
      expect(details.ipfsHash).to.equal(IPFS_HASH_1);
      expect(details.valid).to.be.true;
    });
  });

  describe("3. Pledge & Collateral Management", function () {
    beforeEach(async function () {
      const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
      await rangerToken.connect(warehouse).issueReceipt(farmer1.address, 5000, expiryTime, IPFS_HASH_1);
    });

    it("Should pledge tokens as collateral", async function () {
      await expect(rangerToken.connect(farmer1).pledgeCollateral(1, 2000, bank.address))
        .to.emit(rangerToken, "CollateralPledged")
        .withArgs(1, farmer1.address, bank.address, 2000);

      const pledgeStatus = await rangerToken.getPledgeStatus(1, farmer1.address);
      expect(pledgeStatus.isPledged).to.be.true;
      expect(pledgeStatus.lender).to.equal(bank.address);
      expect(pledgeStatus.amount).to.equal(2000);
    });

    it("Should prevent transfer of pledged tokens", async function () {
      await rangerToken.connect(farmer1).pledgeCollateral(1, 2000, bank.address);

      // Farmer has 5000, pledged 2000, available = 3000
      // Trying to transfer 3001 should fail
      await expect(
        rangerToken.connect(farmer1).safeTransferFrom(farmer1.address, buyer.address, 1, 3001, "0x")
      ).to.be.revertedWith("Insufficient unpledged balance");
    });

    it("Should allow transfer of unpledged tokens", async function () {
      await rangerToken.connect(farmer1).pledgeCollateral(1, 2000, bank.address);

      await expect(
        rangerToken.connect(farmer1).safeTransferFrom(farmer1.address, buyer.address, 1, 3000, "0x")
      ).to.not.be.reverted;

      expect(await rangerToken.balanceOf(buyer.address, 1)).to.equal(3000);
    });

    it("Should unpledge tokens (by lender)", async function () {
      await rangerToken.connect(farmer1).pledgeCollateral(1, 2000, bank.address);

      // Grant BANK_ROLE to bank address for testing
      await rangerToken.grantRole(BANK_ROLE, bank.address);

      await expect(rangerToken.connect(bank).unpledgeCollateral(1, farmer1.address, 2000))
        .to.emit(rangerToken, "CollateralUnpledged")
        .withArgs(1, farmer1.address, 2000);

      const pledgeStatus = await rangerToken.getPledgeStatus(1, farmer1.address);
      expect(pledgeStatus.isPledged).to.be.false;
    });
  });

  describe("4. Marketplace - P2P Trading", function () {
    beforeEach(async function () {
      const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
      await rangerToken.connect(warehouse).issueReceipt(farmer1.address, 5000, expiryTime, IPFS_HASH_1);
    });

    it("Should list tokens for sale", async function () {
      const pricePerKg = ethers.parseEther("0.01"); // 0.01 ETH per kg

      await expect(marketplace.connect(farmer1).listForSale(1, 3000, pricePerKg))
        .to.emit(marketplace, "ListingCreated")
        .withArgs(1, farmer1.address, 1, 3000, pricePerKg);
    });

    it("Should buy tokens from listing", async function () {
      const pricePerKg = ethers.parseEther("0.01");
      await marketplace.connect(farmer1).listForSale(1, 3000, pricePerKg);

      // Approve marketplace to transfer tokens
      await rangerToken.connect(farmer1).setApprovalForAll(await marketplace.getAddress(), true);

      const totalPrice = pricePerKg * 1000n; // Buy 1000 kg
      const platformFee = (totalPrice * 250n) / 10000n; // 2.5% fee
      await expect(marketplace.connect(buyer).buyToken(1, 1000, { value: totalPrice }))
        .to.emit(marketplace, "PurchaseCompleted")
        .withArgs(1, buyer.address, 1000, totalPrice, platformFee);

      expect(await rangerToken.balanceOf(buyer.address, 1)).to.equal(1000);
    });

    it("Should cancel listing", async function () {
      const pricePerKg = ethers.parseEther("0.01");
      await marketplace.connect(farmer1).listForSale(1, 3000, pricePerKg);

      await expect(marketplace.connect(farmer1).cancelListing(1))
        .to.emit(marketplace, "ListingCancelled");

      const listing = await marketplace.getListing(1);
      expect(listing.isActive).to.be.false;
    });

    it("Should prevent listing pledged tokens", async function () {
      await rangerToken.connect(farmer1).pledgeCollateral(1, 3000, bank.address);

      const pricePerKg = ethers.parseEther("0.01");
      await expect(marketplace.connect(farmer1).listForSale(1, 3000, pricePerKg)).to.be.revertedWith(
        "Insufficient unpledged balance"
      );
    });
  });

  describe("5. Lending Pool", function () {
    beforeEach(async function () {
      const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
      await rangerToken.connect(warehouse).issueReceipt(farmer1.address, 5000, expiryTime, IPFS_HASH_1);

      // Farmer pledges collateral
      await rangerToken.connect(farmer1).pledgeCollateral(1, 3000, bank.address);
    });

    it("Should offer loan against pledged collateral", async function () {
      const loanAmount = ethers.parseEther("10"); // 10 ETH loan
      const interestRate = 500; // 5%
      const duration = 30 * 24 * 60 * 60; // 30 days

      await expect(
        lendingPool.connect(bank).offerLoan(farmer1.address, 1, 3000, loanAmount, interestRate, duration)
      )
        .to.emit(lendingPool, "LoanOffered")
        .withArgs(1, bank.address, farmer1.address, 1, loanAmount);
    });

    it("Should accept loan and receive disbursement", async function () {
      const loanAmount = ethers.parseEther("10");
      const interestRate = 500; // 5%
      const duration = 30 * 24 * 60 * 60;

      await lendingPool.connect(bank).offerLoan(farmer1.address, 1, 3000, loanAmount, interestRate, duration);

      // Fund the lending pool
      await bank.sendTransaction({ to: await lendingPool.getAddress(), value: ethers.parseEther("20") });

      const farmerBalanceBefore = await ethers.provider.getBalance(farmer1.address);

      await expect(lendingPool.connect(farmer1).acceptLoan(1)).to.emit(lendingPool, "LoanAccepted");

      const farmerBalanceAfter = await ethers.provider.getBalance(farmer1.address);
      expect(farmerBalanceAfter).to.be.gt(farmerBalanceBefore);
    });

    it("Should repay loan and release collateral", async function () {
      const loanAmount = ethers.parseEther("10");
      const interestRate = 500;
      const duration = 30 * 24 * 60 * 60;

      await lendingPool.connect(bank).offerLoan(farmer1.address, 1, 3000, loanAmount, interestRate, duration);
      await bank.sendTransaction({ to: await lendingPool.getAddress(), value: ethers.parseEther("20") });
      await lendingPool.connect(farmer1).acceptLoan(1);

      // Calculate repayment amount
      const interest = (loanAmount * BigInt(interestRate)) / 10000n;
      const amountDue = loanAmount + interest;
      const platformFee = (interest * 500n) / 10000n; // 5% of interest

      await expect(lendingPool.connect(farmer1).repayLoan(1, { value: amountDue }))
        .to.emit(lendingPool, "LoanRepaid")
        .withArgs(1, await time.latest() + 1, platformFee);

      // Check collateral released
      const pledgeStatus = await rangerToken.getPledgeStatus(1, farmer1.address);
      expect(pledgeStatus.isPledged).to.be.false;
    });

    it("Should liquidate collateral if loan overdue", async function () {
      const loanAmount = ethers.parseEther("10");
      const interestRate = 500;
      const duration = 30 * 24 * 60 * 60;

      await lendingPool.connect(bank).offerLoan(farmer1.address, 1, 3000, loanAmount, interestRate, duration);
      await bank.sendTransaction({ to: await lendingPool.getAddress(), value: ethers.parseEther("20") });
      await lendingPool.connect(farmer1).acceptLoan(1);

      // Fast forward past due date
      await time.increase(duration + 1);

      // Approve lendingPool to transfer tokens
      await rangerToken.connect(farmer1).setApprovalForAll(await lendingPool.getAddress(), true);

      await expect(lendingPool.connect(bank).liquidateCollateral(1))
        .to.emit(lendingPool, "CollateralLiquidated");

      // Check bank received collateral
      expect(await rangerToken.balanceOf(bank.address, 1)).to.equal(3000);
    });
  });

  describe("6. Expiry & Validity", function () {
    it("Should prevent transfer of expired receipts", async function () {
      const expiryTime = (await time.latest()) + 1000; // 1000 seconds
      await rangerToken.connect(warehouse).issueReceipt(farmer1.address, 2000, expiryTime, IPFS_HASH_1);

      // Fast forward past expiry
      await time.increase(1001);

      await expect(
        rangerToken.connect(farmer1).safeTransferFrom(farmer1.address, buyer.address, 1, 1000, "0x")
      ).to.be.revertedWith("Cannot transfer expired receipt");
    });

    it("Should report receipt as invalid after expiry", async function () {
      const expiryTime = (await time.latest()) + 1000;
      await rangerToken.connect(warehouse).issueReceipt(farmer1.address, 2000, expiryTime, IPFS_HASH_1);

      expect(await rangerToken.isValid(1)).to.be.true;

      await time.increase(1001);
      expect(await rangerToken.isValid(1)).to.be.false;
    });
  });

  describe("7. Metadata Updates", function () {
    it("Should update IPFS metadata", async function () {
      const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
      await rangerToken.connect(warehouse).issueReceipt(farmer1.address, 3000, expiryTime, IPFS_HASH_1);

      const newHash = "ipfs://QmNewHash/updated_receipt.json";
      await expect(rangerToken.connect(warehouse).updateMetadata(1, newHash))
        .to.emit(rangerToken, "MetadataUpdated")
        .withArgs(1, newHash, await time.latest() + 1);

      expect(await rangerToken.uri(1)).to.equal(newHash);
    });
  });

  describe("8. Emergency Controls", function () {
    it("Should pause contract", async function () {
      await rangerToken.pause();

      const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
      await expect(
        rangerToken.connect(warehouse).issueReceipt(farmer1.address, 1000, expiryTime, IPFS_HASH_1)
      ).to.be.reverted;
    });

    it("Should unpause contract", async function () {
      await rangerToken.pause();
      await rangerToken.unpause();

      const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
      await expect(
        rangerToken.connect(warehouse).issueReceipt(farmer1.address, 1000, expiryTime, IPFS_HASH_1)
      ).to.not.be.reverted;
    });
  });
});
