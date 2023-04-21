import {createCreateTreeInstruction,PROGRAM_ID as BUBBLEGUM_PROGRAM_ID, createMintToCollectionV1Instruction, TokenProgramVersion} from "@metaplex-foundation/mpl-bubblegum";
import { loadWalletKey, sendVersionedTx } from "./utils";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, VersionedMessage } from "@solana/web3.js";
import { SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, SPL_NOOP_PROGRAM_ID, ValidDepthSizePair, getConcurrentMerkleTreeAccountSize } from "@solana/spl-account-compression";
import {
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  } from "@metaplex-foundation/mpl-token-metadata";

async function mintOneCNFT() {
    const keypair = loadWalletKey("CNFTKDRCpENe7S1hPvDS2E6YJr3fKKUbc3DWuyjF1mEW.json");
    const connection = new Connection("https://api.devnet.solana.com");
    const merkleTree = loadWalletKey("trezdkTFPKyj4gE9LAJYPpxn8AYVCvM7Mc4JkTb9X5B.json").publicKey;

    const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
        [merkleTree.toBuffer()],
        BUBBLEGUM_PROGRAM_ID,
      );
      
    const collectionMint = new PublicKey("CoLLES42WAZkkYA84xUG2Z7f2xMz4ATM32F4SYXnZKJ4")
    const [collectionMetadataAccount, _b1] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata", "utf8"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      const [collectionEditionAccount, _b2] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata", "utf8"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
          Buffer.from("edition", "utf8"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      const [bgumSigner, __] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection_cpi", "utf8")],
        BUBBLEGUM_PROGRAM_ID
      );
    const ix = await createMintToCollectionV1Instruction({
        treeAuthority: treeAuthority,
        leafOwner: keypair.publicKey,
        leafDelegate: keypair.publicKey,
        merkleTree: merkleTree,
        payer: keypair.publicKey,
        treeDelegate: keypair.publicKey,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        collectionAuthority: keypair.publicKey,
        collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
        collectionMint: collectionMint,
        collectionMetadata: collectionMetadataAccount,
        editionAccount: collectionEditionAccount,
        bubblegumSigner: bgumSigner,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    }, {
        metadataArgs: {
            collection: {key:collectionMint, verified: false},
            creators: [],
            isMutable: true,
            name: "Just a cNFT",
            primarySaleHappened: true,
            sellerFeeBasisPoints: 0,
            symbol: "cNFT",
            uri: "https://arweave.net/euAlBrhc3NQJ5Q-oJnP10vsQFjTV7E9CgHZcVm8cogo",
            uses: null,
            tokenStandard: null,
            editionNonce: null,
            tokenProgramVersion: TokenProgramVersion.Original
        }
    });
    
    const sx = await sendVersionedTx(connection, [ix], keypair.publicKey, [keypair])
    console.log(sx);
}

mintOneCNFT();