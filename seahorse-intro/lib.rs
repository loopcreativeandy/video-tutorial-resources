use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::associated_token;
use anchor_spl::token;
use std::convert::TryFrom;

declare_id!("Em2Wj7ETpocsmGJ2cL4tTtzSDzvcQaqRjksUYNkDYGnd");

#[account]
pub struct FizzBuzz {
    fizz: bool,
    buzz: bool,
    n: u64,
}

pub fn init_handler(mut ctx: Context<Init>) -> Result<()> {
    let mut owner = &mut ctx.accounts.owner;
    let mut fizzbuzz = &mut ctx.accounts.fizzbuzz;

    Ok(())
}

pub fn do_fizzbuzz_handler(mut ctx: Context<DoFizzbuzz>, mut n: u64) -> Result<()> {
    let mut fizzbuzz = &mut ctx.accounts.fizzbuzz;
    let mut owner = &mut ctx.accounts.owner;

    fizzbuzz.fizz = (n % (3 as u64)) == (0 as u64);

    fizzbuzz.buzz = (n % (5 as u64)) == (0 as u64);

    if (!fizzbuzz.fizz) && (!fizzbuzz.buzz) {
        fizzbuzz.n = n;
    } else {
        fizzbuzz.n = 0;
    }

    if fizzbuzz.fizz && fizzbuzz.buzz {
        msg!("{}", "FIZZBUZZ!");

        {
            let amount = 100000000;

            **fizzbuzz.to_account_info().try_borrow_mut_lamports()? -= amount;

            **owner.to_account_info().try_borrow_mut_lamports()? += amount;
        };
    } else {
        msg!("{} {}", "n = ", fizzbuzz.n);

        solana_program::program::invoke(
            &solana_program::system_instruction::transfer(&owner.key(), &fizzbuzz.key(), 100000000),
            &[
                (owner).to_account_info(),
                (fizzbuzz).to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        );
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        seeds = ["fizzbuzz".as_bytes().as_ref(), owner.key().as_ref()],
        bump,
        space = 8 + std::mem::size_of::<FizzBuzz>()
    )]
    pub fizzbuzz: Box<Account<'info, FizzBuzz>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
# [instruction (n : u64)]
pub struct DoFizzbuzz<'info> {
    #[account(mut)]
    pub fizzbuzz: Box<Account<'info, FizzBuzz>>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[program]
pub mod fizzbuzz {
    use super::*;

    pub fn init(ctx: Context<Init>) -> Result<()> {
        init_handler(ctx)
    }

    pub fn do_fizzbuzz(ctx: Context<DoFizzbuzz>, n: u64) -> Result<()> {
        do_fizzbuzz_handler(ctx, n)
    }
}
