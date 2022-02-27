//SPDX-License-Identifier: CC0
pragma solidity ^0.8.0;

/*
  See ../../randomness.md
*/
abstract contract BatchReveal {
    uint constant public TOKEN_LIMIT = 10e3;
    uint constant public REVEAL_BATCH_SIZE = 1e3;
    mapping(uint => uint) public batchToSeed;
    uint public lastTokenRevealed = 0;

    struct Range{
        int128 start;
        int128 end;
    }

    // Forked from openzeppelin
    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(int128 a, int128 b) internal pure returns (int128) {
        return a < b ? a : b;
    }

    uint constant RANGE_LENGTH = (TOKEN_LIMIT/REVEAL_BATCH_SIZE)*2;
    int128 constant intTOKEN_LIMIT = int128(int(TOKEN_LIMIT));

    // ranges include the start but not the end [start, end)
    function addRange(Range[RANGE_LENGTH] memory ranges, int128 start, int128 end, uint lastIndex) pure private returns (uint) {
        uint positionToAssume = lastIndex;
        for(uint j=0; j<lastIndex; j++){
            int128 rangeStart = ranges[j].start;
            int128 rangeEnd = ranges[j].end;
            if(start < rangeStart && positionToAssume == lastIndex){
                positionToAssume = j;
            }
            if(
                (start < rangeStart && end > rangeStart) ||
                (rangeStart <= start &&  end <= rangeEnd) ||
                (start < rangeEnd && end > rangeEnd)
            ){
                int128 length = end-start;
                start = min(start, rangeStart);
                end = start + length + (rangeEnd-rangeStart);
                ranges[j] = Range(-1,-1); // Delete
            }
        }
        for(uint pos = lastIndex; pos > positionToAssume; pos--){
            ranges[pos] = ranges[pos-1];
        }
        ranges[positionToAssume] = Range(start, min(end, intTOKEN_LIMIT));
        lastIndex++;
        if(end > intTOKEN_LIMIT){
            addRange(ranges, 0, end - intTOKEN_LIMIT, lastIndex);
            lastIndex++;
        }
        return lastIndex;
    }

    function buildJumps(uint lastBatch) view private returns (Range[RANGE_LENGTH] memory) {
        Range[RANGE_LENGTH] memory ranges;
        uint lastIndex = 0;
        for(uint i=0; i<lastBatch; i++){
            int128 start = int128(int(getFreeTokenId(batchToSeed[i], ranges)));
            int128 end = start + int128(int(REVEAL_BATCH_SIZE));
            lastIndex = addRange(ranges, start, end, lastIndex);
        }
        return ranges;
    }

    function getShuffledTokenId(uint startId) view internal returns (uint) {
        uint batch = startId/REVEAL_BATCH_SIZE;
        Range[RANGE_LENGTH] memory ranges = buildJumps(batch);
        uint positionsToMove = (startId % REVEAL_BATCH_SIZE) + batchToSeed[batch];
        return getFreeTokenId(positionsToMove, ranges);
    }

    function getFreeTokenId(uint positionsToMoveStart, Range[RANGE_LENGTH] memory ranges) pure private returns (uint) {
        int128 positionsToMove = int128(int(positionsToMoveStart));
        int128 id = 0;

        for(uint round = 0; round<2; round++){
            for(uint i=0; i<RANGE_LENGTH; i++){
                int128 start = ranges[i].start;
                int128 end = ranges[i].end;
                if(id < start){
                    int128 finalId = id + positionsToMove;
                    if(finalId < start){
                        return uint(uint128(finalId));
                    } else {
                        positionsToMove -= start - id;
                        id = end;
                    }
                } else if(id < end){
                    id = end;
                }
            }
            if((id + positionsToMove) >= intTOKEN_LIMIT){
                positionsToMove -= intTOKEN_LIMIT - id;
                id = 0;
            }
        }
        return uint(uint128(id + positionsToMove));
    }

    function setBatchSeed(uint randomness) internal {
        uint batchNumber;
        unchecked {
            batchNumber = lastTokenRevealed/REVEAL_BATCH_SIZE;
            lastTokenRevealed += REVEAL_BATCH_SIZE;
        }
        // not perfectly random since the folding doesn't match bounds perfectly, but difference is small
        batchToSeed[batchNumber] = randomness % (TOKEN_LIMIT - (batchNumber*REVEAL_BATCH_SIZE));
    }
}