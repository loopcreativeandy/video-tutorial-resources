use anchor_lang::prelude::*;

declare_id!("CUop95w5uGSSXFZRefVHMHZxTqWriyfLZxm8DRN5cntv");

const MAX_MEMO_SIZE: u64 = 512;
const UNINITIALIZED: u64 = 0;
const INITIALIZED: u64 = 1;
const VALID: u64 = 2;
const INVALIDATED: u64 = 3;

#[program]
mod hello_anchor {
    use super::*;
    pub fn store_memo(ctx: Context<MemoContext>, _memo_index: u32, memo: [u8; 512]) -> Result<()> {
        let memo_len = memo.len() as u64;
        require_gte!(MAX_MEMO_SIZE, memo_len, MyError::MemoTooLong);
        ctx.accounts.new_account.state = INITIALIZED;
        ctx.accounts.new_account.memo = memo;
        ctx.accounts.new_account.authority = ctx.accounts.signer.key();
        Ok(())
    }

    pub fn validate_memo(ctx: Context<ValidateContext>, _memo_index: u32) -> Result<()> {
        require_neq!(ctx.accounts.memo_account.state, VALID, MyError::MemoValidated);
        require_neq!(ctx.accounts.memo_account.state, INVALIDATED, MyError::MemoInValidated);
        require_neq!(ctx.accounts.memo_account.state, UNINITIALIZED, MyError::MemoUnititialized);
        require_keys_eq!(ctx.accounts.memo_account.authority, ctx.accounts.signer.key(), MyError::MemoOwnerDoesntMatch);
        require!(is_valid_memo(&ctx.accounts.memo_account.memo), MyError::MemoIsNotValid);
        if is_valid_memo(&ctx.accounts.memo_account.memo) {
            ctx.accounts.memo_account.state = VALID;
        }
        Ok(())
    }
}

fn is_valid_memo(memo: &[u8; 512]) -> bool {
    memo.iter().all(|ch| ch.is_ascii_alphanumeric() || *ch == b' ')
}

#[derive(Accounts)]
#[instruction(memo_index: u32)]
pub struct MemoContext<'info> {
    #[account(
        init, 
        payer = signer, 
        space = 8 + MemoAccount::MAX_SIZE + 32,
        seeds = [
            b"memo", 
            signer.key().as_ref(), 
            &memo_index.to_le_bytes()
        ], 
        bump
    )]
    pub new_account: Account<'info, MemoAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(memo_index: u32)]
pub struct ValidateContext<'info> {
    #[account(
        mut, 
        seeds = [
            b"memo", 
            signer.key().as_ref(), 
            &memo_index.to_le_bytes()
        ], 
        bump
    )]
    pub memo_account: Account<'info, MemoAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[account]
pub struct MemoAccount {
    memo: [u8; 512],
    authority: Pubkey,
    state: u64,
}
impl MemoAccount {
    const MAX_SIZE: usize = 512 + 32 + 8;
}

#[error_code]
pub enum MyError {
    #[msg("Memo too long")]
    MemoTooLong,
    #[msg("Memo unitialized")]
    MemoUnititialized,
    #[msg("Memo already validate")]
    MemoValidated,
    #[msg("Memo already invalidate")]
    MemoInValidated,
    #[msg("Invalid memo authority")]
    MemoOwnerDoesntMatch,
    #[msg("Memo contains invalid characters")]
    MemoIsNotValid,
}
