// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RoleRegistry
 * @notice Centralized registry for managing WDRA-registered warehouses and empaneled banks
 * @dev Implements role-based access control for Croplock ecosystem participants
 */
contract RoleRegistry is AccessControl {
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");

    struct Warehouse {
        string wdraRegNo; // WDRA Registration Number (e.g., "WDRA-MH-2023-123")
        string location; // Physical location
        bool isActive; // Active status
        uint256 registrationDate; // Block timestamp of registration
    }

    struct Bank {
        string name; // Bank name
        string licenseNo; // Banking license number
        bool isActive; // Active status
        uint256 registrationDate; // Block timestamp of registration
    }

    // Mappings
    mapping(address => Warehouse) public warehouses;
    mapping(address => Bank) public banks;
    address[] private warehouseList;
    address[] private bankList;

    // Events
    event WarehouseRegistered(
        address indexed operator,
        string wdraRegNo,
        string location,
        uint256 timestamp
    );
    event WarehouseDeactivated(address indexed operator, uint256 timestamp);
    event BankRegistered(address indexed bank, string name, uint256 timestamp);
    event BankDeactivated(address indexed bank, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRY_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Register a new WDRA-certified warehouse operator
     * @param operator Address of the warehouse operator
     * @param wdraRegNo WDRA registration number
     * @param location Physical location of the warehouse
     */
    function registerWarehouse(
        address operator,
        string memory wdraRegNo,
        string memory location
    ) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(operator != address(0), "Invalid operator address");
        require(bytes(wdraRegNo).length > 0, "WDRA Reg No required");
        require(!warehouses[operator].isActive, "Warehouse already registered");

        warehouses[operator] = Warehouse({
            wdraRegNo: wdraRegNo,
            location: location,
            isActive: true,
            registrationDate: block.timestamp
        });

        warehouseList.push(operator);
        emit WarehouseRegistered(operator, wdraRegNo, location, block.timestamp);
    }

    /**
     * @notice Deactivate a warehouse (e.g., license revoked)
     * @param operator Address of the warehouse operator
     */
    function deactivateWarehouse(address operator) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(warehouses[operator].isActive, "Warehouse not active");
        warehouses[operator].isActive = false;
        emit WarehouseDeactivated(operator, block.timestamp);
    }

    /**
     * @notice Register a bank/lender for loan operations
     * @param bank Address of the bank
     * @param name Bank name
     * @param licenseNo Banking license number
     */
    function registerBank(
        address bank,
        string memory name,
        string memory licenseNo
    ) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(bank != address(0), "Invalid bank address");
        require(bytes(name).length > 0, "Bank name required");
        require(!banks[bank].isActive, "Bank already registered");

        banks[bank] = Bank({
            name: name,
            licenseNo: licenseNo,
            isActive: true,
            registrationDate: block.timestamp
        });

        bankList.push(bank);
        emit BankRegistered(bank, name, block.timestamp);
    }

    /**
     * @notice Deactivate a bank
     * @param bank Address of the bank
     */
    function deactivateBank(address bank) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(banks[bank].isActive, "Bank not active");
        banks[bank].isActive = false;
        emit BankDeactivated(bank, block.timestamp);
    }

    // View functions
    function isWarehouseActive(address operator) external view returns (bool) {
        return warehouses[operator].isActive;
    }

    function isBankActive(address bank) external view returns (bool) {
        return banks[bank].isActive;
    }

    function getAllWarehouses() external view returns (address[] memory) {
        return warehouseList;
    }

    function getAllBanks() external view returns (address[] memory) {
        return bankList;
    }
}
