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

    // 找到第一個檔案節點 (TreeNode with file class)
    const firstFile = page.locator('.tree-node.file').first();

    // 懸停以顯示操作按鈕
    await firstFile.hover();

    // 點擊刪除按鈕 (TreeNode actions)
    await firstFile.locator('.action-button.delete').click();

    // 確認刪除確認對話框出現
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-content h3')).toHaveText('確認刪除');
    await expect(page.locator('.delete-warning')).toContainText('您確定要刪除此檔案嗎？');
    await expect(page.locator('.modal-content .file-name')).toHaveText('example.txt');

    // 確認有取消和確認按鈕
    await expect(page.locator('.btn-secondary')).toHaveText('取消');
    await expect(page.locator('.btn-danger')).toHaveText('確認刪除');
  });

  test('should cancel delete operation', async ({ page }) => {
    // 觸發刪除確認對話框
    const firstFile = page.locator('.tree-node.file').first();
    await firstFile.hover();
    await firstFile.locator('.action-button.delete').click();

    // 確認對話框出現
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // 點擊取消按鈕
    await page.click('.btn-secondary');

    // 確認對話框消失
    await expect(page.locator('.modal-overlay')).not.toBeVisible();

    // 確認檔案仍在列表中
    await expect(page.locator('.tree-node.file')).toHaveCount(2);
  });

  test('should delete file successfully', async ({ page }) => {
    // 設置刪除後的檔案列表 mock
    let deleteCompleted = false;

    await page.route('**/files/list*', (route) => {
      if (deleteCompleted) {
        // 刪除後返回較少的檔案
        route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: true,
            data: {
              files: [
                {
                  key: "documents/",
                  size: 0,
                  last_modified: "2025-01-01T10:00:00Z",
                  etag: "\"d41d8cd98f00b204e9800998ecf8427e\"",
                  storage_class: null
                },
                {
                  key: "image.jpg",
                  size: 2411520,
                  last_modified: "2025-01-01T08:15:00Z",
                  etag: "\"b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7\"",
                  storage_class: "STANDARD"
                }
              ],
              total_count: 2,
              prefix: ""
            },
            message: "Found 2 files",
            error: "",
            error_code: ""
          })
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/files/example.txt', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCompleted = true;
        route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: true,
            data: { deleted_key: "example.txt" },
            message: "檔案刪除成功",
            error: null,
            error_code: null
          })
        });
      }
    });

    // 觸發刪除確認對話框
    const firstFile = page.locator('.tree-node.file').first();
    await firstFile.hover();
    await firstFile.locator('.action-button.delete').click();

    // 確認對話框出現
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // 點擊確認刪除按鈕
    await page.click('.btn-danger');

    // 確認對話框消失
    await expect(page.locator('.modal-overlay')).not.toBeVisible();

    // 等待檔案列表重新載入
    await expect(page.locator('.file-count')).toContainText('共 1 個資料夾，1 個檔案');
  });

  test('should handle delete error', async ({ page }) => {
    // 模擬刪除失敗的情況
    await page.route('**/files/example.txt', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: false,
            data: null,
            message: "刪除失敗，請稍後重試",
            error: "Internal server error",
            error_code: "FILE_003"
          })
        });
      }
    });

    const firstFile = page.locator('.tree-node.file').first();
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
    const firstFile = page.locator('.tree-node.file').first();
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
