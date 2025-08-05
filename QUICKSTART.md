# CloudStorageSyncer 快速開始指南

## 安裝與設定

### 1. 安裝專案依賴
```bash
cd /path/to/CloudStorageSyncer
uv sync
```

### 2. 設定 AWS S3 連線
```bash
uv run cloud-storage-syncer config setup
```
系統會提示輸入：
- AWS Access Key ID
- AWS Secret Access Key
- S3 Bucket 名稱
- AWS Region (預設: us-east-1)

### 3. 測試連線
```bash
uv run cloud-storage-syncer config test
```

## 基本使用

### 查看所有可用命令
```bash
uv run cloud-storage-syncer --help
```

### 管理配置
```bash
# 顯示當前配置
uv run cloud-storage-syncer config show

# 重新設定配置
uv run cloud-storage-syncer config setup

# 刪除配置
uv run cloud-storage-syncer config remove
```

### 檔案上傳

#### 上傳單個檔案
```bash
# 基本上傳（使用檔案名作為 S3 鍵值）
uv run cloud-storage-syncer upload file /path/to/file.txt

# 指定 S3 鍵值和存儲級別
uv run cloud-storage-syncer upload file /path/to/file.txt \
  --s3-key "uploads/file.txt" \
  --storage-class STANDARD_IA
```

#### 上傳整個目錄
```bash
# 上傳目錄中的所有檔案
uv run cloud-storage-syncer upload directory /path/to/directory

# 遞迴上傳子目錄
uv run cloud-storage-syncer upload directory /path/to/directory --recursive

# 使用 S3 前綴
uv run cloud-storage-syncer upload directory /path/to/directory \
  --prefix "backup/2024" \
  --recursive
```

#### 批次上傳
```bash
# 從檔案清單批次上傳
uv run cloud-storage-syncer upload batch /path/to/filelist.txt
```

檔案清單格式（每行一個檔案路徑）：
```
/path/to/file1.txt
/path/to/file2.pdf
/path/to/file3.jpg
```

## 存儲級別選項

支援的 AWS S3 存儲級別：
- `STANDARD` - 標準存儲（預設）
- `INTELLIGENT_TIERING` - 智慧分層
- `STANDARD_IA` - 標準-低頻存取
- `ONEZONE_IA` - 單區域-低頻存取
- `GLACIER` - Glacier 彈性檢索
- `GLACIER_IR` - Glacier 即時檢索
- `DEEP_ARCHIVE` - Glacier 深度歸檔

## 設定檔位置

預設配置檔案位於：`~/.cloud_storage_syncer/config.json`

可使用 `--config-path` 選項指定自訂位置：
```bash
uv run cloud-storage-syncer config setup --config-path /custom/path/config.json
```

## 故障排除

### 常見錯誤

1. **配置錯誤**
   ```
   ❌ No configuration found. Run 'config setup' first.
   ```
   解決方案：執行 `uv run cloud-storage-syncer config setup`

2. **AWS 憑證錯誤**
   ```
   ❌ AWS credentials not found
   ```
   解決方案：檢查 AWS Access Key 和 Secret Key 是否正確

3. **S3 Bucket 錯誤**
   ```
   ❌ Bucket 'bucket-name' does not exist
   ```
   解決方案：確認 Bucket 名稱正確且您有存取權限

4. **檔案不存在**
   ```
   ❌ File does not exist: /path/to/file
   ```
   解決方案：檢查檔案路徑是否正確

### 偵錯提示

- 使用 `config test` 命令驗證連線
- 檢查 AWS IAM 權限設定
- 確認 S3 Bucket 政策允許上傳操作
- 驗證檔案路徑和權限

## 開發者資訊

- **版本**: 0.1.0
- **作者**: FATESAIKOU
- **授權**: 請參考 LICENSE 檔案
- **GitHub**: [專案連結]

如需更多幫助，請參考完整的專案文檔或提交 Issue。
