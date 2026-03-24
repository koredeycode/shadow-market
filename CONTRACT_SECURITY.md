# Smart Contract Security Guidelines - ShadowMarket

## Overview

This document outlines security best practices, audit guidelines, and verification procedures for ShadowMarket Compact smart contracts.

## Contract Architecture

### 1. MarketFactory.compact
**Purpose**: Factory pattern for creating prediction markets  
**Risk Level**: Medium  
**Key Functions**:
- `createMarket()` - Market creation with access control
- `getMarketCount()` - Read-only counter access

**Security Measures**:
- ✅ Centralized market creation (owner-only)
- ✅ Market counter prevents overflow (Field type)
- ✅ Events emitted for transparency
- ✅ No re-entrancy risk (pure state updates)

**Potential Vulnerabilities**:
- ⚠️ Single point of failure (owner address)
- ⚠️ No market limit (could exhaust gas)

**Recommendations**:
- [ ] Implement multi-sig for owner role
- [ ] Add rate limiting for market creation
- [ ] Consider decentralized governance

### 2. PredictionMarket.compact
**Purpose**: Core prediction market with AMM and private betting  
**Risk Level**: High (handles funds)  
**Key Functions**:
- `placeBet()` - Private bet placement with ZK commitments
- `lockMarket()` - Market closure at end time
- `resolveMarket()` - Oracle-based resolution
- `claimWinnings()` - Payout distribution

**Security Measures**:
- ✅ **Privacy**: Pedersen commitments hide bet amounts
- ✅ **Access Control**: Time-locks on critical functions
- ✅ **Input Validation**: Min/max bet limits enforced
- ✅ **Price Protection**: Slippage tolerance prevents manipulation
- ✅ **State Machine**: Clear market lifecycle (PENDING → OPEN → LOCKED → RESOLVED)
- ✅ **No Re-entrancy**: State updates before external calls
- ✅ **Integer Safety**: Field type prevents overflow
- ✅ **Fee Cap**: 0.3% fixed fee, not modifiable

**Potential Vulnerabilities**:
- ⚠️ **Front-running**: Public price updates visible before execution
  - *Mitigation*: Batch processing, commit-reveal for large trades
- ⚠️ **Oracle Dependency**: Single oracle can manipulate resolution
  - *Mitigation*: Multi-oracle consensus (see Oracle.compact)
- ⚠️ **AMM Manipulation**: Large bets move prices significantly
  - *Mitigation*: Min/max bet limits, slippage protection
- ⚠️ **Griefing**: Small bets could spam the market
  - *Mitigation*: Minimum bet limit (1000 tokens)

**Recommendations**:
- [ ] External security audit before mainnet
- [ ] Formal verification of AMM formulas
- [ ] Implement batch auction mechanism for large trades
- [ ] Add emergency pause for discovered vulnerabilities
- [ ] Time-lock on critical parameter changes

### 3. P2PWager.compact
**Purpose**: Peer-to-peer betting with custom odds  
**Risk Level**: Medium  
**Key Functions**:
- `createWager()` - Create P2P bet offer
- `acceptWager()` - Match with counterparty
- `cancelWager()` - Cancel unmatched offer
- `settleWager()` - Resolve and distribute

**Security Measures**:
- ✅ **Escrow**: Funds locked until settlement
- ✅ **Expiration**: Time-limited offers prevent stale bets
- ✅ **Fair Odds**: Creator and taker odds validated
- ✅ **Cancellation**: Only creator can cancel unmatched wager
- ✅ **Settlement**: Automatic payout on resolution

**Potential Vulnerabilities**:
- ⚠️ **Odds Validation**: Extreme odds (e.g., 1000:1) could be exploited
  - *Mitigation*: Reasonable odds limits (e.g., max 100:1)
- ⚠️ **Expiration Spam**: Create and expire many wagers
  - *Mitigation*: Creation fee or rate limiting

**Recommendations**:
- [ ] Add maximum odds ratio (e.g., 100:1)
- [ ] Implement wager creation fee
- [ ] Add reputation system for wager creators

### 4. LiquidityPool.compact
**Purpose**: AMM liquidity provision for markets  
**Risk Level**: High (handles LP funds)  
**Key Functions**:
- `addLiquidity()` - Deposit tokens to pool
- `removeLiquidity()` - Withdraw tokens from pool
- `swap()` - Trade against pool

**Security Measures**:
- ✅ **Constant Product**: x * y = k formula prevents drainage
- ✅ **LP Tokens**: Fair share calculation
- ✅ **Slippage**: Price impact calculated
- ✅ **Min Liquidity**: Bootstrap minimum prevents manipulation

**Potential Vulnerabilities**:
- ⚠️ **Impermanent Loss**: LPs lose on extreme price moves
  - *Mitigation*: Education, warnings in UI
- ⚠️ **Sandwich Attacks**: Front-run + back-run trades
  - *Mitigation*: Batch auctions, off-chain ordering
- ⚠️ **Pool Draining**: Large removal could leave dust
  - *Mitigation*: Minimum liquidity requirement

**Recommendations**:
- [ ] Implement dynamic fees based on volatility
- [ ] Add LP withdrawal cooldown period
- [ ] Consider off-chain order matching (Midnight DEX)

