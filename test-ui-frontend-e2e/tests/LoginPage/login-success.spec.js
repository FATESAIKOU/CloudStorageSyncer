import { test, expect } from '@playwright/test';

test.describe('LoginPage - Login Success', () => {
  test('should login successfully with correct credentials', async ({ page }) => {
    // 前往登入頁面
    await page.goto('http://localhost:5173');

    // 確認在登入頁面
    await expect(page.locator('h1')).toHaveText('Cloud Storage Syncer');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // 輸入正確的認證資訊
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'cloudsyncer2025');

    // 點擊登入按鈕
    await page.click('button[type="submit"]');

    // 等待導向檔案列表頁面
    await expect(page.locator('.file-list-page')).toBeVisible();
    await expect(page.locator('.header-title')).toHaveText('Cloud Storage Syncer');
    await expect(page.locator('.username')).toContainText('admin');

    // 確認檔案列表已載入
    await expect(page.locator('.file-list')).toBeVisible();
  });

  test('should persist login state after page refresh', async ({ page }) => {
    // 先登入
    await page.goto('http://localhost:5173');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'cloudsyncer2025');
    await page.click('button[type="submit"]');

    // 確認已登入
    await expect(page.locator('.file-list-page')).toBeVisible();

    // 重新載入頁面
    await page.reload();

    // 確認仍然在檔案列表頁面，沒有被導回登入頁
    await expect(page.locator('.file-list-page')).toBeVisible();
    await expect(page.locator('.username')).toContainText('admin');
  });
});
