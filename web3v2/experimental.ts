import {AccountRole, Base58EncodedAddress, IAccountMeta, IInstruction, appendTransactionInstruction,createDefaultRpcTransport, createSolanaRpc,createTransaction } from "@solana/web3.js"
import {generateKeyPair, getAddressFromPublicKey , getBase64EncodedWireTransaction, signTransaction, setTransactionFeePayer, setTransactionLifetimeUsingBlockhash} from "@solana/web3.js"
import '@solana/webcrypto-ed25519-polyfill';

import {LamportsUnsafeBeyond2Pow53Minus1, assertIsLamports} from "@solana/rpc-core"


const crypto = require('crypto').webcrypto;

(async()=>{
    const myAddress = 'DTnUKgY1dq447iaehoCVpoBEe6S98qspRTBbGm9ZxKZb' as Base58EncodedAddress;
    
    const rpc = createSolanaRpc({transport: createDefaultRpcTransport({ url: '...' })});

    const kp = await generateKeyPair();
    const publicKey = await getAddressFromPublicKey(kp.publicKey);
    console.log(publicKey)

    // const result = await rpc.getBalance(myAddress).send();
    // const balanceInLamports = result.value;
    // console.log('Balance of System Program account in Lamports: ', balanceInLamports);

    const reqLamports = BigInt("100000000") as LamportsUnsafeBeyond2Pow53Minus1
    assertIsLamports(reqLamports);
    await rpc.requestAirdrop(publicKey, reqLamports).send();

    const tx = createTransaction({version: 0});

    const data = Buffer.alloc(12);
    data.writeUint32LE(2);
    data.writeBigInt64LE(BigInt("10000000"),4)

    const ix: IInstruction = {
        programAddress: '11111111111111111111111111111111' as Base58EncodedAddress,
        accounts: [
            {
                address: publicKey, //await getAddressFromPublicKey(kp.publicKey),
                role: AccountRole.WRITABLE_SIGNER
            },
            {
                address: myAddress,
                role: AccountRole.WRITABLE
            },
        ],
        data: data
    }
    
    const txWithIx = appendTransactionInstruction(ix, tx);

    
    const bh = await rpc.getLatestBlockhash().send();
    console.log(bh);
    
    const txWithFP = setTransactionFeePayer(publicKey,txWithIx)
    const unsignedTX = setTransactionLifetimeUsingBlockhash(bh.value, txWithFP);
    const signedTX = await signTransaction(kp, unsignedTX);
    const encodedTX = getBase64EncodedWireTransaction(signedTX)

    console.log("waiting...")
    await new Promise(_ => setTimeout(_, 30000));
    console.log("lfg")

    const sx = await rpc.sendTransaction(encodedTX, {encoding: 'base64'}).send();
    console.log(sx);



})();
