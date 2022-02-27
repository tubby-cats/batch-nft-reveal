const hre = require("hardhat");
const { NonceManager } = require("@ethersproject/experimental");

async function main() {
    const [oldSigner] = await ethers.getSigners();
    const signer = new NonceManager(oldSigner)
    const Tubbies = await hre.ethers.getContractFactory("Tubbies");
    const tubbies = await Tubbies.attach("0xC9e0C043c86739Dbb43FDF5A6b263082571F0315").connect(signer);

    const txs = []
    for (let i = 0; i < 10; i += 1) {
        txs.push(
            tubbies.requestRandomSeed(ethers.utils.parseEther("0.1"))
        )
    }
    await Promise.all(txs);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
