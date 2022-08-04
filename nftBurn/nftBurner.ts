// as seen in https://www.youtube.com/watch?v=Nu1RABhTPtM


//import { Metaplex } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, PublicKey, Keypair, Transaction } from "@solana/web3.js";

import * as fs from 'fs';
import * as mpl from "@metaplex-foundation/mpl-token-metadata";
import * as splToken from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';


const connection = new Connection(clusterApiUrl("mainnet-beta"));
const KEYPAIR_FILE = "TODO.json";
const TOKEN_ADDRESS = "TODO";
const COLLECTION_MINT = "TODO";

export function loadWalletKey(keypairFile:string): Keypair {
    if (!keypairFile || keypairFile == '') {
      throw new Error('Keypair is required!');
    }
    const loaded = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
    );
    return loaded;
  }

async function burnThatNFT() {

    const keypair = loadWalletKey(KEYPAIR_FILE);

    const mint = new PublicKey(TOKEN_ADDRESS);
    const collectionMint = new PublicKey(COLLECTION_MINT);

    const ta = await splToken.getAssociatedTokenAddress(mint, keypair.publicKey );

    const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
    const seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());
    const seed3 = Buffer.from(mint.toBytes());
    const seed4 = Buffer.from(anchor.utils.bytes.utf8.encode("edition"));
    const [metadataPDA, _bump] = PublicKey.findProgramAddressSync([seed1, seed2, seed3], mpl.PROGRAM_ID);
    const [masterEditionPDA, _bump2] = PublicKey.findProgramAddressSync([seed1, seed2, seed3, seed4], mpl.PROGRAM_ID);
    
    const [collectionMetadataPDA, _bump3] = PublicKey.findProgramAddressSync([seed1, seed2, Buffer.from(collectionMint.toBytes())], mpl.PROGRAM_ID);
    
    console.log("owner: "+keypair.publicKey.toBase58());
    console.log("mint: "+mint.toBase58());
    console.log("token account: "+ta.toBase58());
    console.log("metadata account: "+metadataPDA.toBase58());
    console.log("edition account: "+masterEditionPDA.toBase58());

    const brnAccounts = {
        metadata: metadataPDA,
        owner: keypair.publicKey,
        mint: mint,
        tokenAccount: ta,
        masterEditionAccount: masterEditionPDA,
        splTokenProgram: splToken.TOKEN_PROGRAM_ID,
        collectionMetadata: collectionMetadataPDA
    };

    const unverifyCollectionAccounts : mpl.UnverifyCollectionInstructionAccounts = 
    {
        collection: collectionMetadataPDA,
        collectionAuthority: keypair.publicKey,
        collectionMasterEditionAccount: masterEditionPDA,
        collectionMint: collectionMint,
        metadata: metadataPDA
    }
    const unvInstr = mpl.createUnverifyCollectionInstruction(unverifyCollectionAccounts, mpl.PROGRAM_ID)

    
    const binstr = mpl.createBurnNftInstruction(brnAccounts, new PublicKey(mpl.PROGRAM_ADDRESS));

    const transaction = new Transaction().add(binstr);
    const txid = await connection.sendTransaction(transaction, [keypair]);
    console.log(txid);

}
burnThatNFT();
