
import { AccountRole, address, appendTransactionMessageInstructions, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getAddressEncoder, getBase64EncodedWireTransaction, getProgramDerivedAddress, getSignatureFromTransaction, IInstruction, Instruction, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "gill"
import fs from "fs";
import {getTransferCheckedInstruction} from "@solana-program/token-2022"
import { SYSTEM_PROGRAM_ADDRESS } from "gill/programs";

(async () => {

    const captain = await createKeyPairSignerFromBytes(new Uint8Array(JSON.parse(fs.readFileSync("/home/andy/solana/hooks/keys/CptnNxRJp2adjccrLA3P1UvFVpPsZ3HRU9Uui7egGRDJ.json").toString()) as number[]));
    const rpc = createSolanaRpc("https://api.devnet.solana.com");

    const receiverATA = address("8sHBrRHnDZxPDK1DsM2TY8B7n1PXJqa49s3oMP4e3UVc")
    const senderATA = address("3hZkh7SHwhGfj59mQfzWYXoSeBCDchZUSUwVbUy9zeMo")
    const mint = address("G3XJEpKaMexkktXfN9EZvWgCsYib5wWJekE6URnVFPcH")
    const hookProgram = address("hoo9kSHtfFY6PLUoqEkHcZQJpTQvDYBi16GNXji8Z98")
    const [extra_account_metas] = await getProgramDerivedAddress({programAddress: hookProgram,
            seeds: ["extra-account-metas", getAddressEncoder().encode(mint)]
        })
   
    const vanillaTransferIX = getTransferCheckedInstruction({
            amount: 1_000_000_000,
            authority: captain,
            decimals: 9,
            destination: receiverATA,
            source: senderATA,
            mint: mint,
        })

    const [my_pda] = await getProgramDerivedAddress({programAddress: hookProgram,
        seeds: ["my_pda"]
    })

    console.log(my_pda);
    
    const extendedTransferIX : Instruction = {
        programAddress: vanillaTransferIX.programAddress,
        data: vanillaTransferIX.data,
        accounts: [
            ...vanillaTransferIX.accounts, 
            {address: extra_account_metas, role: AccountRole.READONLY},
            {address: hookProgram, role: AccountRole.READONLY},
            {address: my_pda, role: AccountRole.WRITABLE},
            {address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY}
        ]
    }

    
    const programIXs : Instruction[] = [
        extendedTransferIX
    ];
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
