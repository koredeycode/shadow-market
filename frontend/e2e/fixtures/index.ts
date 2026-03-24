import { test as base } from '@playwright/test';

// Extend basic test by providing custom fixtures
export const test = base.extend({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Navigate to the app
    await page.goto('/');

    // Mock wallet connection
    await page.evaluate(() => {
      // Mock localStorage for wallet
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_address', '0x1234567890abcdef1234567890abcdef12345678');
      localStorage.setItem('authToken', 'mock-jwt-token');
    });

    // Reload to apply auth state
    await page.reload();
    await page.waitForLoadState('networkidle');

    await use(page);
  },
});

export { expect } from '@playwright/test';
