const hre = require("hardhat");
const { NonceManager } = require("@ethersproject/experimental");

const TO_MINT = 10e3;
const MAX_MINT = 5;
const MAX_MINT_PER_CYCLE = 150;

async function main() {
    const [oldSigner] = await ethers.getSigners();
    const signer = new NonceManager(oldSigner)
    const Tubbies = await hre.ethers.getContractFactory("Tubbies");
    const tubbies = await Tubbies.attach("0xC9e0C043c86739Dbb43FDF5A6b263082571F0315").connect(signer);

    for (let leftToMint = TO_MINT; leftToMint > 0; leftToMint -= MAX_MINT_PER_CYCLE) {
        const txs = []
        for (let i = 0; i < MAX_MINT_PER_CYCLE; i += MAX_MINT) {
            txs.push(
                tubbies.mintFromSale(MAX_MINT, { 
                    value: ethers.utils.parseEther("0.5"),
                    gasLimit: 100e3,
                })
            )
        }
        await Promise.all(txs);
        await tubbies.retrieveFunds(oldSigner.address,  {
            gasLimit: 100e3,
        })
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
