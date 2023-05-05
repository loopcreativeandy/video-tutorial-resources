// git clone git@github.com:coral-xyz/xnft-quickstart.git
// and plug in this file as one of the Screens in App.tsx
/* <Tab.Screen
      name="Andys first xNFT"
      component={AndyScreen}
      options={{
        tabBarLabel: "Andy",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="key" color={color} size={size} />
        ),
      }}
    /> */

import { Text, FlatList } from "react-native";
import tw from "twrnc";

import { Screen } from "../components/Screen";
//import { useConnection, usePublicKey, usePublicKeys, useSolanaConnection } from "../hooks/xnft-hooks";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useSolanaConnection, usePublicKeys, Button } from "react-xnft";
import { useState } from "react";
import { Buffer } from 'buffer';

export function AndyScreen() {

  const [blockhash, setBlockhash] = useState("");
  const [signature, setSignature] = useState("");

  const receiver = new PublicKey("AndyaySnmjXM9hxht24vytt3SJdsW6ZfXL5NEgbTMfEU");

  const pks = usePublicKeys() as unknown as {solana: string};
  let pksString: string = "No pubkeys available!"
  const pk = pks ? new PublicKey(pks?.solana) : undefined;
  if(pk){
      pksString = pk.toBase58();
  }
  
  const connection = useSolanaConnection();

  const onButtonClick = async () => {
    
    const bh = (await connection.getLatestBlockhash()).blockhash;
    setBlockhash(bh);

    if(!pk){
      console.log("NO PUBKEY!");
      return;
    }
    
    // const ix = SystemProgram.transfer({
    //   fromPubkey: pk,
    //   toPubkey: receiver,
    //   lamports: 1000000
    // });
    const data = Buffer.alloc(4+8);
    data.writeUInt32LE(2,0); // transfer instruction descriminator
    data.writeUInt32LE(1000000,4); // lamports
    data.writeUInt32LE(0,8); // lamports (upper part, because can't write u64)
    const ix = new TransactionInstruction({
      keys: [
        {
            pubkey: pk,
            isSigner: true,
            isWritable: true
        },
        {
            pubkey: receiver,
            isSigner: false,
            isWritable: true
        },
        {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false
        },
      ],
      programId: SystemProgram.programId,
      data: data
  });
    const tx = new Transaction();
    tx.add(ix);

    const sx = await window.xnft.solana.send(tx);
    console.log("signature: "+ sx);
    setSignature(sx);
  }

  return (
    <Screen>
      <Text style={tw`mb-4`}>
        This is my first xNFT!
      </Text>
      
      <Text style={tw`mb-4`}>
        Your pubkey: {pksString} 
      </Text>
      <Text style={tw`mb-4`}>
        Recent Blockhash: {blockhash} 
      </Text>
      <Text style={tw`mb-4`}>
        Signature: {signature} 
      </Text>
      <Button onClick={onButtonClick}>
        Click me!
      </Button>
    </Screen>
  );
}
