
import {Keypair, clusterApiUrl, Connection, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction} from "@solana/web3.js";



async function main() {
    
    //const me = new Keypair();
    const fs = require("fs");
    const secret = JSON.parse(fs.readFileSync("AndYQnWqys3AoHEsUFHrF21w2JjnybEzBGdo2mMn8req.json").toString()) as number[]
    const secretKey = Uint8Array.from(secret)
    const me = Keypair.fromSecretKey(secretKey)
    
    const connection = new Connection(clusterApiUrl("devnet"));

    const receiver = new PublicKey("Andys9wuoMdUeRiZLgRS5aJwYNFv4Ut6qQi8PNDTAPEM");

    
    const latest = await connection.getLatestBlockhash();

    console.log("latest blockhash at height "+latest.lastValidBlockHeight+ " "+ latest.blockhash);

    const ix = SystemProgram.transfer({
        fromPubkey: me.publicKey,
        toPubkey: receiver,
        lamports: 0.1*LAMPORTS_PER_SOL,
    })

    const tx = new Transaction();
    tx.add(ix);
    
    // tx.lastValidBlockHeight = latest.lastValidBlockHeight;
    tx.recentBlockhash = latest.blockhash;
    
    console.log(tx.recentBlockhash);

    const signers = [me];
    //const sx = await sendAndConfirmTransaction(connection, tx, signers);


    // await new Promise(_ => setTimeout(_, 1000))

    tx.sign(...signers);

    const sx = await connection.sendRawTransaction(tx.serialize());

    console.log(sx);
    


}

main();