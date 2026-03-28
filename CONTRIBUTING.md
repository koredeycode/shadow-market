# Contributing to ShadowMarket

Thank you for considering contributing to ShadowMarket! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Documentation Standards](#documentation-standards)
9. [Issue Guidelines](#issue-guidelines)
10. [Community](#community)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Examples of behavior that contributes to a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@shadowmarket.io. All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- [ ] Read the [README.md](./README.md)
- [ ] Completed the [Developer Setup Guide](./DEVELOPER_SETUP.md)
- [ ] Familiarized yourself with the [Architecture](./ARCHITECTURE.md)
- [ ] Joined our [Discord server](#)

### Finding Something to Work On

1. **Browse Issues**: Check [GitHub Issues](https://github.com/shadowmarket/issues)
2. **Good First Issues**: Look for `good-first-issue` label
3. **Help Wanted**: Check `help-wanted` label
4. **Feature Requests**: See `enhancement` label

### Claiming an Issue

1. Comment on the issue: "I'd like to work on this"
2. Wait for maintainer approval
3. Maintainer will assign you to the issue
4. Start working within 7 days (or it may be reassigned)

---

## Development Workflow

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/shadow-market.git
cd shadow-market

# Add upstream remote
git remote add upstream https://github.com/shadowmarket/shadow-market.git
```

### 2. Create a Branch

**Branch naming convention**:

```bash
# Features
git checkout -b feature/add-market-filters

# Bug fixes
git checkout -b fix/wallet-connection-error

# Documentation
git checkout -b docs/update-api-guide

# Refactoring
git checkout -b refactor/simplify-bet-modal
```

**Branch naming format**: `type/brief-description`

**Types**:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks
- `perf/` - Performance improvements

### 3. Make Your Changes

```bash
# Keep your branch updated
git fetch upstream
git rebase upstream/main

# Make changes
# ... edit files ...

# Check what changed
git status
git diff
```

### 4. Test Your Changes

```bash
# Run all tests
npm test --workspaces

# Test specific workspace
npm test --workspace=backend

# Run linter
npm run lint --workspaces

# Fix linting issues
npm run lint:fix --workspaces

# Type check
npm run type-check --workspaces
```

### 5. Commit Your Changes

See [Commit Guidelines](#commit-guidelines) below.

### 6. Push and Create PR

```bash
# Push to your fork
git push origin feature/add-market-filters

# Go to GitHub and create a Pull Request
```

---

## Coding Standards

### TypeScript Style Guide

**General Principles**:

- Write clear, readable code
- Prefer explicitness over cleverness
- Use TypeScript features (types, interfaces)
- Avoid `any` type

**Naming Conventions**:

```typescript
// Interface: PascalCase, prefix with I (optional)
interface Market {
  id: string;
  question: string;
}

// Type: PascalCase
type MarketStatus = 'OPEN' | 'LOCKED' | 'RESOLVED';

// Class: PascalCase
class MarketService {
  // Private fields: camelCase with # prefix
  #db: Database;

  // Public fields: camelCase
  public marketCount: number;

  // Methods: camelCase
  async createMarket(data: CreateMarketRequest): Promise<Market> {
    // ...
  }
}

// Constants: UPPER_SNAKE_CASE
const MAX_BET_AMOUNT = 1_000_000;
const DEFAULT_SLIPPAGE = 0.01;

// Variables and functions: camelCase
const marketId = '123';
function calculatePayout(amount: number): number {
  // ...
}

// Files: kebab-case
// market-service.ts
// place-bet-modal.tsx
```

**Code Organization**:

```typescript
// 1. Imports (grouped and sorted)
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui';
import { formatCurrency } from '@/utils';
import type { Market } from '@/types';

// 2. Types/Interfaces
interface Props {
  marketId: string;
  onBetPlaced: () => void;
}

// 3. Constants
const MIN_BET = 1000;

// 4. Component/Function
export function PlaceBetModal({ marketId, onBetPlaced }: Props) {
  // ...
}
```

**Function Guidelines**:

```typescript
// Prefer named parameters for > 2 arguments
// Bad
function createMarket(question: string, endTime: Date, category: string, minBet: number) {
  // ...
}

// Good
interface CreateMarketParams {
  question: string;
  endTime: Date;
  category: string;
  minBet: number;
}

function createMarket(params: CreateMarketParams) {
  // ...
}

// Use arrow functions for callbacks
// Good
markets.map(market => market.id);

// Document complex functions
/**
 * Calculates the payout for a winning bet using the AMM formula.
 *
 * @param betAmount - The amount wagered in tokens
 * @param entryPrice - The price at which the bet was placed (0-100)
 * @param side - The side bet on ('YES' or 'NO')
 * @returns The payout amount in tokens
 */
function calculatePayout(betAmount: number, entryPrice: number, side: 'YES' | 'NO'): number {
  // ...
}
```

**React Component Standards**:

```typescript
// Use function components (not class components)
// Use TypeScript for props
// Destructure props
// Use hooks appropriately

// Good
interface MarketCardProps {
  market: Market;
  onSelect: (id: string) => void;
}

export function MarketCard({ market, onSelect }: MarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onSelect(market.id);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <h3>{market.question}</h3>
      <p>{market.status}</p>
    </div>
  );
}
```

### Smart Contract Standards (Compact)

```compact
// Clear, descriptive names
circuit PredictionMarket {
  // Document state variables
  /// The current YES pool size in tokens
  state yesPool: Field;

  /// The current NO pool size in tokens
  state noPool: Field;

  // Document functions
  /// Places a bet on the specified side
  /// @param amount The bet amount in tokens
  /// @param side The side to bet on (true = YES, false = NO)
  /// @param commitment Pedersen commitment hiding the bet details
  function placeBet(
    amount: Field,
    side: Bool,
    commitment: Field
  ): Void {
    // Input validation
    assert(amount >= MIN_BET, "Bet amount too low");
    assert(amount <= MAX_BET, "Bet amount too high");

    // Logic...
  }
}
```

### File Structure

```
src/
  components/          # Reusable UI components
    ui/             # Base UI components (buttons, inputs)
    layout/         # Layout components (header, footer)
    features/       # Feature-specific components
  pages/              # Page components (routes)
  hooks/              # Custom React hooks
  utils/              # Utility functions
  types/              # TypeScript type definitions
  api/                # API client code
  stores/             # State management (Zustand)
  constants/          # App constants
  styles/             # Global styles
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Example**:

```
feat(frontend): add market filtering by category

- Add category filter dropdown to market browser
- Update MarketList component to filter by category
- Add tests for category filtering

Closes #123
```

### Commit Types

| Type       | Description                                      |
| ---------- | ------------------------------------------------ |
| `feat`     | New feature                                      |
| `fix`      | Bug fix                                          |
| `docs`     | Documentation changes                            |
| `style`    | Code style changes (formatting, no logic change) |
| `refactor` | Code refactoring                                 |
| `test`     | Adding or updating tests                         |
| `chore`    | Maintenance tasks                                |
| `perf`     | Performance improvements                         |
| `ci`       | CI/CD changes                                    |
| `build`    | Build system changes                             |
| `revert`   | Revert previous commit                           |

### Commit Scopes

| Scope       | Description             |
| ----------- | ----------------------- |
| `contracts` | Smart contract changes  |
| `backend`   | Backend API changes     |
| `frontend`  | Frontend UI changes     |
| `db`        | Database schema changes |
| `api`       | API endpoint changes    |
| `ui`        | UI component changes    |
| `deps`      | Dependency updates      |
| `config`    | Configuration changes   |

### Commit Message Guidelines

**DO**:

- Use imperative mood: "add feature" not "added feature"
- Keep subject line under 72 characters
- Capitalize the subject line
- No period at the end of subject
- Separate subject from body with blank line
- Reference issue numbers in footer

**DON'T**:

- Commit broken code
- Commit commented-out code
- Mix multiple concerns in one commit
- Use vague messages like "fix stuff"

**Examples**:

```bash
# Good commits
feat(backend): add P2P wager creation endpoint
fix(frontend): resolve wallet connection timeout issue
docs(api): update OpenAPI spec with new endpoints
test(contracts): add tests for Oracle dispute mechanism
refactor(backend): simplify market resolution logic

# Bad commits
Fixed bug
WIP
Updated files
asdfasdf
trying to fix issue
```

---

## Pull Request Process

### Before Submitting

**Checklist**:

- [ ] Code follows style guidelines
- [ ] All tests pass locally
- [ ] Added tests for new features
- [ ] Updated documentation
- [ ] Commit messages follow guidelines
- [ ] No merge conflicts with main
- [ ] PR description is complete

### PR Title Format

```
<type>(<scope>): <description>
```

**Examples**:

- `feat(frontend): add market category filters`
- `fix(backend): resolve race condition in bet placement`
- `docs: update deployment guide`

### PR Description Template

```markdown
## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues

Fixes #123
Closes #456

## Changes Made

- Bullet points describing changes
- What was added/modified/removed
- Why these changes were necessary

## Testing

Describe how you tested these changes:

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] All tests pass locally

## Screenshots (if applicable)

Before:
[screenshot]

After:
[screenshot]

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Additional Notes

Any additional information for reviewers.
```

### Review Process

1. **Automated Checks**:
   - CI/CD pipeline runs tests
   - Linter checks code style
   - Type checker validates types
   - Security scanner checks for vulnerabilities

2. **Code Review**:
   - At least 1 maintainer approval required
   - Address all review comments
   - Keep discussions respectful and constructive

3. **Changes Requested**:
   - Make requested changes
   - Push new commits to the same branch
   - Re-request review

4. **Approval**:
   - Once approved, maintainer will merge
   - PR will be squashed and merged
   - Branch will be deleted

### After Merge

- [ ] Delete your branch
- [ ] Update your local repository
- [ ] Close related issues (if not auto-closed)

```bash
# Update your local repo
git checkout main
git pull upstream main
git push origin main

# Delete local branch
git branch -d feature/add-market-filters

# Delete remote branch (if not auto-deleted)
git push origin --delete feature/add-market-filters
```

---

## Testing Requirements

### Test Coverage Goals

- **Contracts**: 90%+ coverage
- **Backend**: 80%+ coverage
- **Frontend**: 70%+ coverage

### Writing Tests

**Unit Tests** (contracts, backend, frontend):

```typescript
import { describe, it, expect } from 'vitest';
import { calculatePayout } from './utils';

describe('calculatePayout', () => {
  it('should calculate correct payout for YES bet', () => {
    const result = calculatePayout(10000, 65, 'YES');
    expect(result).toBe(15384);
  });

  it('should throw error for invalid amount', () => {
    expect(() => calculatePayout(-100, 50, 'YES')).toThrow();
  });
});
```

**Integration Tests** (backend):

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/markets', () => {
  it('should create a new market', async () => {
    const response = await request(app)
      .post('/api/markets')
      .send({
        question: 'Will it rain tomorrow?',
        endTime: '2026-12-31T23:59:59Z',
        category: 'WEATHER',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.question).toBe('Will it rain tomorrow?');
  });
});
```

**Component Tests** (frontend):

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MarketCard } from './MarketCard';

describe('MarketCard', () => {
  it('should render market question', () => {
    const market = {
      id: '123',
      question: 'Will Bitcoin reach $100k?',
      status: 'OPEN',
    };

    render(<MarketCard market={market} onSelect={() => {}} />);
    expect(screen.getByText('Will Bitcoin reach $100k?')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn();
    const market = { id: '123', question: 'Test', status: 'OPEN' };

    render(<MarketCard market={market} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Test'));

    expect(onSelect).toHaveBeenCalledWith('123');
  });
});
```

### Running Tests

```bash
# All tests
npm test --workspaces

# Watch mode
npm test --workspace=frontend -- --watch

# Coverage
npm run test:coverage --workspaces

# Specific file
npm test --workspace=backend -- markets.test.ts
```

---

## Documentation Standards

### Code Documentation

**TypeScript/JavaScript**:

````typescript
/**
 * Calculates the expected payout for a bet using the AMM formula.
 *
 * The payout is calculated as: payout = (betAmount / entryPrice) * 100
 * for YES bets, or (betAmount / (100 - entryPrice)) * 100 for NO bets.
 *
 * @param betAmount - The amount wagered in tokens
 * @param entryPrice - The price at which the bet was placed (0-100)
 * @param side - The side bet on ('YES' or 'NO')
 * @returns The expected payout in tokens
 * @throws {Error} If betAmount is negative or entryPrice is out of range
 *
 * @example
 * ```typescript
 * const payout = calculatePayout(10000, 65, 'YES');
 * console.log(payout); // 15384
 * ```
 */
export function calculatePayout(betAmount: number, entryPrice: number, side: 'YES' | 'NO'): number {
  // Validation
  if (betAmount < 0) throw new Error('Bet amount must be positive');
  if (entryPrice < 0 || entryPrice > 100) throw new Error('Invalid entry price');

  // Calculate payout
  if (side === 'YES') {
    return (betAmount / entryPrice) * 100;
  } else {
    return (betAmount / (100 - entryPrice)) * 100;
  }
}
````

**React Components**:

````typescript
/**
 * Displays a market card with question, price, and status.
 *
 * @component
 * @example
 * ```tsx
 * <MarketCard
 *   market={market}
 *   onSelect={(id) => navigate(`/market/${id}`)}
 * />
 * ```
 */
export function MarketCard({ market, onSelect }: MarketCardProps) {
  // ...
}
````

### Documentation Files

**README.md**: Project overview and quick start  
**ARCHITECTURE.md**: System design and architecture  
**API.md**: API documentation  
**DEVELOPER_SETUP.md**: Development environment setup  
**DEPLOYMENT.md**: Production deployment  
**CONTRIBUTING.md**: This file  
**USER_GUIDE.md**: End-user documentation

### Keeping Documentation Updated

- Update docs when changing functionality
- Add JSDoc comments for public APIs
- Update OpenAPI spec when changing endpoints
- Add examples for complex features
- Keep README badges updated

---

## Issue Guidelines

### Creating Issues

**Use Templates**:

- Bug Report
- Feature Request
- Documentation Improvement
- Question

**Bug Report Template**:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**

- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

**Feature Request Template**:

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Issue Labels

| Label              | Description                      |
| ------------------ | -------------------------------- |
| `bug`              | Something isn't working          |
| `enhancement`      | New feature or request           |
| `documentation`    | Documentation improvements       |
| `good-first-issue` | Good for newcomers               |
| `help-wanted`      | Extra attention is needed        |
| `question`         | Further information is requested |
| `wontfix`          | This will not be worked on       |
| `duplicate`        | This issue already exists        |
| `priority-high`    | High priority                    |
| `priority-low`     | Low priority                     |

---

## � Community

### Communication Channels

- **Discord**: [discord.gg/shadowmarket](#) - General discussion, help
- **GitHub Discussions**: [github.com/shadowmarket/discussions](#) - Feature requests, Q&A
- **Twitter**: [@ShadowMarket](#) - Announcements, updates
- **Email**: contribute@shadowmarket.io - Direct contact

### Getting Help

1. Check existing documentation
2. Search closed issues
3. Ask in Discord #support
4. Create a GitHub issue

### Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to contributor calls
- Eligible for contributor rewards (if applicable)

---

## � License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Thank You!

Thank you for contributing to ShadowMarket! Your efforts make this project better for everyone.

**Questions?** Reach out on [Discord](#) or email contribute@shadowmarket.io

---

**Version**: 1.0.0  
**Last Updated**: March 24, 2026
