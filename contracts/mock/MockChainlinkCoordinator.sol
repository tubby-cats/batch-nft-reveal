//SPDX-License-Identifier: CC0
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract MockChainlinkCoordinator {
  function sendRandom(address _client, bytes32 requestId, uint256 _random) public {
    VRFConsumerBase(_client).rawFulfillRandomness(requestId, _random);
  }
}