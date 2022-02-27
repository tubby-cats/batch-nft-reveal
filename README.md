# Batch NFT reveal

This repository contains a gas-efficient implementation of an on-chain shuffling algorithm used to reveal NFTs in batches. The main benefits of this over other NFT randomization methods are:
- Makes the loop between buying and seeing your tubby much lower, which improves experience
- Keeps attention up through the sale, as new tubbies keep being revealed, instead of just having a single peak of attention at start/reveal
- Reduces the need to have unrevealed NFTs up for sale, thus making it harder for people to get rarity sniped

For a survey of other ways to randomize NFTs, an analysis on them and an explanation of the algorithm used here, please read [randomness.md](./randomness.md).

## Usage
1. Copy [`contracts/BatchReveal.sol`](./contracts/BatchReveal.sol) into your project
2. Change `TOKEN_LIMIT` (maximum amount of tokens to be minted in your sale) and `REVEAL_BATCH_SIZE` (amount of tokens that to be revealed in each reveal)
3. Import `BatchReveal` into your contract, call `setBatchSeed(randomNumber)` to provide randomness for each batch, and modify `tokenURI(id)` to use `getShuffledTokenId(id)`

Please make sure that the following constraints are met:
- `REVEAL_BATCH_SIZE` can divide `TOKEN_LIMIT` (`TOKEN_LIMIT % REVEAL_BATCH_SIZE = 0`)
- Total amount of batches (calculated as `TOKEN_LIMIT / REVEAL_BATCH_SIZE`) should be equal or lower than 117, otherwise you might run into the gas limit

## Examples
There are two production ready examples in the [`contracts/examples`](./contracts/examples) folder:
- [`Chainlink.sol`](./contracts/examples/Chainlink.sol) uses chainlink's VRF as source of randomness.
- [`Blockhash.sol`](./contracts/examples/Blockhash.sol) uses block hashes as source of randomness.

Apart from those, here's the most basic example (not suitable for production):
```solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../BatchReveal.sol";

contract Example is ERC721, BatchReveal {
    using Strings for uint256;

    string public baseURI;
    string public unrevealedURI;

    constructor(string memory _baseURI, string memory _unrevealedURI)
        ERC721("Mock NFT", "MNFT")
    {
        unrevealedURI = _unrevealedURI;
        baseURI = _baseURI;
    }

    function provideRandomness(uint randomNumber) public {
        setBatchSeed(randomNumber);
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        if(id >= lastTokenRevealed){
            return unrevealedURI;
        } else {
            return string(abi.encodePacked(baseURI, getShuffledTokenId(id).toString()));
        }
    }
}
```

## License
All code has been licensed under CC0, just like tubby cats themselves.