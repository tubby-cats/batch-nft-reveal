const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getContract, deployMockContract } = require('../scripts/utils')

const MAX_MINT = 100;

async function mint(tubbies, amount){
  const txs = []
  for(let i = 0; i<amount; i+=MAX_MINT){
    txs.push(
      tubbies.mint(MAX_MINT)
    )
  }
  await Promise.all(txs);
}

async function setupForSale(){
  // Can't impersonate mainnet contracts because of a weird issue with sending txs
  const mockLink = await deployMockContract("MockLinkToken")
  const mockCoordinator = await deployMockContract("MockChainlinkCoordinator")
  const {tubbies} = await getContract({
    linkToken:mockLink.address,
    linkCoordinator: mockCoordinator.address
  })
  await mockLink.transfer(tubbies.address, ethers.utils.parseEther("2000"))
  return {mockCoordinator, mockLink, tubbies}
}

async function revealBatch(tubbies, mockCoordinator, i, randomvalue){
  await tubbies.requestRandomSeed(ethers.utils.parseEther("0.5"))
  const requestId = "0x5ca28f7c92f8adc821003b5d761ae77281bb1525e382c7605d9b081262b2d534"; // random bytes32
  await mockCoordinator.sendRandom(tubbies.address, requestId, randomvalue)
}

describe("Shuffling", function () {
  /*
    Needs the following changes in BatchReveal.sol or it'll take forever
    TOKEN_LIMIT = 200;
    REVEAL_BATCH_SIZE = 10;
  */
  it("no id is repeated and tokenURIs stay constant", async function () {
    this.timeout(1000000);
    const {mockCoordinator, tubbies} = await setupForSale()

    const TOKEN_LIMIT = await tubbies.TOKEN_LIMIT()
    const REVEAL_BATCH_SIZE = await tubbies.REVEAL_BATCH_SIZE()
    const BATCHES = TOKEN_LIMIT/REVEAL_BATCH_SIZE
    await mint(tubbies, TOKEN_LIMIT);
    const ids = {}
    for(let batch=0; batch<BATCHES; batch++){
      const random =  Math.round(Math.random()*40e3)
      await revealBatch(tubbies, mockCoordinator, batch, random)
      await Promise.all(Array.from(Array((batch+1)*REVEAL_BATCH_SIZE).keys()).map(async i=>{
        const newId = await tubbies.tokenURI(i)
        if(ids[newId] === undefined){
          // new id
          ids[newId] = i
          return
        }
        if(ids[newId] !== i){
          throw new Error(`${i} -> ${newId} repeated`)
        }
      }))
      //console.log(batch, ids, random)
    }
  })

  it("max mint", async function () {
    this.timeout(100000);
    const {mockCoordinator, tubbies} = await setupForSale()
    const TOKEN_LIMIT = (await tubbies.TOKEN_LIMIT()).toNumber()

    await mint(tubbies, 1.5e3);
    expect(await tubbies.totalSupply()).to.equal(1500);

    await mint(tubbies, TOKEN_LIMIT-1.5e3);
    await expect(
      tubbies.mint(1)
    ).to.be.revertedWith("limit reached");
    expect(await tubbies.totalSupply()).to.equal(TOKEN_LIMIT);

    expect(await tubbies.tokenURI(0)).to.equal("b");
    expect(await tubbies.tokenURI(TOKEN_LIMIT-1)).to.equal("b");
    const snapshot = await network.provider.send("evm_snapshot")
    for(let i=0; i<20; i++){
      await revealBatch(tubbies, mockCoordinator, i, 46)
    }
    expect(await tubbies.tokenURI(TOKEN_LIMIT-1)).to.equal("45");
    expect(await tubbies.tokenURI(0)).to.equal("46");
    for(let i=0; i<TOKEN_LIMIT; i+=500){
      expect(await tubbies.tokenURI(i)).to.equal((i+46).toString());
    }
  });

  // Needs lower TOKEN_LIMIT and REVEAL_BATCH_SIZE, only thing that matters is BATCHES
  // I use REVEAL_BATCH_SIZE=2, 
  it("when gas cost is maximized it's still low enough", async function () {
    this.timeout(100000);
    const {mockCoordinator, tubbies} = await setupForSale()

    const TOKEN_LIMIT = await tubbies.TOKEN_LIMIT()
    const REVEAL_BATCH_SIZE = await tubbies.REVEAL_BATCH_SIZE()
    expect(REVEAL_BATCH_SIZE.toNumber()).to.be.greaterThan(1); // Needs to be greater than 1 to force overflow and increase ranges[] length to maximum
    const BATCHES = TOKEN_LIMIT/REVEAL_BATCH_SIZE
    await tubbies.mint(TOKEN_LIMIT);
    for(let i=0; i<BATCHES; i++){
      const lastId = (TOKEN_LIMIT-(i*REVEAL_BATCH_SIZE))-1
      await revealBatch(tubbies, mockCoordinator, i, lastId);
    }
    expect(await tubbies.tokenURI(TOKEN_LIMIT-1)).to.equal((Math.floor(TOKEN_LIMIT/2)-1).toString());
  });
});