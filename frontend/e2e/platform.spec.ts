import { test, expect } from '@playwright/test';

test.describe('IELTS JANA Platform', () => {
  test('landing page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/IELTS/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('mock test page loads', async ({ page }) => {
    await page.goto('/mock');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/(mock|login)/);
  });

  test('practice page loads', async ({ page }) => {
    await page.goto('/practice');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/(practice|login)/);
  });

  test('vocabulary page loads', async ({ page }) => {
    await page.goto('/vocabulary');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/(vocabulary|login)/);
  });
});
