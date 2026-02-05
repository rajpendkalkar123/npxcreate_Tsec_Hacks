// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RangerToken.sol";
import "./RoleRegistry.sol";
import "./interfaces/IFinternetGateway.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LendingPool
 * @notice Manages loans backed by eNWR collateral with automated disbursement
 * @dev Integrates with Finternet Gateway for rule-based loan disbursals
 */
contract LendingPool is ReentrancyGuard {
    RangerToken public rangerToken;
    RoleRegistry public roleRegistry;
    IFinternetGateway public finternetGateway;

    // Platform fee configuration
    address public platformAdmin;
    uint256 public platformFeeRate = 500; // 5% of interest earned (500 basis points)
    uint256 public collectedFees; // Total fees collected
    
    struct LoanOffer {
        address lender;
        uint256 tokenId;
        address farmer;
        uint256 collateralAmount; // Quantity pledged (kg)
        uint256 loanAmount; // Loan amount in wei
        uint256 interestRate; // Interest rate in basis points (e.g., 500 = 5%)
        uint256 duration; // Loan duration in seconds
        uint256 offeredAt;
        bool isAccepted;
        bool isRepaid;
    }

    struct ActiveLoan {
        uint256 offerId;
        uint256 disbursedAt;
        uint256 dueDate;
        uint256 amountDue; // Principal + interest
    }

    uint256 private _offerIdCounter;
    mapping(uint256 => LoanOffer) public loanOffers;
    mapping(address => mapping(uint256 => ActiveLoan)) public activeLoans; // farmer => tokenId => loan
    mapping(address => uint256[]) private farmerLoans;

    // LTV ratio configuration (Loan-to-Value)
    uint256 public constant MAX_LTV_BASIS_POINTS = 7000; // 70% max LTV

    // Events
    event LoanOffered(
        uint256 indexed offerId,
        address indexed lender,
        address indexed farmer,
        uint256 tokenId,
        uint256 loanAmount
    );
    event LoanAccepted(uint256 indexed offerId, uint256 disbursedAt);
    event LoanRepaid(uint256 indexed offerId, uint256 repaidAt, uint256 platformFee);
    event CollateralLiquidated(uint256 indexed offerId, uint256 timestamp);
    event PlatformFeeCollected(uint256 amount, uint256 totalCollected);
    event PlatformFeeWithdrawn(address indexed admin, uint256 amount);

    constructor(
        address _rangerToken,
        address _roleRegistry,
        address _finternetGateway
    ) {
        require(_rangerToken != address(0), "Invalid token address");
        require(_roleRegistry != address(0), "Invalid registry address");
        require(_finternetGateway != address(0), "Invalid gateway address");

        rangerToken = RangerToken(_rangerToken);
        roleRegistry = RoleRegistry(_roleRegistry);
        finternetGateway = IFinternetGateway(_finternetGateway);
        platformAdmin = msg.sender; // Deployer is the platform admin
    }

    /**
     * @notice Lender offers a loan against pledged eNWR collateral
     * @dev Anyone can offer loans - banks, individuals, or entities
     * @param farmer Address of the farmer
     * @param tokenId The token ID pledged as collateral
     * @param collateralAmount Quantity pledged (kg)
     * @param loanAmount Loan amount to offer (wei)
     * @param interestRate Interest rate in basis points (e.g., 500 = 5%)
     * @param duration Loan duration in seconds
     * @return offerId The created offer ID
     */
    function offerLoan(
        address farmer,
        uint256 tokenId,
        uint256 collateralAmount,
        uint256 loanAmount,
        uint256 interestRate,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        // Removed bank role check - anyone can be a lender
        require(farmer != address(0), "Invalid farmer address");
        require(collateralAmount > 0, "Collateral required");
        require(loanAmount > 0, "Loan amount required");
        require(duration > 0, "Duration required");
        require(rangerToken.isValid(tokenId), "Receipt expired");

        // Check if farmer has sufficient balance
        (bool isPledged, address lender, uint256 pledgedAmount) = rangerToken.getPledgeStatus(
            tokenId,
            farmer
        );
        require(isPledged && lender == msg.sender, "Collateral not pledged to this lender");
        require(pledgedAmount >= collateralAmount, "Insufficient collateral");

        _offerIdCounter++;
        uint256 offerId = _offerIdCounter;

        loanOffers[offerId] = LoanOffer({
            lender: msg.sender,
            tokenId: tokenId,
            farmer: farmer,
            collateralAmount: collateralAmount,
            loanAmount: loanAmount,
            interestRate: interestRate,
            duration: duration,
            offeredAt: block.timestamp,
            isAccepted: false,
            isRepaid: false
        });

        emit LoanOffered(offerId, msg.sender, farmer, tokenId, loanAmount);
        return offerId;
    }

    /**
     * @notice Farmer accepts a loan offer and receives disbursement
     * @param offerId The offer ID to accept
     */
    function acceptLoan(uint256 offerId) external nonReentrant {
        LoanOffer storage offer = loanOffers[offerId];
        require(!offer.isAccepted, "Loan already accepted");
        require(offer.farmer == msg.sender, "Not the borrower");
        require(rangerToken.isValid(offer.tokenId), "Receipt expired");

        // Check for existing active loan on this token
        require(activeLoans[msg.sender][offer.tokenId].offerId == 0, "Active loan exists");

        // Calculate amount due (principal + interest)
        uint256 interest = (offer.loanAmount * offer.interestRate) / 10000;
        uint256 amountDue = offer.loanAmount + interest;

        // Mark offer as accepted
        offer.isAccepted = true;

        // Record active loan
        activeLoans[msg.sender][offer.tokenId] = ActiveLoan({
            offerId: offerId,
            disbursedAt: block.timestamp,
            dueDate: block.timestamp + offer.duration,
            amountDue: amountDue
        });

        farmerLoans[msg.sender].push(offerId);

        // Disburse funds via Finternet Gateway or direct transfer
        bytes32 paymentRef = keccak256(abi.encodePacked("loan", offerId, block.timestamp));
        // Option 1: Direct transfer (simple)
        (bool success, ) = payable(msg.sender).call{value: offer.loanAmount}("");
        require(success, "Disbursement failed");

        // Option 2: Use Finternet Gateway (if configured)
        // finternetGateway.initiatePayment(msg.sender, offer.loanAmount, paymentRef);

        emit LoanAccepted(offerId, block.timestamp);
    }

    /**
     * @notice Farmer repays the loan
     * @param offerId The offer ID to repay
     */
    function repayLoan(uint256 offerId) external payable nonReentrant {
        LoanOffer storage offer = loanOffers[offerId];
        require(offer.isAccepted, "Loan not accepted");
        require(!offer.isRepaid, "Loan already repaid");
        require(offer.farmer == msg.sender, "Not the borrower");

        ActiveLoan memory activeLoan = activeLoans[msg.sender][offer.tokenId];
        require(activeLoan.offerId == offerId, "No active loan");
        require(msg.value >= activeLoan.amountDue, "Insufficient repayment");

        // Mark as repaid
        offer.isRepaid = true;
        delete activeLoans[msg.sender][offer.tokenId];

        // Release collateral (LendingPool contract has BANK_ROLE)
        rangerToken.unpledgeCollateral(offer.tokenId, msg.sender, offer.collateralAmount);

        // Calculate platform fee (% of interest earned)
        uint256 interestPaid = activeLoan.amountDue - offer.loanAmount;
        uint256 platformFee = (interestPaid * platformFeeRate) / 10000; // Basis points
        uint256 lenderAmount = activeLoan.amountDue - platformFee;

        // Collect platform fee
        collectedFees += platformFee;
        emit PlatformFeeCollected(platformFee, collectedFees);

        // Transfer repayment to lender (minus platform fee)
        (bool success, ) = payable(offer.lender).call{value: lenderAmount}("");
        require(success, "Repayment transfer failed");

        // Refund excess
        if (msg.value > activeLoan.amountDue) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - activeLoan.amountDue}("");
            require(refundSuccess, "Refund failed");
        }

        emit LoanRepaid(offerId, block.timestamp, platformFee);
    }

    /**
     * @notice Liquidate collateral if loan is overdue (callable by lender)
     * @param offerId The offer ID to liquidate
     */
    function liquidateCollateral(uint256 offerId) external nonReentrant {
        LoanOffer storage offer = loanOffers[offerId];
        require(offer.isAccepted, "Loan not accepted");
        require(!offer.isRepaid, "Loan already repaid");
        require(offer.lender == msg.sender, "Not the lender");

        ActiveLoan memory activeLoan = activeLoans[offer.farmer][offer.tokenId];
        require(block.timestamp > activeLoan.dueDate, "Loan not overdue");

        // Mark as repaid (via liquidation)
        offer.isRepaid = true;
        delete activeLoans[offer.farmer][offer.tokenId];

        // Transfer collateral to lender
        rangerToken.unpledgeCollateral(offer.tokenId, offer.farmer, offer.collateralAmount);
        rangerToken.safeTransferFrom(
            offer.farmer,
            msg.sender,
            offer.tokenId,
            offer.collateralAmount,
            ""
        );

        emit CollateralLiquidated(offerId, block.timestamp);
    }

    /**
     * @notice Get all loan offers for a farmer
     * @param farmer Address of the farmer
     */
    function getFarmerLoans(address farmer) external view returns (uint256[] memory) {
        return farmerLoans[farmer];
    }

    /**
     * @notice Get active loan details for a farmer's token
     * @param farmer Address of the farmer
     * @param tokenId The token ID
     */
    function getActiveLoan(address farmer, uint256 tokenId)
        external
        view
        returns (
            uint256 offerId,
            uint256 disbursedAt,
            uint256 dueDate,
            uint256 amountDue,
            bool isActive
        )
    {
        ActiveLoan memory loan = activeLoans[farmer][tokenId];
        return (loan.offerId, loan.disbursedAt, loan.dueDate, loan.amountDue, loan.offerId != 0);
    }

    /**
     * @notice Withdraw collected platform fees (only admin)
     */
    function withdrawPlatformFees() external nonReentrant {
        require(msg.sender == platformAdmin, "Only admin can withdraw");
        require(collectedFees > 0, "No fees to withdraw");

        uint256 amount = collectedFees;
        collectedFees = 0;

        (bool success, ) = payable(platformAdmin).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit PlatformFeeWithdrawn(platformAdmin, amount);
    }

    /**
     * @notice Update platform fee rate (only admin)
     * @param newFeeRate New fee rate in basis points (e.g., 500 = 5%)
     */
    function updatePlatformFeeRate(uint256 newFeeRate) external {
        require(msg.sender == platformAdmin, "Only admin");
        require(newFeeRate <= 1000, "Fee rate too high (max 10%)");
        platformFeeRate = newFeeRate;
    }

    /**
     * @notice Transfer platform admin role
     * @param newAdmin New admin address
     */
    function transferPlatformAdmin(address newAdmin) external {
        require(msg.sender == platformAdmin, "Only admin");
        require(newAdmin != address(0), "Invalid address");
        platformAdmin = newAdmin;
    }

    // Receive function to accept loan repayments and collateral funds
    receive() external payable {}
}
