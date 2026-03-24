# ShadowMarket User Guide

Welcome to ShadowMarket, the privacy-preserving prediction market platform! This guide will help you get started with creating markets, placing bets, and managing your portfolio.

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Connecting Your Wallet](#connecting-your-wallet)
3. [Browsing Markets](#browsing-markets)
4. [Placing a Bet](#placing-a-bet)
5. [Creating a P2P Wager](#creating-a-p2p-w

ager)
6. [Managing Your Portfolio](#managing-your-portfolio)
7. [Creating a Market](#creating-a-market)
8. [Understanding Privacy](#understanding-privacy)
9. [FAQ](#faq)

---

## 🚀 Getting Started

### What is ShadowMarket?

ShadowMarket is a decentralized prediction market where you can bet on future events while maintaining complete privacy. Your bet amounts and positions are hidden using zero-knowledge cryptography.

### Key Features

-  **Private Betting**: Your bet amounts are never revealed publicly
- 🤝 **P2P Wagering**: Create custom bets with peers
- 📊 **Real-time Prices**: AMM-based pricing updates instantly
- 🔐 **Decentralized**: Oracle-based outcome resolution
- 💰 **Fair Payouts**: Automatic settlement and winnings distribution

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Lace wallet extension
- Midnight Network tokens (for testnet: request from faucet)

---

## 🔗 Connecting Your Wallet

### Step 1: Install Lace Wallet

1. Visit [Lace Wallet](https://www.lace.io/)
2. Download and install the browser extension
3. Create a new wallet or import existing one
4. **Important**: Save your recovery phrase securely!

### Step 2: Connect to ShadowMarket

1. Click "Connect Wallet" button in the top right
2. Select "Lace" from the wallet options
3. Approve the connection in your Lace wallet
4. Your wallet address will appear in the navbar

**Security Tip**: ShadowMarket never asks for your private keys or recovery phrase!

---

## 🔍 Browsing Markets

### Market Categories

- **Crypto**: Cryptocurrency price predictions
- **Sports**: Sports event outcomes
- **Politics**: Election and political event predictions
- **Tech**: Technology and product launches
- **Entertainment**: Awards, releases, and entertainment
- **Other**: Miscellaneous events

### Filtering Markets

**By Status**:
- **Open**: Markets accepting bets
- **Locked**: Market ended, awaiting resolution
- **Resolved**: Outcome determined, claim winnings
- **Cancelled**: Market cancelled (refunds available)

**By Sort Order**:
- **Volume**: Most trading activity
- **Liquidity**: Highest liquidity
- **Ending Soon**: Closing soonest
- **Newest**: Recently created

### Market Information

Each market card shows:
- **Question**: What event is being predicted
- **YES/NO Prices**: Current probability (0-100%)
- **Volume**: Total amount wagered
- **End Time**: When betting closes
- **Status**: Current market state

---

## 💰 Placing a Bet

### AMM Betting

AMM (Automated Market Maker) betting allows you to bet against the liquidity pool with dynamic pricing.

**Step 1: Select a Market**
1. Click on a market card to view details
2. Review the market question and description
3. Check the current YES/NO prices
4. Ensure the market is OPEN

**Step 2: Open the Bet Modal**
1. Click "Place Bet" button
2. The betting modal will appear

**Step 3: Configure Your Bet**
1. **Choose Side**: Select YES or NO
2. **Enter Amount**: Type your bet amount
   - Minimum: 1,000 tokens
   - Maximum: Varies by market
3. **Set Slippage**: Accept price movement (default: 1%)
4. **Review Estimate**:
   - Entry Price: Your effective price
   - Estimated Payout: If you win
   - Estimated Profit: Your profit
   - Price Impact: How much your bet moves the price

**Step 4: Confirm and Submit**
1. Click "Place Bet"
2. Approve the transaction in your wallet
3. Wait for confirmation (usually 5-10 seconds)
4. Your position appears in your portfolio

### Quick Amount Buttons

Use the percentage buttons for quick amounts:
- **25%**: Quarter of your balance
- **50%**: Half of your balance
- **75%**: Three-quarters of your balance
- **100%**: Your entire balance (not recommended!)

### Understanding Slippage

**Slippage** is the acceptable price movement between:
- When you click "Place Bet"
- When your transaction is processed

**Example**:
- You see YES at 65%
- You set 1% slippage
- Transaction will execute at 65% to 65.65%
- If price moves beyond 65.65%, transaction fails

**Recommendation**: Use 1-2% slippage for normal conditions.

---

## 🤝 Creating a P2P Wager

P2P (Peer-to-Peer) wagers let you create custom bets with specific odds.

### Step 1: Open P2P Modal

1. Navigate to a market
2. Click "P2P Wagers" tab
3. Click "Create P2P Wager" button

### Step 2: Set Your Offer

**Choose Your Side**: YES or NO

**Set Custom Odds**:
- Format: Numerator : Denominator
- Example: 3:1 means you risk 3 to win 1
- Implied probability shown automatically

**Enter Stake Amount**:
- Your stake amount
- Counterparty's required stake calculated automatically

**Set Duration**:
- Minimum: 1 hour
- Maximum: 30 days
- Wager expires if not accepted in time

### Step 3: Review and Create

1. Review your offer
2. Click "Create Wager"
3. Approve transaction in wallet
4. Your wager appears in "Open Wagers" list

### Step 4: Wait for Match

- Other users can accept your wager
- You can cancel anytime before it's accepted
- Once accepted, funds are escrowed until settlement

### Accepting a P2P Wager

1. Browse open P2P wagers
2. Review the odds and amount
3. Click "Accept Wager"
4. Approve transaction
5. Wager is now matched!

---

## 📊 Managing Your Portfolio

### Viewing Your Positions

1. Click "Portfolio" in the navigation
2. See all your active and settled positions

### Portfolio Statistics

**Dashboard shows**:
- **Total Value**: Current value of all positions
- **Profit/Loss**: Your overall P&L
- **Win Rate**: Percentage of winning bets
- **Total Volume**: Lifetime betting volume

### Active vs Settled

**Active Positions**:
- Markets still open or locked
- Cannot claim yet
- Value updates in real-time

**Settled Positions**:
- Markets resolved
- Ready to claim winnings
- Shows final profit/loss

### Claiming Winnings

1. Go to "Settled" tab
2. Find winning positions
3. Click "Claim" button
4. Approve transaction
5. Tokens transferred to your wallet

**Note**: You can claim multiple positions at once!

### Portfolio Chart

Tracks your portfolio value over time:
- Daily snapshots
- Total value line chart
- P&L tracking
- Time range selector (24h, 7d, 30d, all)

### Exporting Data

1. Click "Export Data" button
2. Choose format (CSV or JSON)
3. Select date range
4. Download file for your records

---

## ✨ Creating a Market

**Note**: Market creation may require special permissions or stake in some deployments.

### Step 1: Navigate to Create Market

1. Click "Create Market" in navigation
2. Complete the creation form

### Step 2: Market Details

**Question** (required):
- Clear, unambiguous question
- Example: "Will Bitcoin reach $100,000 by December 31, 2026?"
- 10-500 characters

**Description** (optional):
- Additional context
- Resolution criteria
- Data sources
- Up to 5,000 characters

**Category** (required):
- Choose from: Crypto, Sports, Politics, Tech, Entertainment, Other

**Tags** (optional):
- Add relevant tags
- Maximum 10 tags
- Helps users discover your market

### Step 3: Market Configuration

**End Time** (required):
- When betting closes
- Must be in the future
- Example: "2026-12-31 23:59:59 UTC"

**Bet Limits**:
- **Minimum Bet**: Smallest allowed bet (default: 1,000 tokens)
- **Maximum Bet**: Largest allowed bet (prevents manipulation)

**Resolution Source** (required):
- Where outcome will be verified
- Example: "CoinGecko API", "ESPN official score", "Election results"

### Step 4: Review and Create

1. Review all details carefully
2. Click "Create Market"
3. Approve transaction (includes creation fee)
4. Wait for confirmation
5. Your market is now live!

### Market Lifecycle

```
PENDING → OPEN → LOCKED → RESOLVED
   ↓         ↓        ↓         ↓
Created   Betting   Ended   Settled
```

1. **PENDING**: Just created, not yet open
2. **OPEN**: Accepting bets
3. **LOCKED**: End time reached, no more bets
4. **RESOLVED**: Outcome determined by oracles

---

## 🔐 Understanding Privacy

### What is Hidden?

- ✅ **Bet Amounts**: Your bet size is never revealed
- ✅ **Bet Side**: Whether you chose YES or NO
- ✅ **Position Size**: Your total exposure
- ✅ **Winnings**: Your payout amounts (until claimed)

### What is Public?

- ❌ **Market Exists**: Everyone knows the market exists
- ❌ **Total Volume**: Aggregate trading volume
- ❌ **Current Prices**: YES/NO probabilities
- ❌ **Your Address**: Your wallet address is public
- ❌ **Commitment**: A cryptographic hash (reveals nothing)

### How Privacy Works

**Pedersen Commitments**:
```
Your bet: 10,000 tokens on YES
↓
Generate commitment: Hash(10000 || YES || random_nonce)
↓
Store commitment: 0x7a8f3b2e...
↓
Others see: Just the hash, not the amounts!
```

**Zero-Knowledge Proofs**:
- Prove you have sufficient balance
- Without revealing your actual balance
- Cryptographically verified by smart contract

### When Privacy is Revealed

**Only when you claim winnings**:
- Your position details become known
- Required for payout calculation
- Happens after market is already resolved

**Why this matters**:
- Prevents front-running your trades
- No one knows your trading strategy
- Fair market pricing for everyone

---

## ❓ FAQ

### General Questions

**Q: What is a prediction market?**  
A: A market where you can bet on future events. Prices represent the crowd's prediction of probability.

**Q: How do I get tokens?**  
A: For testnet, use the faucet. For mainnet, buy from exchanges or participate in liquidity mining.

**Q: Are my funds safe?**  
A: Funds are secured by smart contracts on Midnight Network. Always verify contract addresses!

**Q: What happens if a market is cancelled?**  
A: All bets are refunded automatically.

### Betting Questions

**Q: What's the minimum bet?**  
A: Default is 1,000 tokens, but varies by market.

**Q: Can I change my bet after placing it?**  
A: No, bets are final. You can only exit by trading or waiting for settlement.

**Q: What if the price moves before my transaction confirms?**  
A: Your slippage tolerance protects you. Transaction fails if price moves too much.

**Q: How do I know if I'm winning?**  
A: Check your portfolio. It shows current value and P&L in real-time.

### P2P Wager Questions

**Q: What's the difference between AMM and P2P?**  
A: AMM trades against the pool with dynamic pricing. P2P matches you directly with another user at fixed odds.

**Q: Can I cancel my P2P wager?**  
A: Yes, but only before someone accepts it.

**Q: What if my P2P wager expires?**  
A: Funds are automatically returned to you.

### Resolution Questions

**Q: Who decides the outcome?**  
A: Decentralized oracles report outcomes based on verifiable data sources.

**Q: What if oracles disagree?**  
A: There's a dispute mechanism. Requires 3+ oracle consensus.

**Q: How long does resolution take?**  
A: Usually 24-48 hours after market end time.

**Q: What if I think the resolution is wrong?**  
A: During the dispute period, you can challenge with a stake.

### Privacy Questions

**Q: Can others see my bet amounts?**  
A: No! Amounts are hidden using zero-knowledge proofs.

**Q: Can I see other people's bets?**  
A: No, everyone's bets are private.

**Q: Does the platform see my bets?**  
A: The backend sees encrypted data, but cannot decrypt without your key.

**Q: When are my bets revealed?**  
A: Only when you claim winnings after settlement.

### Technical Questions

**Q: Which networks are supported?**  
A: Midnight Network (testnet and mainnet).

**Q: What wallets are supported?**  
A: Currently Lace wallet. More wallets coming soon!

**Q: Are there trading fees?**  
A: AMM bets have a 0.3% fee. P2P wagers have no fees.

**Q: Can I use this on mobile?**  
A: Yes! The web app is mobile-responsive. Native apps coming soon.

---

## 🆘 Need Help?

### Support Channels

- **Discord**: [discord.gg/shadowmarket](#)
- **Twitter**: [@ShadowMarket](#)
- **Email**: support@shadowmarket.io
- **Documentation**: [docs.shadowmarket.io](#)

### Report Bugs

Found a bug? Please report it:
1. Go to [GitHub Issues](#)
2. Click "New Issue"
3. Provide detailed description
4. Include screenshots if possible

### Feature Requests

Have an idea? We'd love to hear it:
- Join our Discord
- Share in #feature-requests channel
- Vote on existing requests

---

## 🎓 Pro Tips

1. **Start Small**: Test with small amounts first
2. **Diversify**: Don't put all your funds in one market
3. **Check Resolution Source**: Verify it's reliable
4. **Monitor Time**: Don't miss end times
5. **Use Stop Loss**: Consider when to exit losing positions
6. **Read Descriptions**: Understand resolution criteria
7. **Set Slippage Appropriately**: Balance between execution and protection
8. **Track Your Strategy**: Export data to analyze performance
9. **Join Community**: Learn from experienced traders
10. **Stay Updated**: Follow announcements for new features

---

**Version**: 1.0.0  
**Last Updated**: March 24, 2026  
**Questions?**: support@shadowmarket.io

Happy predicting! 🚀🌙