### 5. Oracle.compact
**Purpose**: Decentralized outcome resolution  
**Risk Level**: Critical (determines winners)  
**Key Functions**:
- `registerOracle()` - Stake to become oracle
- `submitReport()` - Report outcome with proof
- `confirmReport()` - Multi-oracle consensus
- `disputeReport()` - Challenge incorrect report

**Security Measures**:
- ✅ **Stake Requirement**: 1000 token minimum deters bad actors
- ✅ **Multi-Oracle**: Requires 3+ confirmations
- ✅ **Dispute Mechanism**: Stake slashing on proven incorrect report
- ✅ **Time-Lock**: 24-hour dispute period before finality
- ✅ **Proof Verification**: Signature from trusted data source

**Potential Vulnerabilities**:
- ⚠️ **Oracle Collusion**: 3+ oracles could collude to report incorrectly
  - *Mitigation*: High stake requirements, reputation system, diverse oracle set
- ⚠️ **Data Source Compromise**: Trusted source could be hacked
  - *Mitigation*: Multiple data sources, redundancy
- ⚠️ **Dispute Spam**: Bad actors could spam disputes
  - *Mitigation*: Dispute stake (100 tokens), slashing on failed dispute

**Recommendations**:
- [ ] Implement reputation-weighted voting
- [ ] Add multiple data source verification
- [ ] Consider Chainlink or Midnight Oracle Network integration
- [ ] Gradually increase oracle set to 10-20 oracles
- [ ] Implement progressive slashing (worse offense = more slashing)

## General Security Best Practices

### Code Quality
- ✅ Type safety with Compact's strong typing
- ✅ Explicit error handling with assert statements
- ✅ Clear function naming and documentation
- ✅ Modular design with separation of concerns

### Testing
- ✅ 120+ unit tests covering all functions
- ✅ Integration tests for cross-contract calls
- ✅ Edge case testing (overflow, underflow, zero values)
- ✅ Gas optimization tests
- [ ] Fuzz testing with property-based tests
- [ ] Formal verification of critical invariants

### Access Control
- ✅ Role-based permissions (Owner, Oracle, User)
- ✅ Function modifiers for access control
- ✅ Time-locks on critical operations
- [ ] Multi-sig for owner functions
- [ ] Timelocked upgrades (if upgradeable)

### Economic Security
- ✅ Fee caps prevent exploitation
- ✅ Min/max limits prevent dust and whale attacks
- ✅ Slippage protection for trades
- ✅ Oracle staking aligns incentives
- [ ] MEV protection mechanisms
- [ ] Circuit breakers for extreme volatility

## Audit Checklist

### Pre-Audit
- [ ] Complete all unit tests (target: 95%+ coverage)
- [ ] Run all integration tests
- [ ] Perform manual code review
- [ ] Document all assumptions and invariants
- [ ] Prepare audit scope and timeline

### During Audit
- [ ] Provide auditor with full codebase access
- [ ] Answer auditor questions promptly
- [ ] Document all findings
- [ ] Prioritize critical/high severity issues

### Post-Audit
- [ ] Fix all critical issues
- [ ] Fix all high severity issues
- [ ] Review and fix medium severity issues
- [ ] Document remaining known issues
- [ ] Publish audit report publicly

## Incident Response

### Severity Levels

**Critical** (immediate action required)
- Smart contract exploit discovered
- Funds at risk of theft
- Oracle manipulation detected

**High** (24-hour response)
- Vulnerability that could lead to loss
- Significant logic error
- Access control bypass

**Medium** (7-day response)
- Non-critical logic error
- Gas optimization issue
- Documentation inconsistency

### Response Steps

1. **Detect**: Monitoring, bug reports, white-hat disclosure
2. **Assess**: Severity level, impact scope, exploit likelihood
3. **Contain**: Pause contracts if possible, notify users
4. **Fix**: Develop and test patch
5. **Deploy**: Time-locked deployment, multi-sig approval
6. **Communicate**: Public disclosure, user notification
7. **Learn**: Post-mortem, update procedures

## External Resources

### Audit Firms
- [Trail of Bits](https://www.trailofbits.com/) - Smart contract auditing
- [Consensys Diligence](https://consensys.io/diligence/) - Security audits
- [OpenZeppelin](https://www.openzeppelin.com/security-audits) - Audit services
- [Quantstamp](https://quantstamp.com/) - Blockchain security

### Bug Bounty Platforms
- [Immunefi](https://immunefi.com/) - Largest bug bounty platform
- [HackerOne](https://www.hackerone.com/) - Security bounties
- [Code4rena](https://code4rena.com/) - Competitive audits

### Security Tools
- [Slither](https://github.com/crytic/slither) - Static analysis
- [Mythril](https://github.com/ConsenSys/mythril) - Security analysis
- [Echidna](https://github.com/crytic/echidna) - Fuzz testing
- [Manticore](https://github.com/trailofbits/manticore) - Symbolic execution

### Learning Resources
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Ethereum Security Documentation](https://ethereum.org/en/developers/docs/smart-contracts/security/)
- [DeFi Security DAO](https://www.defisecuritydao.org/)

---

**Last Updated**: March 24, 2026  
**Next Review**: April 24, 2026  
**Auditor**: Internal Security Team  
**Status**: Pre-Audit
