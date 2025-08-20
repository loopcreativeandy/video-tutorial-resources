use std::cell::RefMut;

use anchor_lang::{
    prelude::*,
};
use anchor_spl::{
    associated_token::AssociatedToken, token::{spl_token::{self, native_mint}, Token}, token_2022::{spl_token_2022::{self, extension::{transfer_hook::TransferHookAccount, BaseStateWithExtensionsMut, PodStateWithExtensionsMut}, pod::PodAccount}, Token2022}, token_interface::{Mint, TokenAccount, TokenInterface}
};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;
use spl_discriminator::SplDiscriminate;
use spl_tlv_account_resolution::{account::ExtraAccountMeta, pubkey_data::PubkeyData, seeds::Seed, state::ExtraAccountMetaList};


declare_id!("hoo9kSHtfFY6PLUoqEkHcZQJpTQvDYBi16GNXji8Z98");


#[program]
pub mod transfer_hook {

    use anchor_lang::system_program::{create_account, transfer, CreateAccount, Transfer};
    use anchor_spl::token_2022::initialize_account3;
    
    use super::*;

    #[instruction(discriminator = ExecuteInstruction::SPL_DISCRIMINATOR_SLICE)]
    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {

        msg!("Transfer Hook called!");
        assert_is_transferring(&ctx)?;

        let fee = amount/100;
        msg!("taking {} as fee", fee);

        msg!("transfering fee to {}", ctx.accounts.treasury_pda.key());

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"delegate",
            &[ctx.bumps.delegate_pda],
        ]];
        anchor_spl::token_interface::transfer_checked(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), 
            anchor_spl::token_interface::TransferChecked {
                authority: ctx.accounts.delegate_pda.to_account_info(),
                from: ctx.accounts.source_wsol_ata.to_account_info(),
                to: ctx.accounts.treasury_pda.to_account_info(),
                mint: ctx.accounts.wsol_mint.to_account_info()
            }, signer_seeds), fee, ctx.accounts.mint.decimals)?;
        

        Ok(())
    }


    
    #[instruction(discriminator = [1])]
    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {

        let account_metas = get_extra_accounts()?;

        // calculate account size
        let account_size = ExtraAccountMetaList::size_of(account_metas.len())? as u64;
        // calculate minimum required lamports
        let lamports = Rent::get()?.minimum_balance(account_size as usize);

        let mint = ctx.accounts.mint.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"extra-account-metas",
            &mint.as_ref(),
            &[ctx.bumps.extra_account_meta_list],
        ]];

        // create ExtraAccountMetaList account
        create_account(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_account_meta_list.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            lamports,
            account_size,
            ctx.program_id,
        )?;

        // initialize ExtraAccountMetaList account with extra accounts
        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
            &account_metas,
        )?;

        Ok(())
    }


    
    #[instruction(discriminator = [2])]
    pub fn update_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {

        let account_metas = get_extra_accounts()?;

        // calculate account size
        let account_size = ExtraAccountMetaList::size_of(account_metas.len())? as u64;
        // calculate minimum required lamports
        let lamports = Rent::get()?.minimum_balance(account_size as usize);

        
        if lamports>ctx.accounts.extra_account_meta_list.lamports() {

            let lamport_diff = lamports-ctx.accounts.extra_account_meta_list.lamports();
            ctx.accounts.extra_account_meta_list.resize(account_size as usize)?;

            transfer(CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.extra_account_meta_list.to_account_info(),
                    },
                ), lamport_diff)?;
            
            msg!("transfered {} additional lamports", lamport_diff);
        }


        // update ExtraAccountMetaList account with extra accounts
        ExtraAccountMetaList::update::<ExecuteInstruction>(
            &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
            &account_metas,
        )?;
        msg!("updated extra account meta list");

        Ok(())
    }
    

    
    #[instruction(discriminator = [3])]
    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
    ) -> Result<()> {

        let account_size = 165; 
        // calculate minimum required lamports
        let lamports = Rent::get()?.minimum_balance(account_size as usize);

        let mint = ctx.accounts.mint.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"my-treasury",
            &mint.as_ref(),
            &[ctx.bumps.treasury_pda],
        ]];

        // create trearusy account
        create_account(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.treasury_pda.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            lamports,
            account_size,
            ctx.accounts.token_program.key,
        )?;

        msg!("treasury account created");
        

        initialize_account3(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), 
            anchor_spl::token_interface::InitializeAccount3 { 
                account: ctx.accounts.treasury_pda.to_account_info(), 
                mint: ctx.accounts.mint.to_account_info(), 
                authority: ctx.accounts.treasury_pda.to_account_info() 
            },
            signer_seeds))?;

            
        msg!("treasury account initialized as token account");


        Ok(())
    }
}


