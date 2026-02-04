// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./RoleRegistry.sol";

/**
 * @title RangerToken
 * @notice ERC-1155 token representing WDRA-compliant Electronic Negotiable Warehouse Receipts (eNWRs)
 * @dev Implements tokenization of agricultural commodities with IPFS metadata linking
 */
contract RangerToken is ERC1155, AccessControl, ERC1155Supply, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // Warehouse operators
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE"); // Empaneled banks

    RoleRegistry public roleRegistry;

    // Token metadata
    mapping(uint256 => string) private _tokenURIs; // tokenId => IPFS URI
    mapping(uint256 => uint256) public receiptExpiry; // tokenId => expiry timestamp
    mapping(uint256 => uint256) public receiptCreation; // tokenId => creation timestamp

    // Pledge tracking (for loan collateral)
    struct PledgeInfo {
        address lender;
        uint256 amount; // Quantity pledged (in kg, 1 token = 1 kg)
        uint256 timestamp;
        bool isActive;
    }
    mapping(uint256 => mapping(address => PledgeInfo)) public pledges; // tokenId => farmer => PledgeInfo
    mapping(uint256 => uint256) public totalPledged; // tokenId => total pledged amount

    uint256 private _tokenIdCounter;

    // Events
    event ReceiptIssued(
        uint256 indexed tokenId,
        address indexed farmer,
        uint256 quantity,
        uint256 expiryTimestamp,
        string ipfsHash
    );
    event CollateralPledged(
        uint256 indexed tokenId,
        address indexed farmer,
        address indexed lender,
        uint256 amount
    );
    event CollateralUnpledged(
        uint256 indexed tokenId,
        address indexed farmer,
        uint256 amount
    );
    event MetadataUpdated(uint256 indexed tokenId, string newIpfsHash, uint256 timestamp);

    constructor(address _roleRegistry) ERC1155("") {
        require(_roleRegistry != address(0), "Invalid registry address");
        roleRegistry = RoleRegistry(_roleRegistry);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Issue a new eNWR token to a farmer upon commodity deposit
     * @param farmer Address of the farmer (depositor)
     * @param quantity Quantity in kg (1 token = 1 kg)
     * @param expiryTimestamp Unix timestamp when receipt expires
     * @param ipfsHash IPFS URI containing WDRA Form A metadata
     * @return tokenId The newly minted token ID
     */
    function issueReceipt(
        address farmer,
        uint256 quantity,
        uint256 expiryTimestamp,
        string memory ipfsHash
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(farmer != address(0), "Invalid farmer address");
        require(quantity > 0, "Quantity must be > 0");
        require(expiryTimestamp > block.timestamp, "Expiry must be in future");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(roleRegistry.isWarehouseActive(msg.sender), "Warehouse not active");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        // Mint tokens (1 token = 1 kg)
        _mint(farmer, tokenId, quantity, "");

        // Store metadata
        _tokenURIs[tokenId] = ipfsHash;
        receiptExpiry[tokenId] = expiryTimestamp;
        receiptCreation[tokenId] = block.timestamp;

        emit ReceiptIssued(tokenId, farmer, quantity, expiryTimestamp, ipfsHash);
        return tokenId;
    }

    /**
     * @notice Pledge tokens as collateral for a loan
     * @param tokenId The token ID to pledge
     * @param amount Quantity to pledge (in kg)
     * @param lender Address of the bank/lender
     */
    function pledgeCollateral(
        uint256 tokenId,
        uint256 amount,
        address lender
    ) external whenNotPaused {
        require(isValid(tokenId), "Receipt expired");
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be > 0");
        require(roleRegistry.isBankActive(lender), "Lender not active");

        PledgeInfo storage pledge = pledges[tokenId][msg.sender];
        require(!pledge.isActive || pledge.lender == lender, "Already pledged to different lender");

        if (pledge.isActive) {
            pledge.amount += amount;
        } else {
            pledges[tokenId][msg.sender] = PledgeInfo({
                lender: lender,
                amount: amount,
                timestamp: block.timestamp,
                isActive: true
            });
        }

        totalPledged[tokenId] += amount;
        emit CollateralPledged(tokenId, msg.sender, lender, amount);
    }

    /**
     * @notice Unpledge tokens after loan repayment (only callable by lender)
     * @param tokenId The token ID
     * @param farmer Address of the farmer
     * @param amount Quantity to unpledge
     */
    function unpledgeCollateral(
        uint256 tokenId,
        address farmer,
        uint256 amount
    ) external onlyRole(BANK_ROLE) {
        PledgeInfo storage pledge = pledges[tokenId][farmer];
        require(pledge.isActive, "No active pledge");
        // LendingPool contract can unpledge on behalf of any lender
        require(pledge.amount >= amount, "Amount exceeds pledge");

        pledge.amount -= amount;
        totalPledged[tokenId] -= amount;

        if (pledge.amount == 0) {
            pledge.isActive = false;
        }

        emit CollateralUnpledged(tokenId, farmer, amount);
    }

    /**
     * @notice Update metadata URI (e.g., for insurance renewal, quality changes)
     * @param tokenId The token ID
     * @param newIpfsHash New IPFS URI
     */
    function updateMetadata(uint256 tokenId, string memory newIpfsHash)
        external
        onlyRole(MINTER_ROLE)
    {
        require(exists(tokenId), "Token does not exist");
        require(bytes(newIpfsHash).length > 0, "IPFS hash required");

        _tokenURIs[tokenId] = newIpfsHash;
        emit MetadataUpdated(tokenId, newIpfsHash, block.timestamp);
    }

    /**
     * @notice Check if a receipt is still valid (not expired)
     * @param tokenId The token ID
     * @return valid True if not expired
     */
    function isValid(uint256 tokenId) public view returns (bool) {
        return block.timestamp < receiptExpiry[tokenId];
    }

    /**
     * @notice Get IPFS metadata URI for a token
     * @param tokenId The token ID
     * @return IPFS URI string
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    /**
     * @notice Get pledge status for a farmer's token
     * @param tokenId The token ID
     * @param farmer Address of the farmer
     */
    function getPledgeStatus(uint256 tokenId, address farmer)
        external
        view
        returns (
            bool isPledged,
            address lender,
            uint256 amount
        )
    {
        PledgeInfo memory pledge = pledges[tokenId][farmer];
        return (pledge.isActive, pledge.lender, pledge.amount);
    }

    /**
     * @notice Get detailed receipt information
     * @param tokenId The token ID
     */
    function getReceiptDetails(uint256 tokenId)
        external
        view
        returns (
            uint256 supply,
            uint256 creation,
            uint256 expiry,
            string memory ipfsHash,
            bool valid
        )
    {
        require(exists(tokenId), "Token does not exist");
        return (
            totalSupply(tokenId),
            receiptCreation[tokenId],
            receiptExpiry[tokenId],
            _tokenURIs[tokenId],
            isValid(tokenId)
        );
    }

    // Emergency controls
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Override _update to enforce transfer restrictions
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        // Skip checks for minting and burning
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                uint256 tokenId = ids[i];
                uint256 amount = values[i];

                // Check if receipt is valid
                require(isValid(tokenId), "Cannot transfer expired receipt");

                // Check if sufficient unpledged balance
                PledgeInfo memory pledge = pledges[tokenId][from];
                uint256 availableBalance = balanceOf(from, tokenId) - (pledge.isActive ? pledge.amount : 0);
                require(availableBalance >= amount, "Insufficient unpledged balance");
            }
        }

        super._update(from, to, ids, values);
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
