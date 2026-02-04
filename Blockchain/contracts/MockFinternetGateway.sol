// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IFinternetGateway.sol";

/**
 * @title MockFinternetGateway
 * @notice Mock implementation of Finternet Gateway for testing
 * @dev Replace with actual Finternet SDK in production
 */
contract MockFinternetGateway is IFinternetGateway {
    struct Payment {
        address recipient;
        uint256 amount;
        uint256 timestamp;
        bool completed;
    }

    mapping(bytes32 => Payment) public payments;

    function initiatePayment(
        address recipient,
        uint256 amount,
        bytes32 referenceId
    ) external override returns (bool) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(payments[referenceId].timestamp == 0, "Payment already exists");

        payments[referenceId] = Payment({
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            completed: false
        });

        emit PaymentInitiated(referenceId, recipient, amount, block.timestamp);

        // Auto-complete for testing (in production, this would be async)
        payments[referenceId].completed = true;
        emit PaymentCompleted(referenceId, block.timestamp);

        return true;
    }

    function verifyPayment(bytes32 referenceId) external view override returns (bool) {
        return payments[referenceId].completed;
    }

    function getPaymentStatus(bytes32 referenceId)
        external
        view
        override
        returns (
            address recipient,
            uint256 amount,
            uint256 timestamp,
            bool completed
        )
    {
        Payment memory payment = payments[referenceId];
        return (payment.recipient, payment.amount, payment.timestamp, payment.completed);
    }
}
