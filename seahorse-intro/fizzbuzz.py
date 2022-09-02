# as seen in this video
# https://youtu.be/_xxIIWBS0nw

# fizzbuzz
# Built with Seahorse v0.1.6
#
# On-chain, persistent FizzBuzz!

from seahorse.prelude import *

# This is your program's public key and it will update
# automatically when you build the project.
declare_id('Em2Wj7ETpocsmGJ2cL4tTtzSDzvcQaqRjksUYNkDYGnd');

class FizzBuzz(Account):
  fizz: bool
  buzz: bool
  n: u64

@instruction
def init(owner: Signer, fizzbuzz: Empty[FizzBuzz]):
  fizzbuzz.init(payer = owner, seeds = ['fizzbuzz', owner])

@instruction
def do_fizzbuzz(fizzbuzz: FizzBuzz, n: u64, owner: Signer):
  fizzbuzz.fizz = n % 3 == 0
  fizzbuzz.buzz = n % 5 == 0
  if not fizzbuzz.fizz and not fizzbuzz.buzz:
    fizzbuzz.n = n
  else:
    fizzbuzz.n = 0
  if fizzbuzz.fizz and fizzbuzz.buzz:
    print("FIZZBUZZ!")
    fizzbuzz.transfer_lamports(owner, 100000000)
  else:
    print("n = ", fizzbuzz.n)
    owner.transfer_lamports(fizzbuzz, 100000000)
  
