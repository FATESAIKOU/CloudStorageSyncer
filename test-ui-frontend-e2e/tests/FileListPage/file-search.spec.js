import { test, expect } from '@playwright/test';

test.describe('FileListPage - File Search', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('http://localhost:5173');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'cloudsyncer2025');
    await page.click('button[type="submit"]');
    await expect(page.locator('.file-list-page')).toBeVisible();
  });

  test('should perform search and display results', async ({ page }) => {
    // 等待搜尋欄可見
    await expect(page.locator('.search-input')).toBeVisible();

    // 輸入搜尋關鍵字
    await page.fill('.search-input', 'txt');

    // 點擊搜尋按鈕
    await page.click('.search-button');

    // 等待搜尋結果載入
    await expect(page.locator('.file-list')).toBeVisible();

    // 確認搜尋結果
    const fileItems = page.locator('.file-item.file');
    await expect(fileItems).toHaveCount(1);
    await expect(fileItems.first().locator('.file-name')).toHaveText('example.txt');
  });

  test('should clear search and return to full list', async ({ page }) => {
    // 先執行搜尋
    await page.fill('.search-input', 'txt');
    await page.click('.search-button');

    // 確認搜尋結果只有一個檔案
    await expect(page.locator('.file-item.file')).toHaveCount(1);

    // 點擊清除按鈕
    await page.click('.search-clear');

    // 確認搜尋欄已清空
    await expect(page.locator('.search-input')).toHaveValue('');

    // 確認回到完整檔案列表（這需要重新觸發 files-list API）
    await expect(page.locator('.file-count')).toContainText('共 1 個資料夾，2 個檔案');
  });

  test('should handle empty search results', async ({ page }) => {
    // 搜尋不存在的檔案
    await page.fill('.search-input', 'nonexistent');
    await page.click('.search-button');

    // 等待空狀態顯示
    await expect(page.locator('.file-list-empty')).toBeVisible();
    await expect(page.locator('.empty-text')).toHaveText('目前沒有檔案');
  });

  test('should handle search on Enter key press', async ({ page }) => {
    // 輸入搜尋關鍵字
    await page.fill('.search-input', 'jpg');

    // 按 Enter 鍵
    await page.press('.search-input', 'Enter');

    // 確認搜尋結果
    const fileItems = page.locator('.file-item.file');
    await expect(fileItems).toHaveCount(1);
    await expect(fileItems.first().locator('.file-name')).toHaveText('image.jpg');
  });
});
