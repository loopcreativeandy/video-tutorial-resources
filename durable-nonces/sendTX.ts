
import {Keypair, clusterApiUrl, Connection,Message, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction} from "@solana/web3.js";



async function main() {
    
    const fs = require("fs");
    const secret = JSON.parse(fs.readFileSync("BobUWvk5jEGw7LidCpBw3uPK6FptrGxMXndvW7Dv3stc.json").toString()) as number[]
    const secretKey = Uint8Array.from(secret)
    const bob = Keypair.fromSecretKey(secretKey)
    
    
    const connection = new Connection(clusterApiUrl("devnet"));


    const Base58 = require("base-58")

    // const RAW_TX = "4M8kCv9i4DYvKD3WxJAXcjH1McqZc5mYL4hj74DnhFDhCWrMyDusmcM5TqgaVPRn5wk2qiwtHogZdBBx1MRjoYP8Yo2zNDqprxzBxkQUuwFgRQSVdybRFbkXDBDnKBHnwkcUt2JPDFoGMicN1jbMwcStketTqHeCB1C88sjK4UvRyfL4iq9JshqFthP3UjomUoQkNHxucp4Zjgdr99X1FudmTSqGvUe3NNhZWGsDVVYU2S7i1jxc72n6YCSeC1VfJk118LhDAfL7JDLLSwU5bhPhovZywoe3myPJF";

    // const txbuffer = Base58.decode(RAW_TX)
    // // const tx = new Transaction(txbuffer);
    
    // const sx = await connection.sendRawTransaction(txbuffer);

    const MESSAGE = "BAQgT4Eq92MV8ppNiRRVwW8rJQZASxBwMNqaEepsQZUkMj9A3a3odo6CX1VAbYtifeGmrKJThKXp18QQW59ZTifzsvZXLpynP1NZmbwErqUpbbMG4eGKwopVSdW5oeMJEsx43FRTWXy9uyjeyhEL9fyZzdWMEwCtnj3Q5PyVwNyV5D67pfjE5LoANgqRuzXJ68ptKvR772DcKNxDvQhR9c98NDJvpkueAB9y6Uwo9CNDfaUgQJcgQbFuQYtaGz187bvKHmYWu2DP18T";
    const SIGNATURE = "25GaCLj3MLiu3FNLWpFpLgiJtWe7exGYvQpFrSVxGQLr13RJayBSDBwcJGyRXT9jRbDrovryppXb39enCRzaUGVg";

    const tx = Transaction.populate(Message.from(Base58.decode(MESSAGE)));
    tx.addSignature(tx.feePayer!, Base58.decode(SIGNATURE))

    tx.partialSign(bob);

    const sx = await connection.sendRawTransaction(tx.serialize());
    console.log(sx);
    


}

main();