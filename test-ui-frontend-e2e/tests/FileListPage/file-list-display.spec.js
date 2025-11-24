import { test, expect } from '@playwright/test';

test.describe('FileListPage - File List Display', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('http://localhost:5173');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'cloudsyncer2025');
    await page.click('button[type="submit"]');
    await expect(page.locator('.file-list-page')).toBeVisible();
  });

  test('should display file list correctly', async ({ page }) => {
    // 等待檔案列表載入
    await expect(page.locator('.file-list')).toBeVisible();

    // 確認檔案數量顯示
    await expect(page.locator('.file-count')).toContainText('共 1 個資料夾，2 個檔案');

    // 確認有目錄項目
    await expect(page.locator('.file-item.directory')).toBeVisible();
    await expect(page.locator('.file-item.directory .file-name')).toHaveText('documents/');

    // 確認有檔案項目
    const fileItems = page.locator('.file-item.file');
    await expect(fileItems).toHaveCount(2);

    // 確認第一個檔案 - 現在顯示完整路徑
    const firstFile = fileItems.first();
    await expect(firstFile.locator('.file-name')).toHaveText('example.txt');
    await expect(firstFile.locator('.file-size')).toContainText('1.5 KB');

    // 確認第二個檔案 - 現在顯示完整路徑
    const secondFile = fileItems.nth(1);
    await expect(secondFile.locator('.file-name')).toHaveText('image.jpg');
    await expect(secondFile.locator('.file-size')).toContainText('2.3 MB');
  });

  test('should show action buttons on hover', async ({ page }) => {
    // 等待檔案列表載入
    await expect(page.locator('.file-list')).toBeVisible();

    // 找到第一個檔案項目
    const firstFile = page.locator('.file-item.file').first();

    // 滑鼠懸停在檔案項目上
    await firstFile.hover();

    // 等待操作按鈕變為可見
    await expect(firstFile.locator('.file-actions')).toBeVisible();

    // 確認有下載和刪除按鈕
    await expect(firstFile.locator('.action-button.download')).toBeVisible();
    await expect(firstFile.locator('.action-button.delete')).toBeVisible();
  });

  test('should handle empty file list', async ({ page }) => {
    // 使用 page route 來攔截並返回空數據
    await page.route('**/files/list*', (route) => {
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: [],
          message: '檔案列表載入成功',
          error: null,
          error_code: null
        })
      });
    });

    // 重新載入頁面以觸發空列表
    await page.reload();

    // 等待空狀態顯示
    await expect(page.locator('.file-list-empty')).toBeVisible();
    await expect(page.locator('.empty-text')).toHaveText('目前沒有檔案');
    await expect(page.locator('.empty-icon')).toHaveText('📁');
  });
});
