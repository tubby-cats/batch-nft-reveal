const hre = require("hardhat");

async function getId(tubbies, id){
    for(let i=0; i<30; i++){
        try{
            const newId = await tubbies.tokenURI(id)
            return newId
        } catch(e){}
    }
    throw new Error(`Can't get id ${id}`)
}

const STEP = 500

async function main() {
    const Tubbies = await hre.ethers.getContractFactory("Tubbies");
    const tubbies = await Tubbies.attach("0xC9e0C043c86739Dbb43FDF5A6b263082571F0315")

    const ids = {}
    for (let i = 0; i < 20e3; i += STEP) {
        const queries = []
        for (let j = i; j < (i + STEP); j++) {
            queries.push(getId(tubbies, j).then(newId=>{
                if (ids[newId] === undefined) {
                    ids[newId] = true
                } else {
                    throw new Error(`${j}, ${newId} is repeated`)
                }
            }))
        }
        await Promise.all(queries);
        console.log(i, Object.keys(ids).length)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
