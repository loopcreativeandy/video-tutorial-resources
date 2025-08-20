
import { AccountRole, address, appendTransactionMessageInstructions, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getAddressEncoder, getBase64EncodedWireTransaction, getProgramDerivedAddress, getSignatureFromTransaction, IInstruction, Instruction, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "gill"
import fs from "fs";
import { TOKEN_2022_PROGRAM_ADDRESS, ExtensionArgs, getCreateAccountInstruction, getMintSize, getTokenSize, SYSTEM_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS } from "gill/programs";

(async () => {

    const captain = await createKeyPairSignerFromBytes(new Uint8Array(JSON.parse(fs.readFileSync("/home/andy/solana/hooks/keys/CptnNxRJp2adjccrLA3P1UvFVpPsZ3HRU9Uui7egGRDJ.json").toString()) as number[]));
    const rpc = createSolanaRpc("https://api.devnet.solana.com");

    
    const hookProgram = address("hoo9kSHtfFY6PLUoqEkHcZQJpTQvDYBi16GNXji8Z98")
    const mint = address("So11111111111111111111111111111111111111112")
    const [treasuryPDA] = await getProgramDerivedAddress({programAddress: hookProgram,
        seeds: ["my-treasury", getAddressEncoder().encode(mint)]
    })

    console.log(treasuryPDA);
    

    // const size = getTokenSize([]);
    // const rent = await rpc.getMinimumBalanceForRentExemption(BigInt(size)).send();
    // const programIXs : Instruction[] = [
    //     getCreateAccountInstruction({
    //         space: size,
    //         lamports: rent,
    //         newAccount: treasuryPDA,
    //         payer: captain,
    //         programAddress: TOKEN_2022_PROGRAM_ADDRESS
    //     }),
    // ];

    const programIXs : Instruction[]= [
        {
                programAddress: hookProgram,
                data: new Uint8Array([3]),
                accounts: [
                    {address: captain.address, role: AccountRole.WRITABLE_SIGNER},
                    {address: treasuryPDA, role: AccountRole.WRITABLE},
                    {address: mint, role: AccountRole.READONLY},
                    {address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY},
                    {address: TOKEN_PROGRAM_ADDRESS, role: AccountRole.READONLY},
        
                ]
            }
    ]
    const blockhash = (await rpc.getLatestBlockhash({commitment: "finalized"}).send()).value;
    const transactionMessage = pipe(
        createTransactionMessage({version: "legacy"}),
        txm => appendTransactionMessageInstructions(programIXs, txm),
        txm => setTransactionMessageFeePayerSigner(captain, txm),
        txm => setTransactionMessageLifetimeUsingBlockhash(blockhash, txm)
    );


    const signedTx = await signTransactionMessageWithSigners(transactionMessage);
    
    const simulation = await rpc.simulateTransaction(getBase64EncodedWireTransaction(signedTx), {encoding: "base64"}).send();
    console.log(simulation);


    await rpc.sendTransaction(getBase64EncodedWireTransaction(signedTx), {encoding: "base64", maxRetries: BigInt(0), skipPreflight: false} ).send();
    
    console.log(getSignatureFromTransaction(signedTx));

    
})();
