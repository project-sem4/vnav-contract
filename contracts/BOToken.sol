//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;


import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract BoToken is ERC20 {
    constructor() ERC20("BoToken", "BOT") {
        // Convert 1 billion tokens to the correct decimals (18)
        // 1,000,000,000 * 10^18
        uint256 totalSupply = 100_000_000_000 * 10**18;

        // Mint all tokens to the deployer
        _mint(msg.sender, totalSupply);
    }
}