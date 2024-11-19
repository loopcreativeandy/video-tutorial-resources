import {address, appendTransactionMessageInstructions, createKeyPairFromBytes, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, generateKeyPairSigner, getBase64EncodedWireTransaction, getSignatureFromTransaction, getTransactionEncoder, lamports, pipe, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/web3.js";

import {getTransferSolInstruction, getCreateAccountInstruction, SYSTEM_PROGRAM_ADDRESS} from "@solana-program/system"
import {findAssociatedTokenPda, TOKEN_2022_PROGRAM_ADDRESS, getMintSize, getInitializeMint2Instruction, getCreateAssociatedTokenInstruction, getMintToCheckedInstruction} from "@solana-program/token-2022"

import fs from "fs";

(async () => {

    // const receiver = new PublicKey('AndyCdFAvYA2e7DVo7Hcbk2ZVR1iKPmRUdxTJbBhmXFX');
    const receiver = address("AndyCdFAvYA2e7DVo7Hcbk2ZVR1iKPmRUdxTJbBhmXFX");

    // const mint = new Keypair();
    const mint = await generateKeyPairSigner();

    const keypairBytes = JSON.parse(fs.readFileSync("../keys/KeykETTNzif4hHZ8dzqM3xNigyAQ4Z3XXyU9yBbM3y9.json").toString())
    // const signer = Keypair.fromSecretKey(new Uint8Array(keypairBytes as number[]));
    const signer = await createKeyPairSignerFromBytes(new Uint8Array(keypairBytes as number[]));

    // const connection = new Connection("http://localhost:8899");
    const rpc = createSolanaRpc("https://api.devnet.solana.com");
    const rpcSubscriptions = createSolanaRpcSubscriptions('ws://api.devnet.solana.com');

    // const transferIX = SystemProgram.transfer({
    //     fromPubkey: signer.publicKey,
    //     toPubkey: receiver,
    //     lamports: 0.01 * LAMPORTS_PER_SOL
    // });
    const sol = 0.01;
    const lmp = BigInt(sol*1_000_000_000);
    const transferIX = getTransferSolInstruction({source: signer, destination: receiver, amount: lamports(lmp)})
    
    // const ata = getAssociatedTokenAddressSync(mint.publicKey, signer.publicKey, true, TOKEN_2022_PROGRAM_ID)
    const [ata] = await findAssociatedTokenPda({mint: mint.address, owner: signer.address, tokenProgram: TOKEN_2022_PROGRAM_ADDRESS})
    
    // const createMintAccountIX = SystemProgram.createAccount({
    //     fromPubkey: signer.publicKey,
    //     newAccountPubkey: mint.publicKey,
    //     space: MINT_SIZE,
    //     lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
    //     programId: TOKEN_2022_PROGRAM_ID,
    // });
    const requiredSpace = getMintSize(undefined)
    const requiredRent = await rpc.getMinimumBalanceForRentExemption(BigInt(requiredSpace)).send(); 
    const createMintAccountIX = getCreateAccountInstruction({
        payer: signer,
        newAccount: mint,
        space: requiredSpace,
        lamports: requiredRent,
        programAddress: TOKEN_2022_PROGRAM_ADDRESS
    })
    // const createMintIX = createInitializeMint2Instruction(mint.publicKey, 9, signer.publicKey, null, TOKEN_2022_PROGRAM_ID);
    const createMintIX = getInitializeMint2Instruction(
        {
            mint: mint.address,
            decimals: 9,
            mintAuthority: signer.address
        }, {programAddress: TOKEN_2022_PROGRAM_ADDRESS}
    )
    // const createATAIX = createAssociatedTokenAccountInstruction(signer.publicKey, ata, signer.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID)
    const createATAIX = getCreateAssociatedTokenInstruction(
        {
            mint: mint.address,
            ata: ata,
            owner: signer.address,
            payer: signer,
            systemProgram: SYSTEM_PROGRAM_ADDRESS,
            tokenProgram: TOKEN_2022_PROGRAM_ADDRESS
        }
    )
    // const mintTokensIX = createMintToInstruction(mint.publicKey, ata, signer.publicKey, 1*10**9, undefined, TOKEN_2022_PROGRAM_ID);
    const mintTokensIX = getMintToCheckedInstruction(
        {
            mint: mint.address,
            mintAuthority: signer,
            amount: 1*10**9,
            decimals: 9,
            token: ata
        }
    )

    // const tx = new Transaction();
    // tx.add(transferIX, createMintAccountIX, createMintIX, createATAIX, mintTokensIX);
    // tx.feePayer = signer.publicKey;
    // tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const blockhash = (await rpc.getLatestBlockhash({commitment: "finalized"}).send()).value;
    const transactionMessage = pipe(
        createTransactionMessage({version: "legacy"}),
        txm => appendTransactionMessageInstructions([transferIX, createMintAccountIX, createMintIX, createATAIX, mintTokensIX], txm),
        txm => setTransactionMessageFeePayerSigner(signer, txm),
        txm => setTransactionMessageLifetimeUsingBlockhash(blockhash, txm)
    );

    // tx.sign(signer, mint);
    const signedTx = await signTransactionMessageWithSigners(transactionMessage);


    // const simulation = await connection.simulateTransaction(tx);
    // console.log(simulation);

    const simulation = await rpc.simulateTransaction(getBase64EncodedWireTransaction(signedTx), {encoding: "base64"}).send();
    console.log(simulation);


    if (simulation.value.err) {
        return;
    }

    // const sx = await sendAndConfirmTransaction(connection, tx, [signer, mint], {commitment: "confirmed"});
    // console.log(sx)
    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({rpc, rpcSubscriptions});
    await sendAndConfirmTransaction(signedTx, {commitment: "confirmed"});
    const sx = getSignatureFromTransaction(signedTx);
    console.log(sx)
})();
