// https://stackoverflow.com/questions/68935939/is-there-any-way-to-force-to-update-metadata-on-opensea
const axios = require('axios');
require('dotenv').config();

async function main(){
    for(let i=0; i<10e3; i+=2){
        try{
        await Promise.all([i, i+1].map(j=> axios.get(`https://api.opensea.io/api/v1/asset/0xCa7cA7BcC765F77339bE2d648BA53ce9c8a262bD/${j}/?force_update=true`, {
            headers: {
                "X-API-KEY": process.env["OPENSEA_API"]
            }
        })))
        }catch(e){
            i-=2;
        }
        console.log(i)
    }
}
main()