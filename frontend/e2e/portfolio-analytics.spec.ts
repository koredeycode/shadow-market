import { test, expect } from '../fixtures';
import {
  mockApiResponse,
  createMockPosition,
  waitForPageLoad,
  clickAndWait,
  waitForToast,
} from '../helpers/test-helpers';

test.describe('Portfolio & Analytics', () => {
  test.describe('Portfolio Dashboard', () => {
    test('should display portfolio statistics', async ({ authenticatedPage: page }) => {
      const mockPortfolio = {
        activePositions: [
          createMockPosition({ id: '1', amount: '1000', side: 'yes' }),
          createMockPosition({ id: '2', amount: '500', side: 'no' }),
        ],
        settledPositions: [
          createMockPosition({
            id: '3',
            amount: '2000',
            isSettled: true,
            payout: '3000',
            profitLoss: '1000',
          }),
        ],
        stats: {
          totalValue: '5000',
          totalProfitLoss: '800',
          winRate: 65.5,
          totalBets: 10,
          totalWins: 7,
          totalLosses: 3,
          totalVolume: '15000',
          averageBetSize: '1500',
        },
      };

      await mockApiResponse(page, '**/api/positions', mockPortfolio);

      await page.goto('/portfolio');
      await waitForPageLoad(page);

      // Verify stat cards are displayed
      await expect(page.locator('text=/\\$5,000/')).toBeVisible(); // Total Value
      await expect(page.locator('text=/\\+\\$800/')).toBeVisible(); // P&L
      await expect(page.locator('text=/65\\.5%/')).toBeVisible(); // Win Rate
      await expect(page.locator('text=/\\$15,000/')).toBeVisible(); // Volume

      // Verify win/loss record
      await expect(page.locator('text=/7W.*3L/i')).toBeVisible();
    });

    test('should switch between active and settled positions tabs', async ({
      authenticatedPage: page,
    }) => {
      const mockPortfolio = {
        activePositions: [createMockPosition({ id: '1' })],
        settledPositions: [
          createMockPosition({ id: '2', isSettled: true, payout: '2000' }),
        ],
        stats: {
          totalValue: '5000',
          totalProfitLoss: '800',
          winRate: 65,
          totalBets: 10,
          totalWins: 7,
          totalLosses: 3,
          totalVolume: '15000',
          averageBetSize: '1500',
        },
      };

      await mockApiResponse(page, '**/api/positions', mockPortfolio);

      await page.goto('/portfolio');
      await waitForPageLoad(page);

      // Active positions tab should be selected by default
      await expect(page.getByRole('tab', { name: /active positions/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // Click Settled Positions tab
      await page.getByRole('tab', { name: /settled positions/i }).click();

      // Should show settled positions
      await expect(page.locator('text=/\\$2,000/')).toBeVisible(); // Payout
      await expect(page.getByRole('button', { name: /claim/i })).toBeVisible();
    });

    test('should display position cards correctly', async ({ authenticatedPage: page }) => {
      const mockPortfolio = {
        activePositions: [
          createMockPosition({
            id: '1',
            marketQuestion: 'Will BTC hit $100k?',
            side: 'yes',
            amount: '1000',
            entryPrice: 0.6,
            currentPrice: 0.65,
          }),
        ],
        settledPositions: [],
        stats: {
          totalValue: '1000',
          totalProfitLoss: '50',
          winRate: 50,
          totalBets: 2,
          totalWins: 1,
          totalLosses: 1,
          totalVolume: '2000',
          averageBetSize: '1000',
        },
      };

      await mockApiResponse(page, '**/api/positions', mockPortfolio);

      await page.goto('/portfolio');
      await waitForPageLoad(page);

      // Verify position details
      await expect(page.locator('text=/Will BTC hit \\$100k?/i')).toBeVisible();
      await expect(page.locator('text=/YES/i')).toBeVisible();
      await expect(page.locator('text=/\\$1,000/')).toBeVisible();
      await expect(page.locator('text=/60\\.0%/')).toBeVisible(); // Entry price
      await expect(page.locator('text=/65\\.0%/')).toBeVisible(); // Current price
    });

    test('should claim winnings from settled position', async ({ authenticatedPage: page }) => {
      const mockPortfolio = {
        activePositions: [],
        settledPositions: [
          createMockPosition({
            id: 'position-1',
            isSettled: true,
            payout: '2000',
            profitLoss: '1000',
          }),
        ],
        stats: {
          totalValue: '0',
          totalProfitLoss: '1000',
          winRate: 100,
          totalBets: 1,
          totalWins: 1,
          totalLosses: 0,
          totalVolume: '1000',
          averageBetSize: '1000',
        },
      };

      await mockApiResponse(page, '**/api/positions', mockPortfolio);
      await mockApiResponse(
        page,
        '**/api/wagers/position-1/claim',
        { success: true, amount: '2000', txHash: '0xabc...' },
        200
      );

      await page.goto('/portfolio');
      await waitForPageLoad(page);

      // Navigate to Settled Positions tab
      await page.getByRole('tab', { name: /settled positions/i }).click();

      // Click Claim button
      await clickAndWait(page, /claim.*\\$2,000/i, '**/api/wagers/position-1/claim');

      // Verify success
      await waitForToast(page, /successfully claimed/i);
    });

    test('should show portfolio value chart', async ({ authenticatedPage: page }) => {
      const mockPortfolio = {
        activePositions: [],
        settledPositions: [],
        stats: {
          totalValue: '5000',
          totalProfitLoss: '800',
          winRate: 65,
          totalBets: 10,
          totalWins: 7,
          totalLosses: 3,
          totalVolume: '15000',
          averageBetSize: '1500',
        },
      };

      const mockChartData = [
        { timestamp: '2026-03-20T00:00:00Z', totalValue: 4000, profitLoss: 500 },
        { timestamp: '2026-03-21T00:00:00Z', totalValue: 4500, profitLoss: 600 },
        { timestamp: '2026-03-22T00:00:00Z', totalValue: 5000, profitLoss: 800 },
      ];

      await mockApiResponse(page, '**/api/positions', mockPortfolio);
      await mockApiResponse(page, '**/api/analytics/portfolio-value*', mockChartData);

      await page.goto('/portfolio');
      await waitForPageLoad(page);

      // Chart should be visible
      await expect(page.locator('text=/portfolio value over time/i')).toBeVisible();
      
      // Time range selector should be visible
      await expect(page.getByRole('button', { name: /7d/i })).toBeVisible();
    });

    test('should export portfolio data', async ({ authenticatedPage: page }) => {
      const mockPortfolio = {
        activePositions: [],
        settledPositions: [],
        stats: {
          totalValue: '5000',
          totalProfitLoss: '800',
          winRate: 65,
          totalBets: 10,
          totalWins: 7,
          totalLosses: 3,
          totalVolume: '15000',
          averageBetSize: '1500',
        },
      };

      await mockApiResponse(page, '**/api/positions', mockPortfolio);

      // Mock CSV export
      await page.route('**/api/analytics/export/portfolio*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/csv',
          body: 'timestamp,value,pnl\n2026-03-20,4000,500\n',
        });
      });

      await page.goto('/portfolio');
      await waitForPageLoad(page);

      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /export data/i }).click();
      
      // Select time range if dropdown appears
      if (await page.getByText(/last 7 days/i).isVisible()) {
        await page.getByText(/last 7 days/i).click();
      }

      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toMatch(/portfolio.*\.csv/);
    });
  });

  test.describe('Analytics Dashboard', () => {
    test('should display platform statistics', async ({ page }) => {
      const mockStats = {
        totalVolume: '1000000',
        totalMarkets: 150,
        totalUsers: 5000,
        totalTrades: 10000,
        activeMarkets: 75,
        averageMarketVolume: '6666',
        totalValueLocked: '500000',
      };

      await mockApiResponse(page, '**/api/analytics/platform-stats', mockStats);
      await mockApiResponse(page, '**/api/analytics/market-volume*', []);
      await mockApiResponse(page, '**/api/analytics/top-markets*', []);
      await mockApiResponse(page, '**/api/analytics/top-traders*', []);
      await mockApiResponse(page, '**/api/analytics/categories', []);

      await page.goto('/analytics');
      await waitForPageLoad(page);

      // Verify platform stats
      await expect(page.locator('text=/\\$1,000,000/')).toBeVisible(); // Total Volume
      await expect(page.locator('text=/150/')).toBeVisible(); // Total Markets
      await expect(page.locator('text=/5,000/')).toBeVisible(); // Total Users
      await expect(page.locator('text=/\\$500,000/')).toBeVisible(); // TVL
    });

    test('should display top markets', async ({ page }) => {
      const mockTopMarkets = [
        { id: '1', question: 'BTC $100k?', category: 'Crypto', volume: 50000, totalPositions: 100 },
        { id: '2', question: 'ETH $10k?', category: 'Crypto', volume: 40000, totalPositions: 80 },
        { id: '3', question: 'AI AGI 2026?', category: 'Tech', volume: 30000, totalPositions: 60 },
      ];

      await mockApiResponse(page, '**/api/analytics/platform-stats', {
        totalVolume: '1000000',
        totalMarkets: 150,
        totalUsers: 5000,
        totalValueLocked: '500000',
      });
      await mockApiResponse(page, '**/api/analytics/market-volume*', []);
      await mockApiResponse(page, '**/api/analytics/top-markets*', mockTopMarkets);
      await mockApiResponse(page, '**/api/analytics/top-traders*', []);
      await mockApiResponse(page, '**/api/analytics/categories', []);

      await page.goto('/analytics');
      await waitForPageLoad(page);

      // Navigate to Top Markets tab
      await page.getByRole('tab', { name: /top markets/i }).click();

      // Verify markets are displayed
      await expect(page.locator('text=/BTC \\$100k?/')).toBeVisible();
      await expect(page.locator('text=/ETH \\$10k?/')).toBeVisible();
      await expect(page.locator('text=/AI AGI 2026?/')).toBeVisible();
    });

    test('should display top traders leaderboard', async ({ page }) => {
      const mockTopTraders = [
        {
          address: '0xabc123',
          username: 'trader1',
          totalVolume: 100000,
          profitLoss: 15000,
          winRate: 75,
          totalBets: 50,
        },
        {
          address: '0xdef456',
          username: 'trader2',
          totalVolume: 80000,
          profitLoss: 10000,
          winRate: 70,
          totalBets: 40,
        },
      ];

      await mockApiResponse(page, '**/api/analytics/platform-stats', {
        totalVolume: '1000000',
        totalMarkets: 150,
        totalUsers: 5000,
        totalValueLocked: '500000',
      });
      await mockApiResponse(page, '**/api/analytics/market-volume*', []);
      await mockApiResponse(page, '**/api/analytics/top-markets*', []);
      await mockApiResponse(page, '**/api/analytics/top-traders*', mockTopTraders);
      await mockApiResponse(page, '**/api/analytics/categories', []);

      await page.goto('/analytics');
      await waitForPageLoad(page);

      // Navigate to Top Traders tab
      await page.getByRole('tab', { name: /top traders/i }).click();

      // Verify traders are displayed
      await expect(page.locator('text=/trader1/')).toBeVisible();
      await expect(page.locator('text=/trader2/')).toBeVisible();
      await expect(page.locator('text=/75\\.0%/')).toBeVisible(); // Win rate
      await expect(page.locator('text=/\\+\\$15,000/')).toBeVisible(); // P&L
    });

    test('should display market volume chart', async ({ page }) => {
      const mockVolumeData = [
        { timestamp: '2026-03-20', volume: 50000, trades: 100, uniqueUsers: 50 },
        { timestamp: '2026-03-21', volume: 60000, trades: 120, uniqueUsers: 55 },
        { timestamp: '2026-03-22', volume: 70000, trades: 140, uniqueUsers: 60 },
      ];

      await mockApiResponse(page, '**/api/analytics/platform-stats', {
        totalVolume: '1000000',
        totalMarkets: 150,
        totalUsers: 5000,
        totalValueLocked: '500000',
      });
      await mockApiResponse(page, '**/api/analytics/market-volume*', mockVolumeData);
      await mockApiResponse(page, '**/api/analytics/top-markets*', []);
      await mockApiResponse(page, '**/api/analytics/top-traders*', []);
      await mockApiResponse(page, '**/api/analytics/categories', []);

      await page.goto('/analytics');
      await waitForPageLoad(page);

      // Chart should be visible
      await expect(page.locator('text=/market volume.*activity/i')).toBeVisible();
      
      // Time range buttons should be visible
      await expect(page.getByRole('button', { name: /24h/i })).toBeVisible();
    });
  });
});
