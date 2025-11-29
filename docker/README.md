# Docker 部署指南

這個目錄包含了 CloudStorageSyncer 前後端服務的 Docker 部署檔案。

## 檔案說明

```
docker/
├── Dockerfile.backend          # 後端容器定義
├── Dockerfile.frontend         # 前端容器定義（Multi-stage build）
├── docker-compose.yml          # 容器編排配置
├── nginx.conf                  # Nginx 配置模板（SSL + 反向代理）
├── nginx-entrypoint.sh         # Nginx 啟動腳本（處理環境變數）
├── config.json.example         # S3 配置範例
└── README.md                   # 本檔案
```

## 快速開始

### 1. 準備 S3 配置

```bash
# 複製範例檔案
cp config.json.example config.json

# 編輯 config.json 填入你的 AWS S3 credentials
# {
#   "access_key": "YOUR_AWS_ACCESS_KEY",
#   "secret_key": "YOUR_AWS_SECRET_KEY",
#   "bucket": "YOUR_S3_BUCKET_NAME",
#   "region": "us-west-2"
# }
```

### 2. 啟動服務

```bash
# 在 docker 目錄下執行
docker-compose up --build -d
```

### 3. 訪問服務

開啟瀏覽器訪問：
```
https://localhost
```

預設登入帳號：
- Username: `admin`
- Password: `cloudsyncer2025`

**注意**: 使用自簽 SSL 憑證，瀏覽器會顯示安全警告，請選擇「繼續前往」。

## 常用命令

```bash
# 啟動服務
docker-compose up -d

# 重新 build 並啟動
docker-compose up --build -d

# 停止服務
docker-compose down

# 查看日誌
docker-compose logs -f

# 查看特定容器日誌
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看容器狀態
docker-compose ps

# 重啟服務
docker-compose restart
```

## 環境變數設定

可以透過環境變數或 `.env` 檔案自訂設定：

```bash
# 登入帳號密碼
WEB_USERNAME=admin
WEB_PASSWORD=cloudsyncer2025

# Backend 位置（通常不需要改）
BACKEND_HOST=backend
BACKEND_PORT=8000
```

使用方式：
```bash
# 方式 1: 環境變數
export WEB_USERNAME=myuser
export WEB_PASSWORD=mypassword
docker-compose up -d

# 方式 2: .env 檔案
echo "WEB_USERNAME=myuser" > .env
echo "WEB_PASSWORD=mypassword" >> .env
docker-compose up -d
```

## 架構說明

```
Client (Browser)
    ↓ HTTPS (443)
[Frontend: Nginx + React]
    ↓ /api/*  → Backend API (反向代理)
    ↓ /*      → React Static Files
[Backend: FastAPI + Uvicorn]
    ↓ 內部網路 (不對外暴露)
    ↓ S3 Service
AWS S3
```

### 容器說明

- **Frontend Container** (`cloudsyncer-frontend`)
  - Nginx + React 靜態檔案
  - 自動生成自簽 SSL 憑證
  - Port 80: HTTP (自動轉向 HTTPS)
  - Port 443: HTTPS

- **Backend Container** (`cloudsyncer-backend`)
  - FastAPI + Uvicorn
  - Port 8000 (僅內部網路，不對外暴露)

## API 測試

```bash
# Health check (無需認證)
curl -k https://localhost/api/health

# 驗證認證
curl -k -u admin:cloudsyncer2025 https://localhost/api/auth/verify

# 列出檔案
curl -k -u admin:cloudsyncer2025 "https://localhost/api/files/list?limit=10"
```

**參數說明**:
- `-k`: 忽略自簽憑證警告
- `-u`: HTTP Basic Auth credentials

## 故障排除

### 容器啟動失敗

```bash
# 查看詳細日誌
docker-compose logs

# 檢查容器狀態
docker-compose ps -a

# 重新 build
docker-compose build --no-cache
```

### Backend 無法連接到 S3

1. 確認 `config.json` 存在且內容正確
2. 檢查 AWS credentials 是否有效
3. 確認 S3 bucket 存在且有訪問權限

```bash
# 進入容器檢查配置
docker exec -it cloudsyncer-backend cat /config/config.json
```

### 端口被占用

如果 80 或 443 端口已被占用，可修改 `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8443:443"  # 改用 8443
    - "8080:80"   # 改用 8080
```

## 注意事項

1. **config.json 安全**: 不要將 config.json 提交到 Git（已在 .gitignore）
2. **SSL 憑證**: 生產環境建議使用正式憑證（如 Let's Encrypt）
3. **環境變數**: 生產環境請更改預設帳號密碼
4. **資源限制**: 生產環境建議在 docker-compose.yml 設定資源限制
