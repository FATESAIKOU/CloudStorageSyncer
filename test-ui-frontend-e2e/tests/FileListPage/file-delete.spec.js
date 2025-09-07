import { test, expect } from '@playwright/test';

test.describe('FileOperations - File Delete', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('http://localhost:5173');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'cloudsyncer2025');
    await page.click('button[type="submit"]');
    await expect(page.locator('.file-list-page')).toBeVisible();
  });

  test('should show delete confirmation modal', async ({ page }) => {
    // 等待檔案列表載入
    await expect(page.locator('.file-list')).toBeVisible();

    // 找到第一個檔案項目
    const firstFile = page.locator('.file-item.file').first();

    // 懸停以顯示操作按鈕
    await firstFile.hover();

    // 點擊刪除按鈕
    await firstFile.locator('.action-button.delete').click();

    // 確認刪除確認對話框出現
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-content h3')).toHaveText('確認刪除');
    await expect(page.locator('.delete-warning')).toContainText('您確定要刪除此檔案嗎？');
    await expect(page.locator('.file-name')).toHaveText('example.txt');

    // 確認有取消和確認按鈕
    await expect(page.locator('.btn-secondary')).toHaveText('取消');
    await expect(page.locator('.btn-danger')).toHaveText('確認刪除');
  });

  test('should cancel delete operation', async ({ page }) => {
    // 觸發刪除確認對話框
    const firstFile = page.locator('.file-item.file').first();
    await firstFile.hover();
    await firstFile.locator('.action-button.delete').click();

    // 確認對話框出現
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // 點擊取消按鈕
    await page.click('.btn-secondary');

    // 確認對話框消失
    await expect(page.locator('.modal-overlay')).not.toBeVisible();

    // 確認檔案仍在列表中
    await expect(page.locator('.file-item.file')).toHaveCount(2);
  });

  test('should delete file successfully', async ({ page }) => {
    // 觸發刪除確認對話框
    const firstFile = page.locator('.file-item.file').first();
    await firstFile.hover();
    await firstFile.locator('.action-button.delete').click();

    // 確認對話框出現
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // 點擊確認刪除按鈕
    await page.click('.btn-danger');

    // 確認對話框消失
    await expect(page.locator('.modal-overlay')).not.toBeVisible();

    // 等待檔案列表重新載入
    // 這裡需要 mock 返回刪除後的檔案列表
    await expect(page.locator('.file-count')).toContainText('共 1 個資料夾，1 個檔案');
  });

  test('should handle delete error', async ({ page }) => {
    // 模擬刪除失敗的情況
    // 這需要設置特定的 mock 來返回錯誤

    const firstFile = page.locator('.file-item.file').first();
    await firstFile.hover();
    await firstFile.locator('.action-button.delete').click();

    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.click('.btn-danger');

    // 確認錯誤訊息出現
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-text')).toContainText('刪除失敗');
  });

  test('should close modal by clicking overlay', async ({ page }) => {
    // 觸發刪除確認對話框
    const firstFile = page.locator('.file-item.file').first();
    await firstFile.hover();
    await firstFile.locator('.action-button.delete').click();

    // 確認對話框出現
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // 點擊對話框外部區域
    await page.click('.modal-overlay', { position: { x: 10, y: 10 } });

    // 確認對話框消失
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });
});
