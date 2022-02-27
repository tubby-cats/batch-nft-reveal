//SPDX-License-Identifier: CC0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../BatchReveal.sol";

contract ChainlinkExample is ERC721, VRFConsumerBase, BatchReveal {
    using Strings for uint256;

    string public baseURI;
    string public unrevealedURI;

    // Constants from https://docs.chain.link/docs/vrf-contracts/
    bytes32 immutable private s_keyHash;
    address immutable private linkToken;
    address immutable private linkCoordinator;

    constructor(string memory _baseURI, string memory _unrevealedURI, bytes32 _s_keyHash, address _linkToken, address _linkCoordinator)
        ERC721("Mock NFT", "MNFT")
        VRFConsumerBase(_linkCoordinator, _linkToken)
    {
        linkToken = _linkToken;
        linkCoordinator = _linkCoordinator;
        s_keyHash = _s_keyHash;
        unrevealedURI = _unrevealedURI;
        baseURI = _baseURI;
    }

    uint public totalSupply = 0;
    function mint(uint amount) public {
        require((totalSupply + amount) <= TOKEN_LIMIT, "limit reached");
        for(uint i = 0; i<amount; i++){
            _mint(msg.sender, totalSupply);
            totalSupply++;
        }
    }

    // batchNumber belongs to [0, TOKEN_LIMIT/REVEAL_BATCH_SIZE]
    // if fee is incorrect chainlink's coordinator will just revert the tx so it's good
    function requestRandomSeed(uint s_fee) public returns (bytes32 requestId) {
        require(totalSupply >= (lastTokenRevealed + REVEAL_BATCH_SIZE), "totalSupply too low");

        // checking LINK balance
        require(IERC20(linkToken).balanceOf(address(this)) >= s_fee, "Not enough LINK to pay fee");

        // requesting randomness
        requestId = requestRandomness(s_keyHash, s_fee);
    }

    function fulfillRandomness(bytes32, uint256 randomness) internal override {
        require(totalSupply >= (lastTokenRevealed + REVEAL_BATCH_SIZE), "totalSupply too low");
        setBatchSeed(randomness);
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        if(id >= lastTokenRevealed){
            return unrevealedURI;
        } else {
            return string(abi.encodePacked(baseURI, getShuffledTokenId(id).toString()));
        }
    }
}
