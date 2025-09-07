import { test, expect } from '@playwright/test';

test.describe('File Upload Tests', () => {
  test('should display upload form and upload a file', async ({ page }) => {
    await page.goto('/');

    // 等待頁面載入
    await page.waitForLoadState('networkidle');

    // 登入
    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('cloudsyncer2025');
    await page.getByRole('button', { name: /Login/i }).click();

    // 等待登入成功
    await expect(page.getByRole('heading', { name: /Files/i })).toBeVisible({ timeout: 10000 });

    // 檢查上傳按鈕存在
    await expect(page.getByRole('button', { name: /Upload File/i })).toBeVisible();

    // 點擊上傳按鈕
    await page.getByRole('button', { name: /Upload File/i }).click();

    // 檢查上傳表單出現
    await expect(page.locator('.upload-form')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible();

    // 選擇檔案並上傳
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-upload.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a test file for upload.')
    });

    // 點擊上傳
    await page.getByRole('button', { name: /Upload/i }).click();

    // 檢查上傳成功訊息
    await expect(page.getByText(/Upload successful/i)).toBeVisible();

    // 檢查檔案出現在列表中
    await expect(page.getByText('test-upload.txt')).toBeVisible();
  });

  test('should handle upload error', async ({ page }) => {
    await page.goto('/');

    // 登入
    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('cloudsyncer2025');
    await page.getByRole('button', { name: /Login/i }).click();

    // 等待登入成功
    await expect(page.getByRole('heading', { name: /Files/i })).toBeVisible({ timeout: 10000 });

    // 點擊上傳按鈕
    await page.getByRole('button', { name: /Upload File/i }).click();

    // 嘗試上傳過大的檔案（觸發錯誤）
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.alloc(10 * 1024 * 1024) // 10MB
    });

    await page.getByRole('button', { name: /Upload/i }).click();

    // 檢查錯誤訊息
    await expect(page.getByText(/Upload failed/i)).toBeVisible();
  });
});
