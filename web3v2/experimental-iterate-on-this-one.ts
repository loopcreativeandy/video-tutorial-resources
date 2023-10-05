import "@solana/webcrypto-ed25519-polyfill";
import { pipe } from "@solana/functional";
import { LamportsUnsafeBeyond2Pow53Minus1, lamports } from "@solana/rpc-core";
import {
  AccountRole,
  Base58EncodedAddress,
  address,
  appendTransactionInstruction,
  createDefaultRpcTransport,
  createSolanaRpc,
  createTransaction,
  generateKeyPair,
  getAddressFromPublicKey,
  getBase64EncodedWireTransaction,
  signTransaction,
  setTransactionFeePayer,
  setTransactionLifetimeUsingBlockhash,
} from "@solana/web3.js";

function getTransferInstruction(
  from: Base58EncodedAddress,
  to: Base58EncodedAddress,
  lamports: LamportsUnsafeBeyond2Pow53Minus1
) {
  const data = Buffer.alloc(12);
  data.writeUint32LE(2);
  data.writeBigInt64LE(lamports, 4);
  return {
    accounts: [
      { address: from, role: AccountRole.WRITABLE_SIGNER },
      { address: to, role: AccountRole.WRITABLE },
    ],
    data: data,
    programAddress: "11111111111111111111111111111111" as Base58EncodedAddress,
  };
}

(async () => {
  // Configure an RPC.
  const rpc = createSolanaRpc({
    transport: createDefaultRpcTransport({
      url: "...",
    }),
  });

  // Generate a keypair for the account from which to send funds.
  console.log("Generating key pair");
  const kp = await generateKeyPair();

  // Get the address associated with that new account.
  const publicKey = await getAddressFromPublicKey(kp.publicKey);
  console.log("Generated key pair with public key address", publicKey);

  // Fund the source account.
  console.log("Airdropping 100000000 lamports to", publicKey);
  await rpc.requestAirdrop(publicKey, lamports(100000000n)).send();
  console.log("Waiting 30s for airdrop to land...");
  await new Promise((_) => setTimeout(_, 30000)); // TODO: Transaction confirmation in the modern library!

  // Assemble the values we'll need in the transaction.
  const myAddress = address("DTnUKgY1dq447iaehoCVpoBEe6S98qspRTBbGm9ZxKZb");
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // Create a transaction.
  const tx = pipe(
    createTransaction({ version: 0 }),
    (tx) =>
      appendTransactionInstruction(
        getTransferInstruction(publicKey, myAddress, lamports(10000000n)),
        tx
      ),
    (tx) => setTransactionFeePayer(publicKey, tx),
    (tx) => setTransactionLifetimeUsingBlockhash(latestBlockhash, tx)
  );
  console.log("Created a transaction", tx);

  // Sign and send the transaction.
  console.log("Signing transaction...");
  const signedTX = await signTransaction([kp], tx);
  console.log("Sending transaction...");
  const encodedTX = getBase64EncodedWireTransaction(signedTX);
  const sx = await rpc
    .sendTransaction(encodedTX, { encoding: "base64" })
    .send();

  console.log("https://explorer.solana.com/tx/" + sx + "?cluster=devnet");
})();
