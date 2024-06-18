use anchor_lang::prelude::*;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("CUop95w5uGSSXFZRefVHMHZxTqWriyfLZxm8DRN5cntv");

const MAX_MEMO_SIZE: u64 = 787;

const UNINITIALIZED: u64 = 0;
const INITIALIZED: u64 = 1;
const VALID: u64 = 2;
const INVALIDATED: u64 = 3;

#[program]
mod hello_anchor {
    use super::*;
    pub fn store_memo(ctx: Context<MemoContext>, _memo_index: u32, memo: String) -> Result<()> {
        msg!("Program started!");

        let mut memo_len = 0u64;
        for _ch in memo.as_bytes() {
            memo_len += 1;
        }
        if memo_len > MAX_MEMO_SIZE {
            return err!(MyError::MemoTooLong);
        }

        msg!("Memo created by {}: {}", ctx.accounts.signer.key(), memo);

        ctx.accounts.new_account.memo = memo;
        ctx.accounts.new_account.state = INITIALIZED;
        ctx.accounts.new_account.authority = ctx.accounts.signer.key().to_string();

        msg!("Program successul!");
        Ok(())
    }

    pub fn validate_memo(ctx: Context<ValidateContext>, _memo_index: u32) -> Result<()> {
        msg!("Program started!");

        if ctx.accounts.memo_account.state == UNINITIALIZED {
            msg!("This memo has not been created yet.");
            return err!(MyError::MemoUnititialized);
        } else if ctx.accounts.memo_account.state == VALID {
            msg!("This memo has already been validated.");
            return err!(MyError::MemoValidated);
        } else if ctx.accounts.memo_account.state == INVALIDATED {
            msg!("This memo has already been invalidated.");
            return err!(MyError::MemoInValidated);
        }
        msg!("Let's validated this memo");

        msg!("Validating the owner...");
        if ctx
            .accounts
            .memo_account
            .authority
            .eq(&ctx.accounts.signer.key().to_string())
        {
            msg!("owner valid.");
        } else {
            return err!(MyError::MemoOwnerDoesntMatch);
        }

        msg!(
            "is the memo valid? {}",
            is_valid_memo(ctx.accounts.memo_account.memo.clone())
        );

        if !is_valid_memo(ctx.accounts.memo_account.memo.clone()) {
            return err!(MyError::MemoIsNotValid);
        }
        if is_valid_memo(ctx.accounts.memo_account.memo.clone()) {
            ctx.accounts.memo_account.state = VALID;
        }

        msg!("Program successul!");
        Ok(())
    }
}

fn is_valid_memo(memo: String) -> bool {
    for i in 0..memo.len() {
        let ch: char = memo.chars().nth(i).unwrap();
        msg!("character: {}", ch);
        if ch.is_ascii_alphanumeric() || ch.eq(&' ') {
        } else {
            return false;
        }
    }
    true
}

#[derive(Accounts)]
#[instruction(memo_index: u32)]
pub struct MemoContext<'info> {
    #[account(init, payer = signer, space = 8 + (MAX_MEMO_SIZE as usize) + 32,
    seeds = [b"memo", signer.key().as_ref(), &memo_index.to_le_bytes()], bump)]
    pub new_account: Account<'info, MemoAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(memo_index: u32)]
pub struct ValidateContext<'info> {
    #[account(mut, seeds = [b"memo", signer.key().as_ref(), &memo_index.to_le_bytes()], bump)]
    pub memo_account: Account<'info, MemoAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[account]
pub struct MemoAccount {
    memo: String,
    authority: String,
    state: u64,
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
