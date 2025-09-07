import { test, expect } from '@playwright/test';

test.describe('Basic Login Test', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/');

    // 等待頁面載入
    await page.waitForLoadState('networkidle');

    // 檢查登入表單是否存在
    await expect(page.getByRole('heading', { name: /Cloud Storage Syncer/i })).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
  });

  test('should login and show file list', async ({ page }) => {
    await page.goto('/');

    // 等待頁面載入
    await page.waitForLoadState('networkidle');

    // 填寫登入表單
    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('cloudsyncer2025');

    // 點擊登入按鈕
    await page.getByRole('button', { name: /Login/i }).click();

    // 等待登入成功，應該看到文件列表
    await expect(page.getByRole('heading', { name: /Files/i })).toBeVisible({ timeout: 10000 });

    // 檢查是否有文件顯示
    await expect(page.getByText(/test-file-1.txt/i)).toBeVisible();
    await expect(page.getByText(/documents\/report.pdf/i)).toBeVisible();
    await expect(page.getByText(/images\/photo.jpg/i)).toBeVisible();
  });
});
