import { test, expect } from '../fixtures';
import {
  mockApiResponse,
  createMockMarket,
  waitForPageLoad,
  fillField,
  clickAndWait,
  waitForToast,
} from '../helpers/test-helpers';

test.describe('Betting Flow', () => {
  const mockMarket = createMockMarket();

  test.beforeEach(async ({ page }) => {
    await mockApiResponse(page, `**/api/markets/${mockMarket.id}`, mockMarket);
    await mockApiResponse(page, `**/api/markets/${mockMarket.id}/chart*`, []);
  });

  test.describe('Place AMM Bet', () => {
    test('should open place bet modal', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Click Place AMM Bet button
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Modal should be visible
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/place bet/i)).toBeVisible();
    });

    test('should place a YES bet successfully', async ({ authenticatedPage: page }) => {
      await mockApiResponse(
        page,
        '**/api/wagers',
        { wagerId: 'wager-123', success: true },
        201
      );

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Select YES
      await page.getByRole('button', { name: /yes/i }).click();

      // Enter amount
      await fillField(page, /amount/i, '100');

      // Set slippage
      const slippageSlider = page.locator('[data-testid="slippage-slider"]');
      await slippageSlider.fill('2');

      // Verify price estimation is shown
      await expect(page.locator('text=/estimated price/i')).toBeVisible();
      await expect(page.locator('text=/potential.*payout/i')).toBeVisible();

      // Submit bet
      await clickAndWait(page, /confirm bet/i, '**/api/wagers');

      // Verify success
      await waitForToast(page, /bet placed successfully/i);
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should place a NO bet successfully', async ({ authenticatedPage: page }) => {
      await mockApiResponse(
        page,
        '**/api/wagers',
        { wagerId: 'wager-124', success: true },
        201
      );

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Select NO
      await page.getByRole('button', { name: /^no$/i }).click();

      // Enter amount
      await fillField(page, /amount/i, '50');

      // Submit bet
      await clickAndWait(page, /confirm bet/i, '**/api/wagers');

      // Verify success
      await waitForToast(page, /bet placed successfully/i);
    });

    test('should use quick amount buttons', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Mock wallet balance
      await page.evaluate(() => {
        const balanceElement = document.querySelector('[data-testid="wallet-balance"]');
        if (balanceElement) {
          balanceElement.textContent = '1000';
        }
      });

      // Click 50% button
      await page.getByRole('button', { name: /50%/i }).click();

      // Amount should be half of balance
      const amountInput = page.getByLabel(/amount/i);
      await expect(amountInput).toHaveValue('500');

      // Click 100% button
      await page.getByRole('button', { name: /100%/i }).click();

      // Amount should be full balance
      await expect(amountInput).toHaveValue('1000');
    });

    test('should validate minimum bet amount', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Enter amount below minimum
      await fillField(page, /amount/i, '0.5');

      // Try to submit
      await page.getByRole('button', { name: /confirm bet/i }).click();

      // Should show validation error
      await expect(page.locator('text=/minimum.*bet/i')).toBeVisible();
    });

    test('should validate maximum bet amount', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Enter amount above maximum
      await fillField(page, /amount/i, '1000000');

      // Try to submit
      await page.getByRole('button', { name: /confirm bet/i }).click();

      // Should show validation error
      await expect(page.locator('text=/maximum.*bet/i')).toBeVisible();
    });

    test('should calculate price impact', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Select YES
      await page.getByRole('button', { name: /yes/i }).click();

      // Enter large amount
      await fillField(page, /amount/i, '10000');

      // Wait for calculations
      await page.waitForTimeout(500);

      // Price impact should be visible
      await expect(page.locator('text=/price impact/i')).toBeVisible();
      
      // Should show warning for high impact
      const impact = await page.locator('[data-testid="price-impact"]').textContent();
      if (impact && parseFloat(impact) > 5) {
        await expect(page.locator('text=/high.*price.*impact/i')).toBeVisible();
      }
    });

    test('should handle insufficient balance', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Mock low balance
      await page.evaluate(() => {
        localStorage.setItem('wallet_balance', '10');
      });

      // Enter amount higher than balance
      await fillField(page, /amount/i, '100');

      // Try to submit
      await page.getByRole('button', { name: /confirm bet/i }).click();

      // Should show insufficient balance error
      await expect(page.locator('text=/insufficient.*balance/i')).toBeVisible();
    });

    test('should close modal on cancel', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Modal should be visible
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click cancel
      await page.getByRole('button', { name: /cancel/i }).click();

      // Modal should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Bet Confirmation', () => {
    test('should show bet confirmation details', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /place amm bet/i }).click();

      // Select YES and enter amount
      await page.getByRole('button', { name: /yes/i }).click();
      await fillField(page, /amount/i, '100');

      // Wait for calculations
      await page.waitForTimeout(500);

      // Should show all confirmation details
      await expect(page.locator('text=/base price/i')).toBeVisible();
      await expect(page.locator('text=/estimated price/i')).toBeVisible();
      await expect(page.locator('text=/potential payout/i')).toBeVisible();
      await expect(page.locator('text=/potential profit/i')).toBeVisible();
      await expect(page.locator('text=/slippage/i')).toBeVisible();
    });
  });
});
