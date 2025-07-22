use pinocchio::{
  account_info::AccountInfo,
  entrypoint,
  msg,
  ProgramResult,
  pubkey::Pubkey,
  program_error::ProgramError
};
use std::cell::Cell;

entrypoint!(process_instruction);

pub fn process_instruction(
  _program_id: &Pubkey,
  _accounts: &[AccountInfo],
  _instruction_data: &[u8],
) -> ProgramResult {

    let flag = Cell::new(0x00FF); 

    macro_rules! tricky {
        ($x:expr) => {
            {
                // Side effect that modifies `flag` to an unexpected value
                flag.set(flag.get() ^ -1); // toggles all bits: 0b1100 (12)
                let macro_return = $x & flag.get() == $x | flag.get();
                macro_return
            }
        };
    }

    msg!("the value of flag is {}", flag.get());


    if tricky!(0xFF00) {
        msg!("✅ You thought this was the right branch.");
        Ok(())
    } else {
        msg!("❌ But this is the one that actually runs.");
        Err(ProgramError::Custom(0xfa))
    }
}



#[cfg(test)]
mod test {
    
    pub fn process_instruction_adapter(
        program_id: &solana_sdk::pubkey::Pubkey,
        _accounts: &[solana_sdk::account_info::AccountInfo], 
        instruction_data: &[u8]) -> solana_sdk::entrypoint::ProgramResult
    {
        match process_instruction(&Pubkey::from(program_id.to_bytes()), &[], instruction_data) {
            Ok(()) => Ok(()),
            Err(_) => Err(solana_sdk::program_error::ProgramError::Custom(0xff))
        }
    }

    use {
        super::*,
        solana_program::instruction::{AccountMeta, Instruction},
        solana_program_test::*,
        solana_sdk::{signature::Signer, transaction::Transaction},
    };

    #[tokio::test]
    async fn test_transaction() {
        let program_id = solana_sdk::pubkey::Pubkey::new_unique();

        let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
            "bpf_program_template",
            program_id,
            processor!(process_instruction_adapter),
        )
        .start()
        .await;

        let mut transaction = Transaction::new_with_payer(
            &[Instruction {
                program_id,
                accounts: vec![AccountMeta::new(payer.pubkey(), false)],
                data: vec![1, 2, 3],
            }],
            Some(&payer.pubkey()),
        );
        transaction.sign(&[&payer], recent_blockhash);

        assert!(banks_client.process_transaction(transaction).await.is_ok());
    }
}
