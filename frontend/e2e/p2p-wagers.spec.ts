import { expect, test } from '../fixtures';
import {
  clickAndWait,
  createMockMarket,
  fillField,
  mockApiResponse,
  waitForPageLoad,
  waitForToast,
} from '../helpers/test-helpers';

test.describe('P2P Wager Flow', () => {
  const mockMarket = createMockMarket();

  test.beforeEach(async ({ page }) => {
    await mockApiResponse(page, `**/api/markets/${mockMarket.id}`, mockMarket);
    await mockApiResponse(page, `**/api/markets/${mockMarket.id}/chart*`, []);
  });

  test.describe('Create P2P Wager', () => {
    test('should open create P2P wager modal', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Click Create P2P Wager button
      await page.getByRole('button', { name: /create p2p wager/i }).click();

      // Modal should be visible
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/create.*p2p.*wager/i)).toBeVisible();
    });

    test('should create P2P wager with custom odds', async ({ authenticatedPage: page }) => {
      await mockApiResponse(
        page,
        '**/api/wagers/p2p',
        { wagerId: 'p2p-wager-123', success: true },
        201
      );

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /create p2p wager/i }).click();

      // Select YES
      await page.getByRole('button', { name: /yes/i }).click();

      // Enter stake
      await fillField(page, /your stake/i, '100');

      // Enter custom odds (3:1)
      await fillField(page, /numerator/i, '3');
      await fillField(page, /denominator/i, '1');

      // Set duration
      await fillField(page, /duration/i, '24'); // 24 hours

      // Verify wager details are displayed
      await expect(page.locator('text=/your potential win/i')).toBeVisible();
      await expect(page.locator('text=/opponent needs/i')).toBeVisible();
      await expect(page.locator('text=/total pool/i')).toBeVisible();
      await expect(page.locator('text=/implied probability/i')).toBeVisible();

      // Submit wager
      await clickAndWait(page, /create wager/i, '**/api/wagers/p2p');

      // Verify success
      await waitForToast(page, /wager created successfully/i);
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should validate odds input', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /create p2p wager/i }).click();

      // Enter invalid odds (0:1)
      await fillField(page, /numerator/i, '0');
      await fillField(page, /denominator/i, '1');

      // Try to submit
      await page.getByRole('button', { name: /create wager/i }).click();

      // Should show validation error
      await expect(page.locator('text=/invalid.*odds/i')).toBeVisible();
    });

    test('should calculate implied probability correctly', async ({ authenticatedPage: page }) => {
      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Open modal
      await page.getByRole('button', { name: /create p2p wager/i }).click();

      // Enter odds 3:1 (should be 25% implied probability)
      await fillField(page, /numerator/i, '3');
      await fillField(page, /denominator/i, '1');

      // Wait for calculation
      await page.waitForTimeout(300);

      // Check implied probability
      const probability = await page.locator('[data-testid="implied-probability"]').textContent();
      expect(probability).toContain('25');
    });
  });

  test.describe('P2P Wagers List', () => {
    test('should display open P2P wagers', async ({ page }) => {
      const mockWagers = [
        {
          id: '1',
          creatorId: 'user-1',
          creatorSide: 'yes',
          amount: '100',
          odds: [3, 1],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          creatorId: 'user-2',
          creatorSide: 'no',
          amount: '200',
          odds: [2, 1],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        },
      ];

      await mockApiResponse(page, `**/api/wagers/p2p*`, mockWagers);

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Navigate to P2P Wagers tab
      await page.getByRole('tab', { name: /p2p wagers/i }).click();

      // Verify wagers are displayed
      await expect(page.locator('text=/3:1/i')).toBeVisible();
      await expect(page.locator('text=/2:1/i')).toBeVisible();
      await expect(page.locator('text=/\\$100/')).toBeVisible();
      await expect(page.locator('text=/\\$200/')).toBeVisible();
    });

    test('should show empty state when no wagers exist', async ({ page }) => {
      await mockApiResponse(page, `**/api/wagers/p2p*`, []);

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Navigate to P2P Wagers tab
      await page.getByRole('tab', { name: /p2p wagers/i }).click();

      // Should show empty state
      await expect(page.locator('text=/no open.*p2p.*wagers/i')).toBeVisible();
    });

    test('should accept a P2P wager', async ({ authenticatedPage: page }) => {
      const mockWager = {
        id: 'wager-1',
        creatorId: 'other-user',
        creatorSide: 'yes',
        amount: '100',
        odds: [3, 1],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await mockApiResponse(page, `**/api/wagers/p2p*`, [mockWager]);
      await mockApiResponse(
        page,
        `**/api/wagers/p2p/${mockWager.id}/accept`,
        { success: true },
        200
      );

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Navigate to P2P Wagers tab
      await page.getByRole('tab', { name: /p2p wagers/i }).click();

      // Click Accept button
      await clickAndWait(page, /accept/i, `**/api/wagers/p2p/${mockWager.id}/accept`);

      // Verify success
      await waitForToast(page, /wager accepted successfully/i);
    });

    test('should cancel own P2P wager', async ({ authenticatedPage: page }) => {
      const mockWager = {
        id: 'wager-2',
        creatorId: '0x1234567890abcdef1234567890abcdef12345678', // Same as authenticated user
        creatorSide: 'yes',
        amount: '100',
        odds: [3, 1],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await mockApiResponse(page, `**/api/wagers/p2p*`, [mockWager]);
      await mockApiResponse(page, `**/api/wagers/p2p/${mockWager.id}`, { success: true }, 200);

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Navigate to P2P Wagers tab
      await page.getByRole('tab', { name: /p2p wagers/i }).click();

      // Should show cancel button for own wager
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();

      // Click Cancel button
      await clickAndWait(page, /cancel/i, `**/api/wagers/p2p/${mockWager.id}`);

      // Verify success
      await waitForToast(page, /wager cancelled/i);
    });

    test('should not show accept button for own wager', async ({ authenticatedPage: page }) => {
      const mockWager = {
        id: 'wager-3',
        creatorId: '0x1234567890abcdef1234567890abcdef12345678', // Same as authenticated user
        creatorSide: 'yes',
        amount: '100',
        odds: [3, 1],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await mockApiResponse(page, `**/api/wagers/p2p*`, [mockWager]);

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Navigate to P2P Wagers tab
      await page.getByRole('tab', { name: /p2p wagers/i }).click();

      // Should NOT show accept button
      await expect(page.getByRole('button', { name: /^accept$/i })).not.toBeVisible();
      // Should show "Your Wager" indicator
      await expect(page.locator('text=/your wager/i')).toBeVisible();
    });

    test('should display time remaining correctly', async ({ page }) => {
      const expiresIn2Hours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const mockWager = {
        id: 'wager-4',
        creatorId: 'user-1',
        creatorSide: 'yes',
        amount: '100',
        odds: [3, 1],
        expiresAt: expiresIn2Hours,
      };

      await mockApiResponse(page, `**/api/wagers/p2p*`, [mockWager]);

      await page.goto(`/markets/${mockMarket.id}`);
      await waitForPageLoad(page);

      // Navigate to P2P Wagers tab
      await page.getByRole('tab', { name: /p2p wagers/i }).click();

      // Should show time remaining
      await expect(page.locator('text=/2h/i')).toBeVisible();
    });
  });
});
