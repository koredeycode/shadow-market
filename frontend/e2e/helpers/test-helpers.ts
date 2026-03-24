import { Page, expect } from '@playwright/test';

/**
 * Helper to mock API responses
 */
export async function mockApiResponse(
  page: Page,
  url: string | RegExp,
  response: any,
  status: number = 200
) {
  await page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Helper to wait for navigation and network idle
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Helper to connect wallet
 */
export async function connectWallet(page: Page) {
  // Click connect wallet button
  await page.getByRole('button', { name: /connect wallet/i }).click();

  // Wait for wallet modal or connection confirmation
  await page.waitForTimeout(1000);

  // Verify connection
  await expect(page.getByText(/0x[0-9a-f]+/i)).toBeVisible();
}

/**
 * Helper to navigate to a specific page
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForPageLoad(page);
}

/**
 * Helper to fill form field
 */
export async function fillField(page: Page, label: string, value: string) {
  const field = page.getByLabel(label);
  await field.clear();
  await field.fill(value);
}

/**
 * Helper to wait for toast notification
 */
export async function waitForToast(page: Page, message?: string) {
  const toast = page.locator('[role="alert"], .toast, [class*="toast"]').first();
  await expect(toast).toBeVisible({ timeout: 5000 });

  if (message) {
    await expect(toast).toContainText(message);
  }

  return toast;
}

/**
 * Helper to click button and wait for response
 */
export async function clickAndWait(
  page: Page,
  buttonText: string,
  waitForResponse?: string | RegExp
) {
  const button = page.getByRole('button', { name: new RegExp(buttonText, 'i') });

  if (waitForResponse) {
    const [response] = await Promise.all([page.waitForResponse(waitForResponse), button.click()]);
    return response;
  } else {
    await button.click();
  }
}

/**
 * Helper to create a mock market
 */
export function createMockMarket(overrides?: Partial<any>) {
  return {
    id: 'market-1',
    question: 'Will BTC hit $100k by EOY 2026?',
    description: 'Bitcoin price prediction market',
    category: 'Crypto',
    tags: ['BTC', 'crypto', 'price'],
    yesPrice: 0.65,
    noPrice: 0.35,
    totalVolume: '50000',
    totalLiquidity: '100000',
    totalPositions: 42,
    status: 'open',
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    creator: {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      username: 'testuser',
    },
    ...overrides,
  };
}

/**
 * Helper to create a mock position
 */
export function createMockPosition(overrides?: Partial<any>) {
  return {
    id: 'position-1',
    marketId: 'market-1',
    marketQuestion: 'Will BTC hit $100k by EOY 2026?',
    side: 'yes',
    amount: '1000',
    entryPrice: 0.6,
    currentPrice: 0.65,
    entryTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isSettled: false,
    marketStatus: 'open',
    marketEndTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Helper to take screenshot with name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}
