import { appendTransactionMessageInstructions, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getBase64EncodedWireTransaction, getSignatureFromTransaction, IInstruction, pipe, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit";

import fs from "fs";

(async () => {

    const payer = await createKeyPairSignerFromBytes(new Uint8Array(JSON.parse(fs.readFileSync("./keys/LHKAxrAp33czxTXtit2T7Vxz2MLWw41XGATosw4wPwG.json").toString()) as number[]));
    const rpc = createSolanaRpc("https://api.devnet.solana.com");
    const rpcSubscriptions = createSolanaRpcSubscriptions('ws://api.devnet.solana.com');

    
    const instructions : IInstruction[] = [
        
    ]

    const blockhash = (await rpc.getLatestBlockhash({commitment: "finalized"}).send()).value;
    const transactionMessage = pipe(
        createTransactionMessage({version: "legacy"}),
        txm => appendTransactionMessageInstructions(instructions, txm),
        txm => setTransactionMessageFeePayerSigner(payer, txm),
        txm => setTransactionMessageLifetimeUsingBlockhash(blockhash, txm)
    );

    const signedTx = await signTransactionMessageWithSigners(transactionMessage);

    const simulation = await rpc.simulateTransaction(getBase64EncodedWireTransaction(signedTx), {encoding: "base64"}).send();
    console.log(simulation);


    if (simulation.value.err) {
        return;
    }

    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({rpc, rpcSubscriptions});
    await sendAndConfirmTransaction(signedTx, {commitment: "confirmed"});
    const sx = getSignatureFromTransaction(signedTx);
    console.log(sx)
})();
