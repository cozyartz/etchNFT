// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title EtchNFT
 * @dev Smart contract for managing physical NFT etching orders and minting certificates
 */
contract EtchNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Counters for token IDs and order IDs
    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _orderIdCounter;

    // Order status enumeration
    enum OrderStatus {
        Pending,
        Confirmed,
        InProduction,
        Shipped,
        Delivered,
        Cancelled,
        Refunded
    }

    // Order structure
    struct Order {
        uint256 orderId;
        address customer;
        string externalOrderId; // UUID from off-chain system
        uint256 amount;
        OrderStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        address originalContract;
        uint256 originalTokenId;
        string metadataURI;
        bool escrowReleased;
        uint256 mintedTokenId; // 0 if not minted yet
    }

    // Events
    event OrderCreated(
        uint256 indexed orderId,
        address indexed customer,
        string externalOrderId,
        uint256 amount,
        address originalContract,
        uint256 originalTokenId
    );
    
    event OrderStatusUpdated(
        uint256 indexed orderId,
        OrderStatus oldStatus,
        OrderStatus newStatus
    );
    
    event OrderCancelled(uint256 indexed orderId, uint256 refundAmount);
    event OrderFulfilled(uint256 indexed orderId, uint256 mintedTokenId);
    event EscrowReleased(uint256 indexed orderId, uint256 amount);
    event RefundProcessed(uint256 indexed orderId, address customer, uint256 amount);

    // State variables
    mapping(uint256 => Order) public orders;
    mapping(string => uint256) public externalOrderToInternal;
    mapping(address => uint256[]) public customerOrders;
    
    // Configuration
    uint256 public constant ORDER_TIMEOUT = 30 days; // Auto-refund after 30 days if not fulfilled
    uint256 public platformFeePercentage = 250; // 2.5% platform fee (basis points)
    address public platformFeeRecipient;
    
    // Admin addresses
    mapping(address => bool) public fulfillmentOperators;

    constructor(
        string memory name,
        string memory symbol,
        address _platformFeeRecipient
    ) ERC721(name, symbol) {
        platformFeeRecipient = _platformFeeRecipient;
        fulfillmentOperators[msg.sender] = true;
    }

    modifier onlyFulfillmentOperator() {
        require(fulfillmentOperators[msg.sender], "Not authorized fulfillment operator");
        _;
    }

    modifier validOrder(uint256 orderId) {
        require(orderId > 0 && orderId <= _orderIdCounter.current(), "Invalid order ID");
        _;
    }

    /**
     * @dev Add or remove fulfillment operators
     */
    function setFulfillmentOperator(address operator, bool authorized) external onlyOwner {
        fulfillmentOperators[operator] = authorized;
    }

    /**
     * @dev Update platform fee percentage (only owner)
     */
    function setPlatformFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFeePercentage = _feePercentage;
    }

    /**
     * @dev Update platform fee recipient (only owner)
     */
    function setPlatformFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient address");
        platformFeeRecipient = _recipient;
    }

    /**
     * @dev Create a new order with escrow
     */
    function createOrder(
        string memory externalOrderId,
        address originalContract,
        uint256 originalTokenId,
        string memory metadataURI
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Order amount must be greater than 0");
        require(bytes(externalOrderId).length > 0, "External order ID required");
        require(externalOrderToInternal[externalOrderId] == 0, "Order already exists");

        _orderIdCounter.increment();
        uint256 orderId = _orderIdCounter.current();

        Order storage order = orders[orderId];
        order.orderId = orderId;
        order.customer = msg.sender;
        order.externalOrderId = externalOrderId;
        order.amount = msg.value;
        order.status = OrderStatus.Pending;
        order.createdAt = block.timestamp;
        order.updatedAt = block.timestamp;
        order.originalContract = originalContract;
        order.originalTokenId = originalTokenId;
        order.metadataURI = metadataURI;
        order.escrowReleased = false;
        order.mintedTokenId = 0;

        externalOrderToInternal[externalOrderId] = orderId;
        customerOrders[msg.sender].push(orderId);

        emit OrderCreated(
            orderId,
            msg.sender,
            externalOrderId,
            msg.value,
            originalContract,
            originalTokenId
        );
    }

    /**
     * @dev Update order status (fulfillment operators only)
     */
    function updateOrderStatus(
        uint256 orderId,
        OrderStatus newStatus
    ) external onlyFulfillmentOperator validOrder(orderId) {
        Order storage order = orders[orderId];
        require(order.status != OrderStatus.Cancelled, "Cannot update cancelled order");
        require(order.status != OrderStatus.Refunded, "Cannot update refunded order");

        OrderStatus oldStatus = order.status;
        order.status = newStatus;
        order.updatedAt = block.timestamp;

        emit OrderStatusUpdated(orderId, oldStatus, newStatus);
    }

    /**
     * @dev Fulfill order by minting etched NFT certificate
     */
    function fulfillOrder(
        uint256 orderId,
        string memory tokenURI
    ) external onlyFulfillmentOperator validOrder(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Confirmed || order.status == OrderStatus.InProduction, "Order not ready for fulfillment");
        require(order.mintedTokenId == 0, "Order already fulfilled");

        // Mint the etched NFT certificate
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        
        _safeMint(order.customer, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        // Update order
        order.mintedTokenId = newTokenId;
        order.status = OrderStatus.Delivered;
        order.updatedAt = block.timestamp;

        // Release escrow to platform
        if (!order.escrowReleased) {
            _releaseEscrow(orderId);
        }

        emit OrderFulfilled(orderId, newTokenId);
    }

    /**
     * @dev Cancel order and process refund
     */
    function cancelOrder(uint256 orderId) external validOrder(orderId) {
        Order storage order = orders[orderId];
        require(
            msg.sender == order.customer || fulfillmentOperators[msg.sender],
            "Not authorized to cancel order"
        );
        require(
            order.status == OrderStatus.Pending || order.status == OrderStatus.Confirmed,
            "Cannot cancel order in current status"
        );
        require(!order.escrowReleased, "Escrow already released");

        order.status = OrderStatus.Cancelled;
        order.updatedAt = block.timestamp;

        // Process refund
        _processRefund(orderId);

        emit OrderCancelled(orderId, order.amount);
    }

    /**
     * @dev Emergency refund for orders past timeout
     */
    function emergencyRefund(uint256 orderId) external validOrder(orderId) {
        Order storage order = orders[orderId];
        require(msg.sender == order.customer, "Only customer can request emergency refund");
        require(
            block.timestamp >= order.createdAt + ORDER_TIMEOUT,
            "Order not yet eligible for emergency refund"
        );
        require(
            order.status != OrderStatus.Delivered && 
            order.status != OrderStatus.Cancelled && 
            order.status != OrderStatus.Refunded,
            "Order not eligible for refund"
        );
        require(!order.escrowReleased, "Escrow already released");

        order.status = OrderStatus.Cancelled;
        order.updatedAt = block.timestamp;

        _processRefund(orderId);

        emit OrderCancelled(orderId, order.amount);
    }

    /**
     * @dev Release escrow to platform (internal)
     */
    function _releaseEscrow(uint256 orderId) internal {
        Order storage order = orders[orderId];
        require(!order.escrowReleased, "Escrow already released");

        order.escrowReleased = true;

        // Calculate platform fee
        uint256 platformFee = (order.amount * platformFeePercentage) / 10000;
        uint256 remainingAmount = order.amount - platformFee;

        // Transfer platform fee
        if (platformFee > 0) {
            payable(platformFeeRecipient).transfer(platformFee);
        }

        // Transfer remaining amount to owner
        if (remainingAmount > 0) {
            payable(owner()).transfer(remainingAmount);
        }

        emit EscrowReleased(orderId, order.amount);
    }

    /**
     * @dev Process refund (internal)
     */
    function _processRefund(uint256 orderId) internal {
        Order storage order = orders[orderId];
        require(!order.escrowReleased, "Cannot refund released escrow");

        order.status = OrderStatus.Refunded;
        order.escrowReleased = true; // Mark as processed

        // Refund to customer
        payable(order.customer).transfer(order.amount);

        emit RefundProcessed(orderId, order.customer, order.amount);
    }

    /**
     * @dev Get order details
     */
    function getOrder(uint256 orderId) external view validOrder(orderId) returns (Order memory) {
        return orders[orderId];
    }

    /**
     * @dev Get order ID by external order ID
     */
    function getOrderByExternalId(string memory externalOrderId) external view returns (Order memory) {
        uint256 orderId = externalOrderToInternal[externalOrderId];
        require(orderId > 0, "Order not found");
        return orders[orderId];
    }

    /**
     * @dev Get customer orders
     */
    function getCustomerOrders(address customer) external view returns (uint256[] memory) {
        return customerOrders[customer];
    }

    /**
     * @dev Get current order count
     */
    function getTotalOrders() external view returns (uint256) {
        return _orderIdCounter.current();
    }

    /**
     * @dev Get current token count
     */
    function getTotalTokens() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Override required by Solidity
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Override required by Solidity
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}