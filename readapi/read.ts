import { Keypair } from "@solana/web3.js";
import { WrappedConnection } from "./wrappedConnection";

async function main() {

    // const assetId = "8qHNTDfZsEiDFQwAbGtCDaUSLGTYKduYoCjtnPbNwzzZ"
    const owner = "AUYF4W7K93JwD6Jex8YrhV5vbmch3Yb48gwHnPEdKBaU";

    const rpcUrl = "https://read-api.metaplex.com";
    const connectionString =
        "https://read-api.metaplex.com";
    // set up connection object
    // provides all connection functions and rpc functions
    const connectionWrapper = new WrappedConnection(
        Keypair.fromSeed(new TextEncoder().encode("hello world".padEnd(32, "\0"))),
        connectionString,
        rpcUrl
    );


    const sortBy = {"sortBy": "created", "sortDirection": "asc"};
    // console.log("payer", connectionWrapper.provider.wallet.publicKey.toBase58());
    const rpcAsset = await connectionWrapper.getAssetsByOwner(owner, sortBy, 100, 0, "", "");//getAsset(assetId);
    console.log(rpcAsset)
    // const fs = require("fs");
    // fs.writeFileSync('assets.txt', JSON.stringify(rpcAsset));
    let asset:any;
    for(asset of rpcAsset.items) {
        // console.log(asset);
        const isCompressed = asset.compression?.compressed;
        console.log(asset.id, isCompressed?" is compressed!": "");
    }
}

main();
