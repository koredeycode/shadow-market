import { expect, test } from '../fixtures';
import {
  clickAndWait,
  createMockMarket,
  fillField,
  mockApiResponse,
  waitForPageLoad,
  waitForToast,
} from '../helpers/test-helpers';

test.describe('Markets Flow', () => {
  test.describe('Market Browsing', () => {
    test('should display markets list', async ({ page }) => {
      const mockMarkets = [
        createMockMarket({ id: '1', question: 'Will BTC hit $100k?' }),
        createMockMarket({ id: '2', question: 'Will ETH hit $10k?', yesPrice: 0.45 }),
        createMockMarket({ id: '3', question: 'Will SOL hit $500?', yesPrice: 0.75 }),
      ];

      await mockApiResponse(page, '**/api/markets*', { markets: mockMarkets });

      await page.goto('/markets');
      await waitForPageLoad(page);

      // Verify all markets are displayed
      for (const market of mockMarkets) {
        await expect(page.getByText(market.question)).toBeVisible();
      }
    });

    test('should filter markets by category', async ({ page }) => {
      const cryptoMarket = createMockMarket({ id: '1', category: 'Crypto' });
      const sportsMarket = createMockMarket({
        id: '2',
        category: 'Sports',
        question: 'Who will win?',
      });

      await mockApiResponse(page, '**/api/markets*', { markets: [cryptoMarket, sportsMarket] });

      await page.goto('/markets');
      await waitForPageLoad(page);

      // Click crypto filter
      await page.getByRole('button', { name: /crypto/i }).click();
      await page.waitForTimeout(500);

      // Should show crypto market
      await expect(page.getByText(cryptoMarket.question)).toBeVisible();
      // Should hide sports market
      await expect(page.getByText(sportsMarket.question)).not.toBeVisible();
    });

    test('should search markets', async ({ page }) => {
      const btcMarket = createMockMarket({ id: '1', question: 'BTC price prediction' });
      const ethMarket = createMockMarket({ id: '2', question: 'ETH price prediction' });

      await mockApiResponse(page, '**/api/markets*', { markets: [btcMarket, ethMarket] });

      await page.goto('/markets');
      await waitForPageLoad(page);

      // Search for BTC
      await fillField(page, /search/i, 'BTC');
      await page.waitForTimeout(500);

      // Should show BTC market
      await expect(page.getByText(btcMarket.question)).toBeVisible();
      // Should hide ETH market
      await expect(page.getByText(ethMarket.question)).not.toBeVisible();
    });

    test('should sort markets by volume', async ({ page }) => {
      const highVolumeMarket = createMockMarket({ id: '1', totalVolume: '100000' });
      const lowVolumeMarket = createMockMarket({ id: '2', totalVolume: '1000' });

      await mockApiResponse(page, '**/api/markets*', {
        markets: [highVolumeMarket, lowVolumeMarket],
      });

      await page.goto('/markets');
      await waitForPageLoad(page);

      // Click sort dropdown
      await page.click('text=Sort by');
      await page.click('text=Volume');
      await page.waitForTimeout(500);

      // Verify order (high volume first)
      const cards = await page.locator('[data-testid="market-card"]').all();
      const firstCardVolume = await cards[0].locator('text=/\\$100[,.]000/').textContent();
      expect(firstCardVolume).toBeTruthy();
    });
  });

  test.describe('Market Detail', () => {
    test('should display market detail page', async ({ page }) => {
      const mockMarket = createMockMarket();

      await mockApiResponse(page, `**/api/markets/${mockMarket.id}`, mockMarket);
      await mockApiResponse(page, `**/api/markets/${mockMarket.id}/chart*`, []);

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Verify market details are displayed
      await expect(page.getByRole('heading', { name: mockMarket.question })).toBeVisible();
      await expect(page.getByText(/65%/)).toBeVisible(); // YES price
      await expect(page.getByText(/35%/)).toBeVisible(); // NO price
      await expect(page.getByText(/\\$50,000/)).toBeVisible(); // Volume
    });

    test('should navigate between tabs', async ({ page }) => {
      const mockMarket = createMockMarket();

      await mockApiResponse(page, `**/api/markets/${mockMarket.id}`, mockMarket);
      await mockApiResponse(page, `**/api/markets/${mockMarket.id}/chart*`, []);

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Click Chart tab
      await page.getByRole('tab', { name: /chart/i }).click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=/price history/i')).toBeVisible();

      // Click P2P Wagers tab
      await page.getByRole('tab', { name: /p2p wagers/i }).click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=/open.*wagers/i')).toBeVisible();

      // Click Order Book tab
      await page.getByRole('tab', { name: /order book/i }).click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=/orders/i')).toBeVisible();
    });

    test('should update prices in real-time', async ({ page }) => {
      const mockMarket = createMockMarket();

      await mockApiResponse(page, `**/api/markets/${mockMarket.id}`, mockMarket);
      await mockApiResponse(page, `**/api/markets/${mockMarket.id}/chart*`, []);

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Initial price
      const initialPrice = await page.locator('text=/65%/').first().textContent();
      expect(initialPrice).toContain('65');

      // Simulate WebSocket price update
      await page.evaluate(() => {
        window.dispatchEvent(
          new CustomEvent('market:update', {
            detail: { marketId: 'market-1', yesPrice: 0.7, noPrice: 0.3 },
          })
        );
      });

      await page.waitForTimeout(500);

      // Updated price
      await expect(page.locator('text=/70%/').first()).toBeVisible();
    });
  });

  test.describe('Market Creation', () => {
    test('should create a new market', async ({ authenticatedPage: page }) => {
      await mockApiResponse(
        page,
        '**/api/markets',
        { marketId: 'new-market-123', status: 'created' },
        201
      );

      await page.goto('/markets/create');
      await waitForPageLoad(page);

      // Fill in market details
      await fillField(page, /question/i, 'Will AI surpass human intelligence?');
      await fillField(page, /description/i, 'Prediction about AGI development');

      // Select category
      await page.click('[data-testid="category-select"]');
      await page.click('text=Technology');

      // Set end date (30 days from now)
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const dateString = futureDate.toISOString().split('T')[0];
      await fillField(page, /end date/i, dateString);

      // Set betting limits
      await fillField(page, /minimum bet/i, '10');
      await fillField(page, /maximum bet/i, '10000');

      // Set resolution source
      await fillField(page, /resolution source/i, 'Official AI benchmark');

      // Submit form
      await clickAndWait(page, /create market/i, '**/api/markets');

      // Verify success
      await waitForToast(page, /market created successfully/i);
      await expect(page).toHaveURL(/\/markets\/new-market-123/);
    });

    test('should validate required fields', async ({ authenticatedPage: page }) => {
      await page.goto('/markets/create');
      await waitForPageLoad(page);

      // Try to submit without filling fields
      await page.getByRole('button', { name: /create market/i }).click();

      // Should show validation errors
      await expect(page.locator('text=/required/i').first()).toBeVisible();
    });

    test('should prevent unauthenticated users from creating markets', async ({ page }) => {
      await page.goto('/markets/create');
      await waitForPageLoad(page);

      // Should redirect to home or show auth prompt
      await expect(page.getByText(/connect.*wallet/i)).toBeVisible();
    });
  });
});
