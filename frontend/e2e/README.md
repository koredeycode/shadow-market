# End-to-End Testing Guide

This directory contains comprehensive end-to-end tests for the ShadowMarket frontend application using Playwright.

## 📁 Structure

```
e2e/
├── fixtures/           # Custom test fixtures
│   └── index.ts       # Authenticated page fixture
├── helpers/            # Test helper functions
│   └── test-helpers.ts # Common test utilities
├── markets.spec.ts     # Market browsing and creation tests
├── betting.spec.ts     # AMM betting flow tests
├── p2p-wagers.spec.ts  # P2P wager tests
└── portfolio-analytics.spec.ts # Portfolio and analytics tests
```

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install --with-deps
```

### Run All Tests

```bash
# Run all tests in headless mode
pnpm test:e2e

# Run tests in headed mode (see browser)
pnpm exec playwright test --headed

# Run tests in UI mode (interactive)
pnpm exec playwright test --ui
```

### Run Specific Tests

```bash
# Run tests from a specific file
pnpm exec playwright test markets.spec.ts

# Run tests matching a title
pnpm exec playwright test --grep "should display markets list"

# Run tests in a specific browser
pnpm exec playwright test --project=chromium
```

### Debug Tests

```bash
# Run in debug mode
pnpm exec playwright test --debug

# Run specific test in debug mode
pnpm exec playwright test markets.spec.ts --debug
```

## 📋 Test Coverage

### Markets Flow (markets.spec.ts)

- ✅ Display markets list
- ✅ Filter markets by category
- ✅ Search markets
- ✅ Sort markets by volume
- ✅ Display market detail page
- ✅ Navigate between tabs
- ✅ Real-time price updates
- ✅ Create new market
- ✅ Validate market creation form
- ✅ Authentication checks

### Betting Flow (betting.spec.ts)

- ✅ Open place bet modal
- ✅ Place YES bet
- ✅ Place NO bet
- ✅ Use quick amount buttons (25%, 50%, 75%, 100%)
- ✅ Validate minimum bet amount
- ✅ Validate maximum bet amount
- ✅ Calculate price impact
- ✅ Handle insufficient balance
- ✅ Show bet confirmation details
- ✅ Close modal on cancel

### P2P Wagers (p2p-wagers.spec.ts)

- ✅ Open create P2P wager modal
- ✅ Create P2P wager with custom odds
- ✅ Validate odds input
- ✅ Calculate implied probability
- ✅ Display open P2P wagers
- ✅ Show empty state
- ✅ Accept P2P wager
- ✅ Cancel own P2P wager
- ✅ Hide accept button for own wagers
- ✅ Display time remaining

### Portfolio & Analytics (portfolio-analytics.spec.ts)

- ✅ Display portfolio statistics
- ✅ Switch between active/settled positions tabs
- ✅ Display position cards
- ✅ Claim winnings
- ✅ Show portfolio value chart
- ✅ Export portfolio data
- ✅ Display platform statistics
- ✅ Show top markets
- ✅ Show top traders leaderboard
- ✅ Display market volume chart

## 🔧 Configuration

### playwright.config.ts

Key configuration options:

- **Base URL**: `http://localhost:5173` (Vite dev server)
- **Browsers**: chromium, firefox, webkit, mobile chrome, mobile safari
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML, JSON, JUnit
- **Traces**: On first retry
- **Screenshots**: On failure only
- **Videos**: Retain on failure

### Environment Variables

```bash
# Frontend URL (default: http://localhost:5173)
BASE_URL=http://localhost:5173

# API URL for mocking
VITE_API_URL=http://localhost:3000
```

## 📝 Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../fixtures';
import { mockApiResponse, waitForPageLoad } from '../helpers/test-helpers';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange: Setup mocks
    await mockApiResponse(page, '**/api/endpoint', { data: 'mock' });

    // Act: Navigate and interact
    await page.goto('/path');
    await page.getByRole('button', { name: /click me/i }).click();

    // Assert: Verify results
    await expect(page.locator('text=/success/i')).toBeVisible();
  });
});
```

### Using Authenticated Fixture

```typescript
test('should access protected page', async ({ authenticatedPage: page }) => {
  // Page is already authenticated
  await page.goto('/portfolio');
  await expect(page.getByText(/your positions/i)).toBeVisible();
});
```

### Helper Functions

```typescript
// Mock API response
await mockApiResponse(page, '**/api/markets', { markets: [] });

// Fill form field
await fillField(page, /email/i, 'test@example.com');

// Click and wait for response
await clickAndWait(page, /submit/i, '**/api/submit');

// Wait for toast notification
await waitForToast(page, /success/i);

// Create mock data
const market = createMockMarket({ id: '1', question: 'Test?' });
```

## 🐛 Debugging

### View Test Report

```bash
# Generate and open HTML report
pnpm exec playwright show-report
```

### Inspect Element Selectors

```bash
# Open Playwright Inspector
pnpm exec playwright codegen http://localhost:5173
```

### View Traces

```bash
# Open trace viewer
pnpm exec playwright show-trace trace.zip
```

### Screenshots

Failed tests automatically capture screenshots in `test-results/`

## 🔍 Best Practices

1. **Use Data Attributes**: Add `data-testid` to elements for stable selectors
2. **Wait for Network Idle**: Use `waitForPageLoad()` after navigation
3. **Mock API Calls**: Always mock external API calls for deterministic tests
4. **Test User Flows**: Focus on complete user journeys, not just individual components
5. **Accessibility**: Use semantic selectors (`getByRole`, `getByLabel`)
6. **Avoid Hard Waits**: Use `waitForSelector` instead of `waitForTimeout` when possible
7. **Clean State**: Each test should be independent and not rely on previous tests

## 📊 CI/CD Integration

Tests run automatically on:

- Push to `main`, `master`, or `develop` branches
- Pull requests to these branches

GitHub Actions workflow: `.github/workflows/e2e-tests.yml`

Artifacts generated:

- HTML test report (retained for 30 days)
- Screenshots of failed tests (retained for 7 days)

## 🚨 Troubleshooting

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Flaky tests

- Add explicit waits for dynamic content
- Mock time-dependent data
- Use `toBeVisible()` instead of `toBeTruthy()` for DOM checks

### Browser not launching

```bash
# Reinstall browsers
pnpm exec playwright install --with-deps
```

### API mocks not working

- Verify route patterns match actual URLs
- Check response format matches expected shape
- Use `page.route()` before navigation

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors Guide](https://playwright.dev/docs/selectors)
