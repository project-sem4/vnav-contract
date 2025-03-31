//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/security/ReentrancyGuard.sol";

/**
 * @title BO Contract
 * @dev Contract for depositing BoTokens and distributing rewards
 */
contract BOContract is Ownable, ReentrancyGuard {
    IERC20 public boToken;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event RewardDistributed(address indexed recipient, uint256 amount);
    event TokensWithdrawn(address indexed token, uint256 amount);

    /**
     * @dev Constructor sets the BoToken address
     * @param _boTokenAddress The address of the BoToken contract
     */
    constructor(address _boTokenAddress) {
        require(_boTokenAddress != address(0), "Invalid token address");
        boToken = IERC20(_boTokenAddress);
    }

    /**
     * @dev Allows users to deposit BoTokens into the contract
     * @param _amount Amount of tokens to deposit
     */
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");

        // Transfer tokens from user to contract
        bool success = boToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "Token transfer failed");

        emit Deposited(msg.sender, _amount);
    }

    /**
     * @dev Distributes rewards to a specific address
     * @param _recipient Address receiving the reward
     * @param _amount Amount of tokens to distribute
     * @notice Only callable by the owner
     */
    function distributeReward(address _recipient, uint256 _amount) external onlyOwner nonReentrant {
        require(_recipient != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be greater than 0");

        uint256 contractBalance = boToken.balanceOf(address(this));
        require(contractBalance >= _amount, "Insufficient contract balance");

        // Transfer tokens from contract to recipient
        bool success = boToken.transfer(_recipient, _amount);
        require(success, "Token transfer failed");

        emit RewardDistributed(_recipient, _amount);
    }

    /**
     * @dev Withdraws all tokens from the contract to the owner
     * @notice Only callable by the owner
     */
    function withdrawTokens() external onlyOwner nonReentrant {
        uint256 contractBalance = boToken.balanceOf(address(this));
        require(contractBalance > 0, "No tokens to withdraw");

        // Transfer all tokens to owner
        bool success = boToken.transfer(owner(), contractBalance);
        require(success, "Token transfer failed");

        emit TokensWithdrawn(address(boToken), contractBalance);
    }

    /**
     * @dev Returns the contract's token balance
     * @return The amount of BoTokens held by this contract
     */
    function getContractBalance() external view returns (uint256) {
        return boToken.balanceOf(address(this));
    }
}