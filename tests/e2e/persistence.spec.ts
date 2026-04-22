import { test, expect } from '@playwright/test';

test('restores game after page reload', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);

  const scoreBefore = await page.locator('#score').textContent();

  await page.reload();
  await page.waitForTimeout(200);

  const scoreAfter = await page.locator('#score').textContent();
  expect(scoreAfter).toBe(scoreBefore);
});
