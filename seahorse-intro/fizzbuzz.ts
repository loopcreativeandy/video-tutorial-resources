import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { PublicKey } from "@solana/web3.js";
import { Fizzbuzz } from "../target/types/fizzbuzz";

export function loadWalletKey(keypairFile:string): anchor.web3.Keypair {
  if (!keypairFile || keypairFile == '') {
    throw new Error('Keypair is required!');
  }
  const fs = require("fs");
  const loaded = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
  );
  return loaded;
}

describe("fizzbuzz", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Fizzbuzz as Program<Fizzbuzz>;

  const myKey = loadWalletKey("AndroJQPNWphELAbvnj76c9zRpPP6dFjo94pQYwVuSr5.json")

  const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("fizzbuzz"));
  const seed2 = Buffer.from(myKey.publicKey.toBytes())
  const [fizzBuzzPDA, _bump] = findProgramAddressSync([seed1, seed2], program.programId);

  it("Is fizzbuzzing!", async () => {
    // Add your test here.
    // const tx = await program.methods.init().accounts({
    //   owner: myKey.publicKey,
    //   fizzbuzz: fizzBuzzPDA,
    //   systemProgram: anchor.web3.SystemProgram.programId
    // }).rpc();
    const tx = await program.methods.doFizzbuzz(new anchor.BN(15))
    .accounts({
      fizzbuzz: fizzBuzzPDA,
      owner: myKey.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).rpc();
    console.log("Your transaction signature", tx);
  });
});
