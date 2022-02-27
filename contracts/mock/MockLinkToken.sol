//SPDX-License-Identifier: CC0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockLinkToken is ERC20 {
  constructor() ERC20("a", "b") {
    _mint(msg.sender, 1e30);
  }

  function transferAndCall(address to, uint256 value, bytes calldata) external returns (bool success) {
    return transfer(to, value);
  }
}