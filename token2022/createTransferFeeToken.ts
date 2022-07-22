// as seen in https://www.youtube.com/watch?v=lrmN28DjejI

import * as web3 from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";

import * as fs from 'fs';

import {
  ExtensionType,
  createInitializeMintInstruction,
  getTransferFeeAmount,
  getTransferFeeConfig,
  mintTo,
  transferChecked,
  createAccount,
  getAccount,
  getMint,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  createInitializeTransferFeeConfigInstruction,
} from './tokenprogram'; // this is the src folder form spl/token/js

import { sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';


const rpcHost = "https://devnet.genesysgo.net/";
const connection = new anchor.web3.Connection(rpcHost);
const myKeypairFile = "ATHouoHfq8d6kFRvNB8EJer8iyGcjfEACLmKkSti68DZ.json";
const tokenKeypairFile = "tfTSDmkeWVSnQt4VZDrxXLgReyJd7atuv9GsCf6mjvE.json";
const tokenAccountKeyfile = "TA5bRDMQEZrbowpBfTrcDkpqsfPiawZXUiXF4e2RULU.json";
const destinationAccountKeyfile = "DSTUey3eux32AT7vLxLe3CUbvy5zs28kTzk4aDGCoz8H.json";
const signer = loadWalletKey(myKeypairFile);
const tokenKey = loadWalletKey(tokenKeypairFile);
const tokenAcckountKey = loadWalletKey(tokenAccountKeyfile);
const destinationAccountKey = loadWalletKey(destinationAccountKeyfile);

export function loadWalletKey(keypairFile:string): web3.Keypair {
  if (!keypairFile || keypairFile == '') {
    throw new Error('Keypair is required!');
  }
  const loaded = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
  );
  return loaded;
}

const MINT_EXTENSIONS = [ExtensionType.TransferFeeConfig];

const mint = tokenKey.publicKey;

async function createTFToken(){
    const mintLen = getMintLen(MINT_EXTENSIONS);
    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen);
    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: signer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(
            mint,
            signer.publicKey,
            signer.publicKey,
            100,
            BigInt(1000000000),
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(mint, 9, signer.publicKey, null, TOKEN_2022_PROGRAM_ID)
    );
    const txid = await sendAndConfirmTransaction(connection, mintTransaction, [signer, tokenKey], undefined);
    console.log(txid);
}

async function mintSome(){
  const firstRun = false;
  if(firstRun){
    const sourceAccount = await createAccount(
        connection,
        signer,
        mint,
        signer.publicKey,
        tokenAcckountKey,
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
  }
console.log(tokenAcckountKey.publicKey);
await mintTo(
    connection,
    signer,
    mint,
    tokenAcckountKey.publicKey,
    signer.publicKey,
    42000000000,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
);
}

async function sendTokensWithTransferFee() {
  
  const firstRun = false;
  if(firstRun){
      const destinationAccount = await createAccount(
        connection,
        signer,
        mint,
        signer.publicKey,
        destinationAccountKey,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
    }
    
    const txid = await transferChecked(
      connection,
      signer,
      tokenAcckountKey.publicKey,
      mint,
      destinationAccountKey.publicKey,
      signer,
      1000000000,
      9,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log(txid)
}

async function printAmount(tokenAccount:web3.PublicKey) {
    const taInfo = await connection.getAccountInfo(tokenAccount);
    const amount = taInfo?.data.readBigInt64LE(2*32);
    console.log(tokenAccount.toBase58()+ " holds "+amount);
}

async function main() {
    //console.log("let's create a transfer fee enabled token ;D");
    //createTFToken();

    // console.log("let's mint some!");
    // await mintSome();

    // console.log("SEND IT!");
    // await sendTokensWithTransferFee();

    printAmount(tokenAcckountKey.publicKey);
    printAmount(destinationAccountKey.publicKey);

}

main();
