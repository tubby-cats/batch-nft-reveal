//SPDX-License-Identifier: CC0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../BatchReveal.sol";

contract BlockhashExample is ERC721, BatchReveal {
    using Strings for uint256;

    string public baseURI;
    string public unrevealedURI;

    constructor(string memory _baseURI, string memory _unrevealedURI)
        ERC721("Mock NFT", "MNFT")
    {
        unrevealedURI = _unrevealedURI;
        baseURI = _baseURI;
    }

    uint public totalSupply = 0;
    function mint(uint amount) public {
        require((totalSupply + amount) <= TOKEN_LIMIT, "limit reached");
        for(uint i = 0; i<amount; i++){
            _mint(msg.sender, totalSupply);
            totalSupply++;
            if(totalSupply >= (lastTokenRevealed + REVEAL_BATCH_SIZE)){
                setBatchSeed(uint256(blockhash(block.number)));
            }
        }
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        if(id >= lastTokenRevealed){
            return unrevealedURI;
        } else {
            return string(abi.encodePacked(baseURI, getShuffledTokenId(id).toString()));
        }
    }
}
