

import {NonceAccount, NONCE_ACCOUNT_LENGTH, Keypair, clusterApiUrl, Connection, Message, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";




const fs = require("fs");
const secret = JSON.parse(fs.readFileSync("AndYQnWqys3AoHEsUFHrF21w2JjnybEzBGdo2mMn8req.json").toString()) as number[]
const secretKey = Uint8Array.from(secret)
const me = Keypair.fromSecretKey(secretKey)
const secretn = JSON.parse(fs.readFileSync("NonmnPM8vVUjb3zgezi7aC17KuKiJ3FowGEbq4mApe8.json").toString()) as number[]
const secretKeyn = Uint8Array.from(secretn)
const nonceKP = Keypair.fromSecretKey(secretKeyn)

const receiver = new PublicKey("Andys9wuoMdUeRiZLgRS5aJwYNFv4Ut6qQi8PNDTAPEM");

async function main() {



    const connection = new Connection(clusterApiUrl("devnet"));

    console.log(NONCE_ACCOUNT_LENGTH);

    // createNonceAccount(connection);
    // closeNonceAccount(connection);
    

    const nonceAccountInfo = await connection.getAccountInfo(nonceKP.publicKey);
    if(!nonceAccountInfo){
        console.log("ERROR: couldn't get nonce account info")
        return;
    }
    const nonceAccount = NonceAccount.fromAccountData(nonceAccountInfo.data);
    
    console.log(nonceAccount.nonce);

    
    const ix = SystemProgram.transfer({
        fromPubkey: me.publicKey,
        toPubkey: receiver,
        lamports: 0.1*LAMPORTS_PER_SOL,
    })

    const advanceIX = SystemProgram.nonceAdvance({
        authorizedPubkey: me.publicKey,
        noncePubkey: nonceKP.publicKey
    })

    const tx = new Transaction();
    tx.add(advanceIX);
    tx.add(ix);

    tx.recentBlockhash = nonceAccount.nonce;
    tx.feePayer = me.publicKey;
    tx.sign(me);

    // const sx = await connection.sendRawTransaction(tx.serialize())
    // console.log(sx)

    const Base58 = require("base-58")
    console.log(Base58.encode(tx.serialize()))


}

async function closeNonceAccount(connection: Connection) {

    const closeIX = SystemProgram.nonceWithdraw({
        authorizedPubkey: me.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(
            NONCE_ACCOUNT_LENGTH
        ),
        noncePubkey: nonceKP.publicKey,
        toPubkey: me.publicKey
    })
    const tx = new Transaction();
    tx.add(closeIX);

    const sx = await sendAndConfirmTransaction(connection, tx, [me]);
    console.log(sx);
}
async function createNonceAccount(connection: Connection) {
    
    let tx = new Transaction().add(
        // create nonce account
        SystemProgram.createAccount({
            fromPubkey: me.publicKey,
            newAccountPubkey: nonceKP.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(
                NONCE_ACCOUNT_LENGTH
            ),
            space: NONCE_ACCOUNT_LENGTH,
            programId: SystemProgram.programId,
        }),
        // init nonce account
        SystemProgram.nonceInitialize({
            noncePubkey: nonceKP.publicKey, // nonce account pubkey
            authorizedPubkey: me.publicKey, // nonce account authority (for advance and close)
        })

    );

    const sx = await sendAndConfirmTransaction(connection, tx, [me, nonceKP]);
    console.log(sx);
}
main();
