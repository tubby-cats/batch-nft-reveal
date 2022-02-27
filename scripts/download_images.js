const { exec } = require('child_process');

async function getId(tubbies, id) {
    for (let i = 0; i < 30; i++) {
        try {
            const newId = await tubbies.tokenURI(id)
            return newId
        } catch (e) { }
    }
    throw new Error(`Can't get id ${id}`)
}

const STEP = 20

async function main() {
    for (let i = 1320; i < 20e3; i += STEP) {
        const queries = []
        for (let j = i; j < (i + STEP); j++) {
            const p = new Promise((res, fail) => exec(`wget "https://d27ymaaul2hhgu.cloudfront.net/${j}.png"`, c => {
                if (c === null) {
                    res()
                } else {
                    fail(c)
                }
            }));
            queries.push(p)
        }
        await Promise.all(queries);
        console.log(i)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
