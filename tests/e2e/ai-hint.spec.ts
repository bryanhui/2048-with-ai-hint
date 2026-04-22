import { test, expect } from '@playwright/test';

test('AI hint highlights a direction and shows strategy info', async ({ page }) => {
  await page.goto('/');

  await page.click('#btn-hint');
  await page.waitForTimeout(300);

  const hint = page.locator('#hint-arrow');
  await expect(hint).not.toHaveClass(/hidden/);
  const dir = await hint.getAttribute('data-dir');
  expect(['up', 'down', 'left', 'right']).toContain(dir);

  const toast = page.locator('#hint-toast');
  await expect(toast).not.toHaveClass(/hidden/);
  await expect(toast).toContainText('Expectimax');
  await expect(toast).toContainText('Best:');
  await expect(toast).toContainText('2nd:');
});
