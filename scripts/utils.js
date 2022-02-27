const { ethers } = require("hardhat");

async function getContract({
    baseURI="",
    unrevealedURI="b",
    // mainnet params
    s_keyHash="0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445",
    linkToken="0x514910771AF9Ca656af840dff83E8264EcF986CA",
    linkCoordinator= "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952",
}
){
    const [signer] = await ethers.getSigners();
    const Tubbies = await hre.ethers.getContractFactory("ChainlinkExample");
    const tubbies = await Tubbies.deploy(baseURI, unrevealedURI, s_keyHash,linkToken, linkCoordinator);
    await tubbies.deployed();
    return {tubbies, signer}
}

async function deployMockContract(name){
    const Contract = await hre.ethers.getContractFactory(name);
    const contract = await Contract.deploy();
    await contract.deployed();
    return contract
}

module.exports={
    getContract,
    deployMockContract
}