#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    payer: Signer<'info>,

    /// CHECK: ExtraAccountMetaList Account, must use these seeds
    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()], 
        bump
    )]
    pub extra_account_meta_list: AccountInfo<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    // pub token_program: Interface<'info, TokenInterface>,
    // pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    payer: Signer<'info>,

    /// CHECK: ExtraAccountMetaList Account, must use these seeds
    #[account(
        mut,
        seeds = [b"my-treasury", mint.key().as_ref()], 
        bump
    )]
    pub treasury_pda: AccountInfo<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}


#[derive(Accounts)]
pub struct TransferHook<'info> {
    #[account(
        token::mint = mint, 
        token::authority = transfer_authority,
    )]
    pub source_token: InterfaceAccount<'info, TokenAccount>, // index 0
    pub mint: InterfaceAccount<'info, Mint>, // index 1
    #[account(
        token::mint = mint,
    )]
    pub destination_token: InterfaceAccount<'info, TokenAccount>, // index 2
    /// CHECK: source token account owner, can be SystemAccount or PDA owned by another program
    pub transfer_authority: UncheckedAccount<'info>, // index 3
    /// CHECK: ExtraAccountMetaList Account,
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()], 
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>, // index 4
    
    pub wsol_mint: InterfaceAccount<'info, Mint>, 

    pub token_program: Program<'info, Token>,
    
    #[account(
        seeds = [b"my-treasury", wsol_mint.key().as_ref()], 
        bump
    )]
    pub treasury_pda: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(
        token::mint = wsol_mint, 
        token::authority = transfer_authority,
    )]
    pub source_wsol_ata: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: just used as pda signer
    #[account(
        seeds = [b"delegate"], 
        bump
    )]
    pub delegate_pda: UncheckedAccount<'info>,

}


fn get_extra_accounts() -> Result<Vec<ExtraAccountMeta>>{
    let wsol_mint = ExtraAccountMeta::new_with_pubkey(&native_mint::ID, false, false)?;
    let token_program = ExtraAccountMeta::new_with_pubkey(&spl_token::ID, false, false)?;
    let treasury_pda = ExtraAccountMeta::new_with_seeds(&[Seed::Literal{bytes:"my-treasury".as_bytes().to_vec()}, Seed::AccountKey { index: 5 }], false, true)?;
    let associated_token_program = ExtraAccountMeta::new_with_pubkey(&AssociatedToken::id(), false, false)?;
    let source_wsol_ata = ExtraAccountMeta::new_external_pda_with_seeds(8, &[Seed::AccountKey{index: 3}, Seed::AccountKey{index: 6}, Seed::AccountKey{index: 5}], false, true)?;
    let delegate = ExtraAccountMeta::new_with_seeds(&[Seed::Literal{bytes:"delegate".as_bytes().to_vec()}], false, false)?;
    
    let account_metas = vec![
        wsol_mint, // index 5
        token_program, // index 6
        treasury_pda, // index 7
        associated_token_program, // index 8
        source_wsol_ata,
        delegate
    ];
    Ok(account_metas)
}


fn assert_is_transferring(ctx: &Context<TransferHook>) -> Result<()> {
    let source_token_info = ctx.accounts.source_token.to_account_info();
    let mut account_data_ref: RefMut<&mut [u8]> = source_token_info.try_borrow_mut_data()?;
    let mut account = PodStateWithExtensionsMut::<PodAccount>::unpack(*account_data_ref)?;
    let account_extension = account.get_extension_mut::<TransferHookAccount>()?;

    if !bool::from(account_extension.transferring) {
        return Err(MyError::NotFromT22.into());
    } else {
        msg!("We are currently transferring!");
    }

    Ok(())
}

#[error_code]
pub enum MyError {
    #[msg("Not currently transfering")]
    NotFromT22,
}