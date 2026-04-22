import { test, expect } from '@playwright/test';

test('starts a game and allows keyboard moves', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.logo')).toHaveText('2048');

  const tileCount = await page.locator('.tile').count();
  expect(tileCount).toBe(2);

  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);

  const newTileCount = await page.locator('.tile').count();
  expect(newTileCount).toBeGreaterThanOrEqual(2);
});

test('new game resets the board', async ({ page }) => {
  await page.goto('/');
  await page.click('#btn-new');
  await page.waitForTimeout(200);
  const tileCount = await page.locator('.tile').count();
  expect(tileCount).toBe(2);
});

test('undo and strategy selector are hidden by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#btn-undo')).toHaveCount(0);
  await expect(page.locator('#ai-strategy')).toHaveCount(0);
});
