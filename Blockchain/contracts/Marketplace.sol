// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RangerToken.sol";
import "./interfaces/IFinternetGateway.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Marketplace
 * @notice Peer-to-peer marketplace for trading eNWR tokens with instant settlements
 * @dev Integrates with Finternet's Programmable Payment Gateway for automated payments
 */
contract Marketplace is ReentrancyGuard {
    RangerToken public rangerToken;
    IFinternetGateway public finternetGateway;

    // Platform fee configuration
    address public platformAdmin;
    uint256 public platformFeeRate = 250; // 2.5% of sale price (250 basis points)
    uint256 public collectedFees; // Total fees collected

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 quantity; // Quantity for sale (in kg)
        uint256 pricePerKg; // Price per kg in wei
        bool isActive;
        uint256 createdAt;
    }

    uint256 private _listingIdCounter;
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) private sellerListings;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 quantity,
        uint256 pricePerKg
    );
    event ListingCancelled(uint256 indexed listingId, uint256 timestamp);
    event PurchaseCompleted(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice,
        uint256 platformFee
    );
    event PlatformFeeCollected(uint256 amount, uint256 totalCollected);
    event PlatformFeeWithdrawn(address indexed admin, uint256 amount);

    constructor(address _rangerToken, address _finternetGateway) {
        require(_rangerToken != address(0), "Invalid token address");
        require(_finternetGateway != address(0), "Invalid gateway address");
        rangerToken = RangerToken(_rangerToken);
        finternetGateway = IFinternetGateway(_finternetGateway);
        platformAdmin = msg.sender; // Deployer is the platform admin
    }

    /**
     * @notice List eNWR tokens for sale
     * @param tokenId The token ID to sell
     * @param quantity Quantity to sell (in kg)
     * @param pricePerKg Price per kg in wei
     * @return listingId The created listing ID
     */
    function listForSale(
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerKg
    ) external nonReentrant returns (uint256) {
        require(quantity > 0, "Quantity must be > 0");
        require(pricePerKg > 0, "Price must be > 0");
        require(rangerToken.isValid(tokenId), "Receipt expired");

        // Check unpledged balance
        uint256 balance = rangerToken.balanceOf(msg.sender, tokenId);
        (bool isPledged, , uint256 pledgedAmount) = rangerToken.getPledgeStatus(tokenId, msg.sender);
        uint256 availableBalance = balance - (isPledged ? pledgedAmount : 0);
        require(availableBalance >= quantity, "Insufficient unpledged balance");

        _listingIdCounter++;
        uint256 listingId = _listingIdCounter;

        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            quantity: quantity,
            pricePerKg: pricePerKg,
            isActive: true,
            createdAt: block.timestamp
        });

        sellerListings[msg.sender].push(listingId);

        emit ListingCreated(listingId, msg.sender, tokenId, quantity, pricePerKg);
        return listingId;
    }

    /**
     * @notice Cancel an active listing
     * @param listingId The listing ID to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        listing.isActive = false;
        emit ListingCancelled(listingId, block.timestamp);
    }

    /**
     * @notice Purchase tokens from a listing
     * @param listingId The listing ID to purchase from
     * @param quantity Quantity to purchase (in kg)
     */
    function buyToken(uint256 listingId, uint256 quantity) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(quantity > 0 && quantity <= listing.quantity, "Invalid quantity");
        require(rangerToken.isValid(listing.tokenId), "Receipt expired");

        uint256 totalPrice = quantity * listing.pricePerKg;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Calculate platform fee
        uint256 platformFee = (totalPrice * platformFeeRate) / 10000; // Basis points
        uint256 sellerAmount = totalPrice - platformFee;

        // Update listing
        listing.quantity -= quantity;
        if (listing.quantity == 0) {
            listing.isActive = false;
        }

        // Transfer tokens to buyer
        rangerToken.safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId,
            quantity,
            ""
        );

        // Collect platform fee
        collectedFees += platformFee;
        emit PlatformFeeCollected(platformFee, collectedFees);

        // Payment settlement to seller (minus platform fee)
        bytes32 paymentRef = keccak256(abi.encodePacked(listingId, msg.sender, block.timestamp));
        (bool paymentSuccess, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(paymentSuccess, "Payment transfer failed");

        // Alternatively, use Finternet Gateway (if configured):
        // finternetGateway.initiatePayment(listing.seller, sellerAmount, paymentRef);

        // Refund excess payment
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(refundSuccess, "Refund failed");
        }

        emit PurchaseCompleted(listingId, msg.sender, quantity, totalPrice, platformFee);
    }

    /**
     * @notice Get all active listings for a seller
     * @param seller Address of the seller
     * @return Array of listing IDs
     */
    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    /**
     * @notice Get listing details
     * @param listingId The listing ID
     */
    function getListing(uint256 listingId)
        external
        view
        returns (
            address seller,
            uint256 tokenId,
            uint256 quantity,
            uint256 pricePerKg,
            bool isActive,
            uint256 createdAt
        )
    {
        Listing memory listing = listings[listingId];
        return (
            listing.seller,
            listing.tokenId,
            listing.quantity,
            listing.pricePerKg,
            listing.isActive,
            listing.createdAt
        );
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
     * @param newFeeRate New fee rate in basis points (e.g., 250 = 2.5%)
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
}
