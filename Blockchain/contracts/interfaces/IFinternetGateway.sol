// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFinternetGateway
 * @notice Interface for Finternet's Programmable Payment Gateway
 * @dev Mock implementation for testing; replace with actual Finternet SDK in production
 */
interface IFinternetGateway {
    /**
     * @notice Initiates a payment from the contract to a recipient
     * @param recipient Address to receive the payment
     * @param amount Payment amount in wei
     * @param referenceId Unique reference ID for tracking (e.g., loanId, listingId)
     * @return success Whether the payment initiation was successful
     */
    function initiatePayment(
        address recipient,
        uint256 amount,
        bytes32 referenceId
    ) external returns (bool success);

    /**
     * @notice Verifies if a payment has been completed
     * @param referenceId The reference ID to check
     * @return completed Whether the payment is completed
     */
    function verifyPayment(bytes32 referenceId) external view returns (bool completed);

    /**
     * @notice Gets payment status details
     * @param referenceId The reference ID to query
     * @return recipient The payment recipient
     * @return amount The payment amount
     * @return timestamp When the payment was initiated
     * @return completed Whether payment is completed
     */
    function getPaymentStatus(bytes32 referenceId)
        external
        view
        returns (
            address recipient,
            uint256 amount,
            uint256 timestamp,
            bool completed
        );

    /// @notice Emitted when a payment is initiated
    event PaymentInitiated(
        bytes32 indexed referenceId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Emitted when a payment is completed
    event PaymentCompleted(bytes32 indexed referenceId, uint256 timestamp);
}
