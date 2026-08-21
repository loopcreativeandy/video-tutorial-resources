# Solana Loader V4 — research notes and sources

A factual reference for the story of Solana's Loader V4: where it came from, why
it was abandoned, and what replaced it. Every claim here links to a primary
source — a pull request, a proposal document, a line of validator source, or a
live RPC query you can run yourself.

**Verified 2026-08-21** against `anza-xyz/agave` master commit
[`510104a`](https://github.com/anza-xyz/agave/commit/510104a068b9edc4f583767c8b9c024351db4f60)
and live mainnet / devnet / testnet RPC. Feature-gate activation status changes
over time — re-run the checks in ["How to verify any of this yourself"](#how-to-verify-any-of-this-yourself).

---

## The loaders

Program IDs, verified in
[`solana-sdk-ids`](https://github.com/anza-xyz/solana-sdk/blob/master/sdk-ids/src/lib.rs):

| Loader | Program ID | Status |
|---|---|---|
| BPF Loader (deprecated) | `BPFLoader1111111111111111111111111111111111` | Deprecated |
| BPF Loader v2 | `BPFLoader2111111111111111111111111111111111` | Non-upgradeable |
| BPF Upgradeable Loader ("V3") | `BPFLoaderUpgradeab1e11111111111111111111111` | Current standard for program deployment |
| Loader V4 | `LoaderV411111111111111111111111111111111111` | Abandoned as a builtin |

### How old each loader is

Introduction dates are the merge date of the pull request that first declared the
loader's program ID, plus the first tagged release containing that commit.
Retirement dates are read from the chain: the mainnet-beta activation slot of the
feature gate that disabled the loader, converted with `getBlockTime`.

| Loader | Introduced (code) | First release | Retired |
|---|---|---|---|
| BPF Loader (deprecated) | Oct 2018 — [solana#1573 "Preload BPF loader"](https://github.com/solana-labs/solana/pull/1573), 2018-10-23 | pre-1.0; live at mainnet-beta launch, Mar 2020 | **2022-12-16** on mainnet — gate `disable_deprecated_loader` |
| BPF Loader v2 | Aug 2020 — [solana#11384 "Align host addresses"](https://github.com/solana-labs/solana/pull/11384), 2020-08-11 | v1.4.0, 2020-10-14 | **2024-04-12** on mainnet — gate `disable_bpf_loader_instructions` ([#34194](https://github.com/solana-labs/solana/pull/34194)); deploys only, existing programs still execute |
| BPF Upgradeable Loader ("V3") | Dec 2020 — [solana#13689 "Upgradeable loader"](https://github.com/solana-labs/solana/pull/13689), 2020-12-14 | v1.5.0, 2020-12-17 | still current |
| Loader V4 | Feb–Mar 2023 — [solana#30464 "Feature - Loader built-in program v4"](https://github.com/solana-labs/solana/pull/30464), opened 2023-02-23, merged 2023-03-23 (as "loader-v3") | v1.16.0, 2023-05-31 | never activated on any cluster; builtin deleted 2026-04-30 |

Roughly: the lineage spans **eight years**, and the spacing is uneven. V1 ran
alone for nearly two years. V2 and V3 landed four months apart in the second half
of 2020 — V2 in August, V3 in December — so V2 was superseded almost immediately
and never became the loader anyone deployed with by choice. V3 has then held the
position for over five years. V4 sat in the validator for three years without
ever being switched on.

A detail worth noting for V1 and V2: the ID `BPFLoader2111…` did not exist
before 2020-08-11. PR #11384, which introduced the aligned account
serialization format, rewrote `sdk/src/bpf_loader.rs` in place and moved the old
ID into a new file:

```diff
--- sdk/src/bpf_loader.rs
-crate::declare_id!("BPFLoader1111111111111111111111111111111111");
+crate::declare_id!("BPFLoader2111111111111111111111111111111111");
--- sdk/src/bpf_loader_deprecated.rs (new file)
+crate::declare_id!("BPFLoader1111111111111111111111111111111111");
```

So V1 was not deprecated by a decision recorded somewhere — it was deprecated by
a rename, on the day V2 was created.

The two retirement dates were obtained by reading the feature-gate accounts
directly:

| Gate | Address | Mainnet activation slot | Date |
|---|---|---|---|
| `disable_deprecated_loader` | `GTUMCZ8LTNxVfxdrw7ZsDFTxXb7TutYkzJnFwinpE6dg` | 167,184,008 | 2022-12-16 |
| `disable_bpf_loader_instructions` | `7WeS1vfPRgeeoXArLh7879YcB9mgE9ktjPDtajXeWfXn` | 259,632,004 | 2024-04-12 |

The method is the one described in
["How to verify any of this yourself"](#how-to-verify-any-of-this-yourself) —
`getAccountInfo` on the gate, then `getBlockTime` on the slot in bytes 1–8.

### Where the name "V4" comes from

The loader now called V4 was originally being developed as V3. It was renamed in
[**solana-labs/solana#31570 — "Refactor - Renames loader-v3 to loader-v4"**](https://github.com/solana-labs/solana/pull/31570)
(Alexander Meißner / @Lichtso, merged 2023-05-11, +109/−109).

The full problem statement:

> The first three loaders started counting their version names at 1 not at 0.

So the loader commonly called "V3" is the fourth loader in the code's own
lineage, and the numbering was corrected by shifting the in-development loader's
name from v3 to v4.

---

## Timeline

| Date | Event | Source |
|---|---|---|
| 2023-05-11 | loader-v3 renamed to loader-v4 | [solana#31570](https://github.com/solana-labs/solana/pull/31570) |
| 2023-09-19 | First feature gate added, for local testing | [solana#33294](https://github.com/solana-labs/solana/pull/33294) |
| 2024-08-05 | SIMD-0164 (`ExtendProgramChecked`) opened | [SIMD PR #164](https://github.com/solana-foundation/solana-improvement-documents/pull/164) |
| 2025-01-23 | Loader V4 made the default in Agave; gate renamed and rekeyed | [agave#2796](https://github.com/anza-xyz/agave/pull/2796) |
| 2025-02-25 | CLI support for V3 → V4 migration | [agave#4856](https://github.com/anza-xyz/agave/pull/4856) |
| 2025-05-13 | `ExtendProgramChecked` instruction implemented | [agave#6131](https://github.com/anza-xyz/agave/pull/6131) |
| 2025-12-07 | **RFC-0423 "Loader V3: Fix or Replace"** opened | [Discussion #423](https://github.com/solana-foundation/solana-improvement-documents/discussions/423) |
| 2025-12-14 | SIMD-0431 created (supersedes SIMD-0164) | [SIMD-0431](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0431-minimum-extend-program-size.md) |
| **2026-01-08** | **RFC-0423 feedback deadline** | [Discussion #423](https://github.com/solana-foundation/solana-improvement-documents/discussions/423) |
| 2026-01-16 | SIMD-0164 closed unmerged, "superseded" | [SIMD PR #164](https://github.com/solana-foundation/solana-improvement-documents/pull/164) |
| 2026-03-23 | Loader V4 feature gate un-keyed | [agave#11470](https://github.com/anza-xyz/agave/pull/11470) |
| 2026-03-27 | `solana program-v4` CLI deleted | [agave#11569](https://github.com/anza-xyz/agave/pull/11569) |
| 2026-04-09 | `ExtendProgramChecked` gate un-keyed | [agave#11686](https://github.com/anza-xyz/agave/pull/11686) |
| 2026-04-10 | `ExtendProgramChecked` instruction removed | [agave#11685](https://github.com/anza-xyz/agave/pull/11685) |
| 2026-04-30 | **Loader V4 builtin deleted from Agave** | [agave#11990](https://github.com/anza-xyz/agave/pull/11990) |

---

## RFC-0423 — "Loader V3: Fix or Replace"

**<https://github.com/solana-foundation/solana-improvement-documents/discussions/423>**

Opened by **@buffalojoec (Joe Caulfield, Anza)** on **7 December 2025**.

> ⚠️ **This is a GitHub _Discussion_, not a proposal file.** Solana RFCs live as
> discussions in the SIMD repository and are numbered separately from merged
> proposals. There is no `proposals/0423-*.md`, and the document is not indexed
> by search engines. The link above is the only way to reach it.

The RFC is not a design document — it is a decision framework. It defines the
problems with Loader V3 and asks the community to choose between repairing it
and replacing it with Loader V4.

### The six problems with Loader V3

From the RFC's **"Issues with Loader V3"** section. Each problem in the original
document includes an expandable "Additional Details" block with permalinks
into the Agave source.

**1. Account Indirection.** A V3 program is two accounts:

```rust
// Program account.
struct Program {
    /// Address of the corresponding ProgramData account.
    programdata_address: Pubkey,
}

// ProgramData account
struct ProgramData {
    /// Slot when this program was last modified.
    slot: u64,
    /// Optional authority that can upgrade the program.
    upgrade_authority_address: Option<Pubkey>,
    // ... Followed by program ELF bytes.
}
```

Consequences listed: a double account lookup on every invocation; the account
loader must track and deduplicate `ProgramData` accounts so they aren't
double-counted against transaction size limits; repeated relationship validation
across many loader instructions; and the note that the indirection exists to
circumvent the account `executable` flag, which is itself being removed
([SIMD-0162](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0162-remove-accounts-executable-flag-checks.md),
[SIMD-0319](https://github.com/solana-foundation/solana-improvement-documents/pull/319)).

**2. Metadata and ELF Coupling.** Both live in `ProgramData`. Changing the
33-byte upgrade authority requires borrowing and mutating an account that may
contain megabytes of ELF. The 45-byte metadata header is hard-coded and butted
directly against the ELF, so the format cannot evolve.

**3. ELF Misalignment.** The metadata at the start of `ProgramData` is not
16-byte aligned, so the ELF that follows is not either. This forces the parser
to copy the entire ELF into an aligned buffer before verification — and the
lenient parser may copy it twice.

**4. Program Behavior Constraints.** The developer-facing list:

- The buffer account's upgrade authority must match the program's.
- `ProgramData` cannot be downsized after creation, only extended — even when
  the ELF shrinks.
- `ExtendProgram` is permissionless, so any caller can increase an account's
  size and rent requirement.
- `Upgrade` does not resize `ProgramData` to fit the new ELF.
- Most loader instructions cannot be invoked via CPI. `DeployWithMaxDataLen`,
  `Write` and `InitializeBuffer` are blocked, preventing programs from deploying
  or managing other programs on behalf of users.
- Closed programs are tombstoned permanently. The program ID can never be
  reused, and any accounts still owned by the closed program become permanently
  inaccessible.

The RFC notes that a permissionless `ExtendProgram` is griefable because the
instruction takes `additional_bytes` rather than a target size:

> Because the `ExtendProgram` instruction accepts an `additional_bytes`
> parameter (rather than something like `target_size`), an attacker could
> front-run a prepared multisig extension, for example, by first extending the
> program by only a few bytes. This could cause the legitimate instruction to
> fail later, when the combined size exceeds the rent-exempt balance.

**5. Lack of Proper Specification.** Loader V3 was never formally specified.
The RFC cites three recurring developer confusions, each with a source:

- Making a program immutable requires setting the upgrade authority to `None`,
  which is done by *omitting the account from the instruction* —
  [Stack Exchange](https://solana.stackexchange.com/questions/9224/how-do-i-make-a-program-immutable)
- Closing a program is irreversible and permanently bricks accounts it owned —
  [Discussion #247](https://github.com/solana-foundation/solana-improvement-documents/discussions/247)
- The program ID keypair is irrelevant after deployment —
  [Stack Exchange](https://solana.stackexchange.com/questions/4027/after-deployment-of-a-program-can-the-program-ids-private-key-be-made-public)

**6. Technical Debt.** Acknowledged-but-unfixed bugs, inconsistent account-index
handling, and workarounds for runtime quirks — such as stuffing an extra account
into a CPI to avoid an `UnbalancedInstruction` error.

### On-Chain Loader Prerequisites

The RFC identifies two runtime dependencies that block *any* loader — repaired
or replaced — from being deployed as an on-chain BPF program:

- **ELF verification.** During deployment the loader invokes a runtime routine
  to verify the ELF before writing it. An on-chain program cannot call back into
  the runtime. Options floated: defer verification to first invocation, or add a
  privileged syscall that only loaders may call.
- **Program cache updates.** After a deploy the loader notifies the program
  cache directly that the entry changed in the current slot. Option floated:
  redesign the cache to observe account-state changes instead.

The RFC states these are *"not specific to Loader V3"* and that addressing them
*"would generally enable either Loader V3 or Loader V4 to be deployed as an
on-chain BPF program."*

### The call for review

The RFC requests explicit review from: **@Lichtso, @jstarry, @2501babe,
@joncinque** (Anza); **@deanmlittle, @L0STE** (Blueshift); **@topointon-jump,
@mjain-jump** (Firedancer); **@jacobcreech** (Solana Foundation).

Three questions:

- **Feasibility** — are the proposed repairs technically viable, or do they
  introduce unacceptable risk or complexity?
- **Disruption** — given both paths require breaking changes, which minimises
  disruption to the ecosystem?
- **Maintenance** — which path results in a more maintainable loader over the
  next 3+ years?

### The binding-decision quote

From the **"Deadline"** subsection of **"Call to Action"** — the final paragraph
of the RFC body, immediately above its numbered Sources list:

> Feedback is requested by January 8th, 2026. After this date, community input
> will be distilled into a final decision on whether to repair Loader V3 or
> replace it with Loader V4. **This decision will be binding and development
> will proceed accordingly.**

### The RFC's own source list

1. [SIMD-0167: Loader-v4 #167](https://github.com/solana-foundation/solana-improvement-documents/pull/167)
2. [SIMD-0315: Loader-v3 to loader-v4 migration #315](https://github.com/solana-foundation/solana-improvement-documents/pull/315)
3. [Dean Little's repair proposal (gist)](https://gist.github.com/deanmlittle/d95f2fc68866f11cf148c34b582c18c4)
4. [SIMD-0162: Remove accounts executable flag checks](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0162-remove-accounts-executable-flag-checks.md)
5. [SIMD-0319: Remove Accounts is_executable Flag Entirely #319](https://github.com/solana-foundation/solana-improvement-documents/pull/319)
6. [SIMD-0164: ExtendProgramChecked loader-v3 instruction #164](https://github.com/solana-foundation/solana-improvement-documents/pull/164)
7. [feat: Add emergency-abort command to Solana CLI, agave#6932](https://github.com/anza-xyz/agave/pull/6932)
8. [Stack Exchange: how do I make a program immutable](https://solana.stackexchange.com/questions/9224/how-do-i-make-a-program-immutable)
9. [Allow Closed Programs to be Recreated #247](https://github.com/solana-foundation/solana-improvement-documents/discussions/247)
10. [Stack Exchange: can the program ID's private key be made public](https://solana.stackexchange.com/questions/4027/after-deployment-of-a-program-can-the-program-ids-private-key-be-made-public)

The RFC also characterises the two replacement SIMDs directly: SIMD-0167 *"has
accumulated substantial discussion"* and SIMD-0315 *"remains contentious"*.

---

## The feature gate address history

The `enable_loader_v4` feature gate has held **four different addresses**. Each
row was confirmed by `git log -S<address>` over the full history of
`anza-xyz/agave` on 2026-08-21.

| # | Address | Gate name | PR that set it | Merged | Commit |
|---|---|---|---|---|---|
| 1 | `8oBxsYqnCvUTGzgEpxPcnVf7MLbWWPYddE33PftFeBBd` | `enable_program_runtime_v2_and_loader_v4` | [solana-labs/solana#33294](https://github.com/solana-labs/solana/pull/33294) — Lichtso | 2023-09-19 | `bc38ef27d` |
| 2 | `2aQJYqER2aKyb3cZw22v4SL2xMX7vwXBRWfvS4pTrtED` | `enable_loader_v4` | [agave#2796](https://github.com/anza-xyz/agave/pull/2796) "Refactor - Makes loader-v4 the default" — Lichtso | 2025-01-23 | `6ff4dee5f` |
| 3 | `LoaderV4Wi11BeDe1eted1111111111111111111111` | `enable_loader_v4` | [agave#11470](https://github.com/anza-xyz/agave/pull/11470) "unkey loader v4" — buffalojoec | 2026-03-23 | `5ce903413` |
| 4 | `LoaderV4WasAbandoned11111111111111111111111` | `enable_loader_v4` | [agave#11990](https://github.com/anza-xyz/agave/pull/11990) "delete loader v4 program" — buffalojoec | 2026-04-30 | `c31906430` |

Addresses 3 and 4 are vanity placeholders with no corresponding private key, so
the feature can never be activated. Address 3 uses leetspeak (`Wi11BeDe1eted`)
because base58 contains neither `l` nor `0` — the same reason
`BPFLoaderUpgradeab1e` is spelled with a `1`.

**PR #33294**, which created the original gate, stated:

> The loader-v4 is currently unreachable outside of unit tests. So, a feature
> gate for local testing should be introduced.

**PR #11470**, which un-keyed it, stated:

> As per RFC-0423, Loader V4 will be redesigned and reintroduced as an on-chain
> BPF program. While I work through the churn on #10396 to properly delete the
> builtin implementation, we should un-key the feature, obviously, to let
> onlookers know this program will not make it to any network in its current
> form.

### Where the address lives in the source today

[`feature-set/src/lib.rs` lines 1020–1022](https://github.com/anza-xyz/agave/blob/510104a068b9edc4f583767c8b9c024351db4f60/feature-set/src/lib.rs#L1020-L1022):

```rust
pub mod enable_loader_v4 {
    solana_pubkey::declare_id!("LoaderV4WasAbandoned11111111111111111111111");
}
```

And the entry in the feature-name table that makes it appear in tooling output,
[line 2139](https://github.com/anza-xyz/agave/blob/510104a068b9edc4f583767c8b9c024351db4f60/feature-set/src/lib.rs#L2139):

```rust
(enable_loader_v4::id(), "SIMD-0167: Enable Loader-v4"),
```

### Which Agave releases contain which address

`solana feature status` prints the address compiled into the binary you are
running, so the CLI version determines what you see.

| Agave tag | `enable_loader_v4` address |
|---|---|
| v3.0.0 | `2aQJYqER2aKyb3cZw22v4SL2xMX7vwXBRWfvS4pTrtED` |
| v4.0.0 | `2aQJYqER2aKyb3cZw22v4SL2xMX7vwXBRWfvS4pTrtED` |
| **v4.1.0** | **`LoaderV4WasAbandoned11111111111111111111111`** |
| v4.2.0 | `LoaderV4WasAbandoned11111111111111111111111` |

The rekey reaches released binaries in **Agave v4.1.0**.

---

## The deletion of Loader V4

Nine merged pull requests by **@buffalojoec**, over five weeks:

| PR | Title | Merged | Deletions |
|---|---|---|---|
| [#11470](https://github.com/anza-xyz/agave/pull/11470) | unkey loader v4 | 2026-03-23 | −1 |
| [#11569](https://github.com/anza-xyz/agave/pull/11569) | cli: delete program_v4 module | 2026-03-27 | −3072 |
| [#11593](https://github.com/anza-xyz/agave/pull/11593) | bpf_loader: remove loader v4 migrate instruction | 2026-03-29 | −470 |
| [#11654](https://github.com/anza-xyz/agave/pull/11654) | svm: tests: delete loader v4 | 2026-03-31 | −214 |
| [#11656](https://github.com/anza-xyz/agave/pull/11656) | compute-budget-instruction: tests: delete loader v4 | 2026-03-31 | −3 |
| [#11621](https://github.com/anza-xyz/agave/pull/11621) | programs/sbf: delete loader v4 | 2026-04-03 | −411 |
| [#11655](https://github.com/anza-xyz/agave/pull/11655) | runtime: tests: delete loader v4 | 2026-04-03 | −45 |
| [#11946](https://github.com/anza-xyz/agave/pull/11946) | security-policy: exclude loader v4 | 2026-04-15 | — |
| [#11990](https://github.com/anza-xyz/agave/pull/11990) | delete loader v4 program | 2026-04-30 | −1848 |

The problem statement of both #11569 and #11990 reads:

> As per RFC-0423, Loader V4 will be redesigned and reintroduced as an on-chain
> program. The builtin implementation should be removed.

### Closed without merging

- [**#10396** "delete loader v4"](https://github.com/anza-xyz/agave/pull/10396) —
  opened 2026-02-05, 50 files, −6533 lines, closed 2026-04-05. The single-PR
  attempt, later broken into the series above.
- [**#11734** "svm: delete loader v4"](https://github.com/anza-xyz/agave/pull/11734)
  — closed 2026-04-24. Its body: *"This is the final precursor to removing
  Loader V4 from the validator… The most consensus-sensitive piece is within
  `svm`."*

### The code as it stood immediately before deletion

These paths do not exist on `master`. The links below point at the parent commit
of each deletion PR:

- [`programs/loader-v4/src/lib.rs`](https://github.com/anza-xyz/agave/blob/196cf1ea88cdc9953203e7455dd3b0c44f5cd501/programs/loader-v4/src/lib.rs) — 1648 lines
- [`cli/src/program_v4.rs`](https://github.com/anza-xyz/agave/blob/1f80c4fdbd81b400eebec8ce8eaf08e1bb2c23e2/cli/src/program_v4.rs) — 2541 lines, the entire `solana program-v4` CLI

The interface crate remains published:
[`solana-loader-v4-interface`](https://crates.io/crates/solana-loader-v4-interface)
(extracted in [agave#4486](https://github.com/anza-xyz/agave/pull/4486)).

### Loader V4 before its removal

It was implemented, shipped, and briefly made the default:

- [agave#2796](https://github.com/anza-xyz/agave/pull/2796) — Makes loader-v4 the default (merged 2025-01-23)
- [agave#4856](https://github.com/anza-xyz/agave/pull/4856) — CLI loader v3 to v4 migration (merged 2025-02-25), backported in [#5067](https://github.com/anza-xyz/agave/pull/5067)
- [agave#4575](https://github.com/anza-xyz/agave/pull/4575) — Write lock demotion exemption for loader-v4
- [agave#5968](https://github.com/anza-xyz/agave/pull/5968) — Remove loader v4 instruction deploy from source (merged 2025-04-26)

Developers encountered it in production tooling:

- [agave#5099](https://github.com/anza-xyz/agave/issues/5099) — *"Error: No new
  programs can be deployed on loader-v3. Please use the program…"* (closed)
- [agave#5189](https://github.com/anza-xyz/agave/issues/5189) — *"No new programs
  can be deployed on loader-v3, Please use program-v4 subcommand"* — filed
  2025-03-07, **still open**

---

## SIMD-0164 and `ExtendProgramChecked`

### Why SIMD-0164 is not in the proposals directory

**It was never merged.** The SIMD repository only contains `proposals/*.md` files
for merged proposals; a SIMD that is closed without merging exists solely as a
pull request.

| Field | Value |
|---|---|
| Title | SIMD-0164: `ExtendProgramChecked` loader-v3 instruction |
| Author | @Lichtso (Anza) |
| PR | [#164](https://github.com/solana-foundation/solana-improvement-documents/pull/164) |
| Opened | 2024-08-05 |
| Closed | 2026-01-16 — **not merged** |
| Branch | `Lichtso:extend-program-checked` |
| Diff | 1 file, +103/−0 — `proposals/0164-extend-program-checked.md` |

**To read the proposal text:**

- Diff view: <https://github.com/solana-foundation/solana-improvement-documents/pull/164/files>
- Pinned blob: <https://github.com/solana-foundation/solana-improvement-documents/blob/04019d20d4ef8a04561b521c7229f9a4acbd9350/proposals/0164-extend-program-checked.md>

The closing comment, by @Benhawkins18 on 2026-01-16 — eight days after the
RFC-0423 feedback deadline:

> superseded by newer SIMD proposals: Closing

RFC-0423 references SIMD-0164 directly, in its table of feature-gated fixes for
problem area 4: *"SIMD-0164 already exists for the last feature gate."*

### Why it was superseded

Discussion on PR #164 shows the objection. @jstarry, 2025-07-07:

> Because of the 10KiB account size increase limit in CPI's, I think it would be
> better to explore other options as @joncinque mentioned

And 2025-07-31:

> I think it's better to go with a minimum extension length. That way the extend
> instruction doesn't need to be deprecated and self upgrading programs don't
> need to migrate

[**SIMD-0431**](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0431-minimum-extend-program-size.md)
carries `supersedes: '0164'` in its front matter and states in its Rationale:

> SIMD-0164 and earlier revisions of this SIMD attempted to fix this by making
> `ExtendProgram` permissioned, requiring the upgrade authority as a signer.
> While this provides absolute DoS protection, it breaks several important
> workflows

listing multisig PDA authorities (which cannot sign top-level instructions) and
self-upgrading programs as the affected cases. It states plainly: *"SIMD-0164 was
never approved."*

### `ExtendProgramChecked` was built, then removed

The instruction was implemented before the SIMD was resolved, then deleted:

| Step | PR | Date |
|---|---|---|
| Implemented | [agave#6131](https://github.com/anza-xyz/agave/pull/6131) — Feature: `UpgradeableLoaderInstruction::ExtendProgramChecked` | 2025-05-13 |
| CPI fix | [agave#6245](https://github.com/anza-xyz/agave/pull/6245) — Allow ExtendProgramChecked in CPI | 2025-05-15 |
| Backported | [agave#6217](https://github.com/anza-xyz/agave/pull/6217), [agave#6443](https://github.com/anza-xyz/agave/pull/6443) | 2025-06 |
| Gate un-keyed | [agave#11686](https://github.com/anza-xyz/agave/pull/11686) — unkey bpf_loader ExtendProgramChecked | 2026-04-09 |
| Instruction removed | [agave#11685](https://github.com/anza-xyz/agave/pull/11685) — bpf_loader: remove ExtendProgramChecked instruction | 2026-04-10 |
| Removed from SDK | [solana-sdk#656](https://github.com/anza-xyz/solana-sdk/pull/656) — loader-v3-interface: remove ExtendProgramChecked | — |

Its feature gate is still present in master as a second tombstone address,
[`feature-set/src/lib.rs` lines 1284–1286](https://github.com/anza-xyz/agave/blob/510104a068b9edc4f583767c8b9c024351db4f60/feature-set/src/lib.rs#L1284-L1286):

```rust
pub mod enable_extend_program_checked {
    solana_pubkey::declare_id!("ExtendProgCheckedWi11BeDe1eted11111111111111");
}
```

PR #11686's summary: *"Swap the `enable_extend_program_checked` feature gate with
a dummy."*

`ExtendProgramChecked` no longer appears in the
[Loader V3 instruction enum](https://github.com/anza-xyz/solana-sdk/blob/master/loader-v3-interface/src/instruction.rs).

### What shipped instead

**SIMD-0431 — Loader V3: Minimum Extend Program Size.** Enforces a 10,240-byte
minimum on `ExtendProgram`, mitigating the DoS vector through economic
deterrence while keeping the instruction permissionless.

Feature gate `loader_v3_minimum_extend_program_size` =
**`YbbRLkvenrocjGPGyoQE4wjnvYzTgfsk38NFmcYK7a5`**
([`feature-set/src/lib.rs` L1471–1473](https://github.com/anza-xyz/agave/blob/510104a068b9edc4f583767c8b9c024351db4f60/feature-set/src/lib.rs#L1471-L1473)).

Activation status, read from the gate accounts on 2026-08-21:

| Cluster | Status | Activation slot |
|---|---|---|
| mainnet-beta | **Active** | 432,864,000 |
| devnet | **Active** | 470,880,000 |
| testnet | **Active** | 416,540,256 |

Note that the SIMD-0431 proposal document still reads `status: Review` and
`feature: (fill in with feature key and github tracking issues once accepted)`
while the gate is active on all three clusters. Feature-gate status should be
read from the chain, not from proposal front matter.

---

## How to verify any of this yourself

### Feature gate activation status

A feature gate is a real account. Its presence and contents tell you everything:

```sh
curl -s https://api.mainnet-beta.solana.com \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo",
       "params":["<GATE_PUBKEY>",{"encoding":"base64"}]}'
```

- `"value": null` → **no account exists**; the feature has never been queued.
- Account exists, first data byte `0x00` → **queued but not yet activated**.
- Account exists, first data byte `0x01` → **activated**; the following 8 bytes
  are the activation slot as a little-endian `u64`.

### Listing gates via the CLI

```sh
solana feature status -u m | grep -i loader
```

`solana feature status` prints the addresses compiled into the CLI binary you
are running, so an older CLI will show older addresses. See the version table in
["Which Agave releases contain which address"](#which-agave-releases-contain-which-address).

### Results as of 2026-08-21

Every `enable_loader_v4` address, on every cluster:

| Address | mainnet-beta | devnet | testnet |
|---|---|---|---|
| `8oBxsYqnCvUTGzgEpxPcnVf7MLbWWPYddE33PftFeBBd` | no account | no account | no account |
| `2aQJYqER2aKyb3cZw22v4SL2xMX7vwXBRWfvS4pTrtED` | no account | no account | no account |
| `LoaderV4Wi11BeDe1eted1111111111111111111111` | no account | no account | no account |
| `LoaderV4WasAbandoned11111111111111111111111` | no account | no account | no account |
| `ExtendProgCheckedWi11BeDe1eted11111111111111` | no account | no account | no account |

The Loader V4 **program** address,
`LoaderV411111111111111111111111111111111111`:

| Cluster | Result |
|---|---|
| mainnet-beta | no account |
| devnet | account present — owner `NativeLoader1111111111111111111111111111111`, 9 bytes, data `loader_v4`, 1 lamport, `executable: true` |
| testnet | same as devnet |

All three clusters reported `solana-core` 4.2.x, which contains no Loader V4
builtin. The reason the stub account persists on devnet and testnet but not
mainnet has not been established here.

### Tracing a feature gate's history

The address history in ["The feature gate address history"](#the-feature-gate-address-history) was produced
with:

```sh
git clone --filter=blob:none --no-checkout https://github.com/anza-xyz/agave.git
cd agave
git log -S"LoaderV4WasAbandoned11111111111111111111111" \
  --date=short --pretty='%h | %ad | %s' \
  -- sdk/src/feature_set.rs sdk/feature-set/src/lib.rs feature-set/src/lib.rs
```

The three paths are the file's historical locations. Restricting to them keeps
the search fast on a blobless clone.

---

## Where Loader V3 development goes next

RFC-0423's outcome was to repair Loader V3 rather than replace it. The active
proposals, all filed December 2025 alongside the RFC:

| SIMD | Title | Document |
|---|---|---|
| 0430 | Loader V3: Relax Program Buffer Constraints | [proposal](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0430-relax-program-buffer-constraints.md) |
| 0431 | Loader V3: Minimum Extend Program Size | [proposal](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0431-minimum-extend-program-size.md) |
| 0432 | Loader V3: Reclaim Closed Program | [proposal](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0432-loader-v3-reclaim-closed-program.md) |
| 0433 | Loader V3: Set Program Data to ELF Length | [proposal](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0433-loader-v3-set-program-data-to-elf-length.md) |
| 0444 | Relax program data account check in migration | [proposal](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0444-relaxing-program-data-account-requirements.md) |

Plus two open discussions, which are **not** accepted proposals and may not
proceed:

- [#588 — Loader V3: Relax CPI Constraints](https://github.com/solana-foundation/solana-improvement-documents/discussions/588)
- [#589 — Remove Delayed Visibility Slots](https://github.com/solana-foundation/solana-improvement-documents/discussions/589)

Per RFC-0423, Loader V4 is intended to return as an on-chain BPF program rather
than a validator builtin, once the ELF-verification and program-cache
prerequisites in ["On-Chain Loader Prerequisites"](#on-chain-loader-prerequisites) are resolved.

---

## Full source list

**Proposals and RFCs**

- RFC-0423, Loader V3: Fix or Replace — <https://github.com/solana-foundation/solana-improvement-documents/discussions/423>
- SIMD-0164, ExtendProgramChecked (closed unmerged) — <https://github.com/solana-foundation/solana-improvement-documents/pull/164>
- SIMD-0167, Loader-v4 — <https://github.com/solana-foundation/solana-improvement-documents/pull/167>
- SIMD-0315, Loader-v3 to loader-v4 migration — <https://github.com/solana-foundation/solana-improvement-documents/pull/315>
- SIMD-0431, Minimum Extend Program Size — <https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0431-minimum-extend-program-size.md>
- Discussion #247, Allow Closed Programs to be Recreated — <https://github.com/solana-foundation/solana-improvement-documents/discussions/247>
- Dean Little's repair proposal — <https://gist.github.com/deanmlittle/d95f2fc68866f11cf148c34b582c18c4>

**Agave / solana-labs pull requests**

- solana#1573, preload BPF loader (first BPF loader) — <https://github.com/solana-labs/solana/pull/1573>
- solana#11384, align host addresses (creates BPF Loader v2, deprecates v1) — <https://github.com/solana-labs/solana/pull/11384>
- solana#13689, upgradeable loader ("V3") — <https://github.com/solana-labs/solana/pull/13689>
- solana#30464, loader built-in program v4 (merged as loader-v3) — <https://github.com/solana-labs/solana/pull/30464>
- solana#34194, disable bpf loader management instructions — <https://github.com/solana-labs/solana/pull/34194>
- solana#31570, rename loader-v3 to loader-v4 — <https://github.com/solana-labs/solana/pull/31570>
- solana#33294, first loader-v4 feature gate — <https://github.com/solana-labs/solana/pull/33294>
- agave#2796, makes loader-v4 the default — <https://github.com/anza-xyz/agave/pull/2796>
- agave#4856, CLI v3→v4 migration — <https://github.com/anza-xyz/agave/pull/4856>
- agave#6131, ExtendProgramChecked — <https://github.com/anza-xyz/agave/pull/6131>
- agave#10396, delete loader v4 (closed) — <https://github.com/anza-xyz/agave/pull/10396>
- agave#11470, unkey loader v4 — <https://github.com/anza-xyz/agave/pull/11470>
- agave#11569, delete program_v4 CLI — <https://github.com/anza-xyz/agave/pull/11569>
- agave#11685, remove ExtendProgramChecked — <https://github.com/anza-xyz/agave/pull/11685>
- agave#11686, unkey ExtendProgramChecked — <https://github.com/anza-xyz/agave/pull/11686>
- agave#11734, svm: delete loader v4 (closed) — <https://github.com/anza-xyz/agave/pull/11734>
- agave#11990, delete loader v4 program — <https://github.com/anza-xyz/agave/pull/11990>
- solana-sdk#656, remove ExtendProgramChecked from interface — <https://github.com/anza-xyz/solana-sdk/pull/656>

**Source files**

- `feature-set/src/lib.rs` (pinned) — <https://github.com/anza-xyz/agave/blob/510104a068b9edc4f583767c8b9c024351db4f60/feature-set/src/lib.rs>
- `sdk-ids/src/lib.rs` — <https://github.com/anza-xyz/solana-sdk/blob/master/sdk-ids/src/lib.rs>
- Loader V3 instruction enum — <https://github.com/anza-xyz/solana-sdk/blob/master/loader-v3-interface/src/instruction.rs>
- `programs/loader-v4/src/lib.rs` before deletion — <https://github.com/anza-xyz/agave/blob/196cf1ea88cdc9953203e7455dd3b0c44f5cd501/programs/loader-v4/src/lib.rs>
- `cli/src/program_v4.rs` before deletion — <https://github.com/anza-xyz/agave/blob/1f80c4fdbd81b400eebec8ce8eaf08e1bb2c23e2/cli/src/program_v4.rs>

**Crates**

- `solana-loader-v4-interface` — <https://crates.io/crates/solana-loader-v4-interface>
