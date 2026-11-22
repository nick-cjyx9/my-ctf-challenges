# name-pending_toctou

A TOCTOU challenge based on `await using` disposal timing.

## Setup

Install dependencies:

```bash
bun install
```

Start server:

```bash
bun run index.ts
```

In another terminal, run the race exploit script:

```bash
bun run race.ts
```

## Challenge idea

- `/redeem` checks whether a coupon is used before granting score.
- The `used=true` commit is incorrectly delayed to `Symbol.asyncDispose` and includes `await sleep(1000)`.
- Two concurrent requests can both observe `used=false` before the commit runs.
- Reach score 100, then request `/flag?u=guest` to get the flag.
