
import {Keypair, clusterApiUrl, Connection,Message, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction} from "@solana/web3.js";



async function main() {
    
    const connection = new Connection(clusterApiUrl("devnet"));


    const Base58 = require("base-58")

    const RAW_TX = "6qtLGhCvBswa29gYpT7gPbUruB8ibE97YhmNbuNgkTsmAFZAMS3NzCvLKEB3FaNa69mA4Ws3WxJdXFE8FXmUMb2ocUQMA4pJEPiy2i1koc2vf8MMS2Ndx2CFpN6T5uyfdV28rmayHqe2CM3UrcqXkQFjdjtFPHxTbo7gPKirHDngHxJoyVajz7JY6qXi8SUYNYVmVQy3wWEHK5r4iR7eH959mXiF2hBRUAcTbWgMW2v1rmxZYmDsB9aKJ6CRsjzhg6kQdiJ6QpNutncxft6qCRoYiusX425MDuri8GR4RKifDmcmwMcpHqu9wAFLF4oXtBPGMhKWiBhVBzbRF4gn5ipUVN3ffPhGvZhyfMWE94uJVSDfaNfvzwcZPtyfoQ4pj4GkhYfKV1";

    const txbuffer = Base58.decode(RAW_TX)
    // const tx = new Transaction(txbuffer);
    
    const sx = await connection.sendRawTransaction(txbuffer);
    console.log(sx)



}

main();