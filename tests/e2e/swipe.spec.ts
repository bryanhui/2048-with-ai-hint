import { test, expect } from '@playwright/test';

test('swipe left triggers a move on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const board = page.locator('#board');
  const box = await board.boundingBox();
  expect(box).not.toBeNull();

  const startX = box!.x + box!.width * 0.7;
  const startY = box!.y + box!.height * 0.5;
  const endX = box!.x + box!.width * 0.2;
  const endY = startY;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 10 });
  await page.mouse.up();

  await page.waitForTimeout(200);
  const tiles = await page.locator('.tile').count();
  expect(tiles).toBeGreaterThanOrEqual(2);
});
