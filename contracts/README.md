# Contracts

Smart contracts for ShadowMarket prediction market platform.

## Contracts

1. **MarketFactory** - Factory for creating new prediction markets
2. **PredictionMarket** - Individual market with AMM logic
3. **P2PWager** - Peer-to-peer direct betting
4. **LiquidityPool** - Liquidity pool management
5. **Oracle** - Decentralized oracle for outcome resolution

## Development

```bash
# Compile contracts
pnpm run compile

# Build TypeScript
pnpm run build

# Run tests
pnpm test

# Watch mode
pnpm run dev
```

## Compilation

Contracts are written in Compact language and compiled to ZK circuits:

```bash
pnpm run compile
```

This generates:

- Prover/verifier keys in `src/managed/[contract]/keys/`
- TypeScript bindings in `src/managed/[contract]/`
