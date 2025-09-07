# API E2E 測試說明

## 測試腳本概述

本目錄包含 CloudStorageSyncer Web API 的完整端到端 (E2E) 測試套件。

### 測試文件結構

```
test-ui-api-e2e/
├── config.sh                 # 測試配置和公用函數
├── run_tests.sh              # 主測試執行器
├── test_auth.sh              # 認證功能測試
├── test_files_list.sh        # 檔案列表功能測試
├── test_files_upload.sh      # 檔案上傳功能測試
├── test_files_download.sh    # 檔案下載功能測試
├── test_files_delete.sh      # 檔案刪除功能測試
├── test_files_search.sh      # 檔案搜尋功能測試
└── README.md                 # 本說明文件
```

## 使用方法

### 前置準備

1. 啟動 API 伺服器：
```bash
cd /path/to/CloudStorageSyncer
uv run uvicorn src.cloud_storage_syncer.web_api:app --host 0.0.0.0 --port 8000
```

2. 確保系統有 `curl` 和 `python3` 命令可用

### 執行測試

#### 執行所有測試
```bash
cd test-ui-api-e2e
./run_tests.sh
```

#### 執行單一測試腳本
```bash
cd test-ui-api-e2e
./run_tests.sh --single test_auth.sh
```

#### 列出可用的測試腳本
```bash
cd test-ui-api-e2e
./run_tests.sh --list
```

#### 查看幫助
```bash
cd test-ui-api-e2e
./run_tests.sh --help
```

## 測試內容

### 1. 認證測試 (test_auth.sh)
- ✅ 健康檢查 (無需認證)
- ✅ 無認證訪問受保護端點 (應返回 401)
- ✅ 錯誤認證 (應返回 401)
- ✅ 正確認證 (應返回 200)

### 2. 檔案列表測試 (test_files_list.sh)
- ✅ 無認證訪問 (應返回 401)
- ✅ 有效認證訪問
- ✅ 帶查詢參數的請求

### 3. 檔案上傳測試 (test_files_upload.sh)
- ✅ 無認證上傳 (應返回 401)
- ✅ 有效認證上傳
- ✅ 自訂 S3 key 和 storage class
- ✅ 無檔案上傳 (應返回 422)

### 4. 檔案下載測試 (test_files_download.sh)
- ✅ 無認證下載 (應返回 401)
- ✅ 下載不存在檔案
- ✅ 特殊字符路徑處理
- ✅ 路徑穿越攻擊防護

### 5. 檔案刪除測試 (test_files_delete.sh)
- ✅ 無認證刪除 (應返回 401)
- ✅ 刪除不存在檔案
- ✅ 特殊字符處理
- ✅ 空路徑處理

### 6. 檔案搜尋測試 (test_files_search.sh)
- ✅ 無認證搜尋 (應返回 401)
- ✅ 缺少搜尋模式 (應返回 422)
- ✅ 有效搜尋模式
- ✅ 帶前綴的搜尋
- ✅ 特殊字符搜尋

## 測試配置

### 預設設定
- API 基礎 URL: `http://localhost:8000`
- 有效帳號: `admin`
- 有效密碼: `cloudsyncer2025`
- 無效帳號: `wrong`
- 無效密碼: `pass`

### 自訂配置
可以修改 `config.sh` 中的環境變數來自訂測試配置。

## 測試結果說明

### 狀態碼含義
- **200**: 操作成功
- **401**: 認證失敗或缺少認證
- **404**: 資源不存在
- **422**: 請求參數錯誤
- **500**: 伺服器內部錯誤 (在測試環境中，S3 配置錯誤會導致此狀態)

### 預期的 S3 配置錯誤
在測試環境中，由於可能缺少有效的 S3 配置，某些測試可能會返回 500 錯誤。這是預期行為，測試腳本會適當處理這些情況。

## 故障排除

### API 伺服器未啟動
確保 API 伺服器正在運行：
```bash
curl http://localhost:8000/health
```

### 權限問題
確保測試腳本有執行權限：
```bash
chmod +x *.sh
```

### 依賴問題
確保系統有以下命令：
- `curl` - HTTP 請求工具
- `python3` - JSON 解析
- `bash` - 腳本執行器
