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
        uint256 totalPrice
    );

    constructor(address _rangerToken, address _finternetGateway) {
        require(_rangerToken != address(0), "Invalid token address");
        require(_finternetGateway != address(0), "Invalid gateway address");
        rangerToken = RangerToken(_rangerToken);
        finternetGateway = IFinternetGateway(_finternetGateway);
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

        // Payment settlement via Finternet Gateway
        bytes32 paymentRef = keccak256(abi.encodePacked(listingId, msg.sender, block.timestamp));
        (bool paymentSuccess, ) = payable(listing.seller).call{value: totalPrice}("");
        require(paymentSuccess, "Payment transfer failed");

        // Alternatively, use Finternet Gateway (if configured):
        // finternetGateway.initiatePayment(listing.seller, totalPrice, paymentRef);

        // Refund excess payment
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(refundSuccess, "Refund failed");
        }

        emit PurchaseCompleted(listingId, msg.sender, quantity, totalPrice);
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
}
