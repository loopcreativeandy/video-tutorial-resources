use {
    solana_sdk::{
        derivation_path::{DerivationPath, DerivationPathError},
        hash::Hash,
        message::Message,
        pubkey::Pubkey,
        signature::{
            generate_seed_from_seed_phrase_and_passphrase, keypair_from_seed,
            keypair_from_seed_and_derivation_path, keypair_from_seed_phrase_and_passphrase,
            read_keypair, read_keypair_file, Keypair, NullSigner, Presigner, Signature, Signer,
        }
    }
};

// NOTE: be careful with putting your actual seed-phrase here (only do it when your device is 100% save)
// I recommend only using this for testing purposes with a seed phrase you don't actually use! 
const SEED: &str = "inside crime topple loyal crush nerve rough vote increase toy toss sand tissue motion hundred polar tired parrot apart gentle burger cactus vicious member";

fn get_pk(account: u32) -> Pubkey {
    let seed = generate_seed_from_seed_phrase_and_passphrase(SEED, "");
    let derivation_path = Some(DerivationPath::new_bip44(Some(account), Some(0)));
    keypair_from_seed_and_derivation_path(&seed, derivation_path).unwrap().pubkey()
}

fn main() {
    //let kp = Keypair::new();
    println!("Hello, seeds! ");

    let mut i = 0u32;
    loop {
        let pk = get_pk(i);
        if pk.to_string().to_lowercase().starts_with("an") {
            println!("{} for account {} ", pk, i);
        }
        if i%100==0 {
            println!("{} searched", i);
        }
        i+=1;
    }
}
