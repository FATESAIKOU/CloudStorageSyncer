import { test, expect } from '@playwright/test';

test.describe('LoginPage - Login Failure', () => {
  test('should show error message with incorrect credentials', async ({ page }) => {
    // 前往登入頁面
    await page.goto('http://localhost:5173');

    // 輸入錯誤的認證資訊
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'wrongpassword');

    // 點擊登入按鈕
    await page.click('button[type="submit"]');

    // 等待錯誤訊息出現
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-text')).toContainText('認證失敗');

    // 確認仍在登入頁面
    await expect(page.locator('.login-page')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Cloud Storage Syncer');
  });

  test('should show error message with empty credentials', async ({ page }) => {
    // 前往登入頁面
    await page.goto('http://localhost:5173');

    // 直接點擊登入按鈕，不輸入任何資訊
    await page.click('button[type="submit"]');

    // 等待錯誤訊息出現
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-text')).toContainText('請輸入帳號和密碼');
  });

  test('should show connection error when server is unreachable', async ({ page }) => {
    // 暫停 wiremock 來模擬伺服器無法連線
    await page.route('**/auth/verify', route => route.abort());

    // 前往登入頁面
    await page.goto('http://localhost:5173');

    // 輸入正確認證資訊
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'cloudsyncer2025');

    // 點擊登入按鈕
    await page.click('button[type="submit"]');

    // 等待連線錯誤訊息出現
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-text')).toContainText('連線失敗');
  });
});
