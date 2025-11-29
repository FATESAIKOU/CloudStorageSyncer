# CloudStorageSyncer Docker Deployment

使用 Docker 部署 CloudStorageSyncer 前後端服務的完整指南。

## 架構說明

```
Client (Browser)
    ↓ HTTPS (443)
[Nginx Container]
    ↓ /api/* → Backend API
    ↓ /*     → Frontend (React)
[Backend Container]
    ↓ FastAPI + S3 Service
```

### 容器說明

- **Frontend Container**: Nginx + React (自簽 SSL 憑證)
  - Port 80: HTTP (自動轉向 HTTPS)
  - Port 443: HTTPS

- **Backend Container**: FastAPI + Uvicorn
  - Port 8000 (內部網路，不對外暴露)

## 快速開始

### 1. 準備配置檔案

複製範例配置檔案並填入你的 AWS S3 credentials：

```bash
cp config.json.example config.json
```

編輯 `config.json`：

```json
{
  "access_key": "YOUR_AWS_ACCESS_KEY",
  "secret_key": "YOUR_AWS_SECRET_KEY",
  "bucket": "YOUR_S3_BUCKET_NAME",
  "region": "us-west-2"
}
```

### 2. 啟動服務

```bash
# Build 並啟動所有容器
docker-compose up -d

# 檢查容器狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
```

### 3. 訪問服務

開啟瀏覽器訪問：

```
https://localhost
```

**注意**: 因為使用自簽憑證，瀏覽器會顯示安全警告，請選擇「繼續前往」或「接受風險」。

預設登入帳號：
- Username: `admin`
- Password: `cloudsyncer2025`

## 環境變數設定

可以透過環境變數覆蓋預設設定：

```bash
# 自訂登入帳號密碼
export WEB_USERNAME=myuser
export WEB_PASSWORD=mypassword

docker-compose up -d
```

或使用 `.env` 檔案：

```bash
# .env
WEB_USERNAME=myuser
WEB_PASSWORD=mypassword
```

## 常用命令

```bash
# 停止所有容器
docker-compose down

# 重新 build 並啟動
docker-compose up -d --build

# 查看後端日誌
docker-compose logs -f backend

# 查看前端日誌
docker-compose logs -f frontend

# 進入容器 shell
docker exec -it cloudsyncer-backend sh
docker exec -it cloudsyncer-frontend sh

# 重啟特定服務
docker-compose restart backend
docker-compose restart frontend
```

## API 測試

透過 HTTPS 測試後端 API：

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
- `-u`: 提供 HTTP Basic Auth credentials

## 目錄結構

```
.
├── Dockerfile.backend          # 後端 Dockerfile
├── Dockerfile.frontend         # 前端 Dockerfile
├── docker-compose.yml          # Docker Compose 配置
├── nginx.conf                  # Nginx 配置（含 SSL 和反向代理）
├── config.json                 # S3 配置（需自行創建）
├── config.json.example         # S3 配置範例
└── DOCKER_DEPLOY.md           # 本檔案
```

## SSL 憑證說明

前端容器在啟動時會自動生成自簽憑證，有效期為 365 天。

憑證資訊：
- Country: TW
- State: Taiwan
- Location: Taipei
- Organization: CloudStorageSyncer
- Common Name: localhost

如需使用正式憑證（如 Let's Encrypt），請修改 `Dockerfile.frontend` 和 `nginx.conf`。

## 故障排除

### 容器無法啟動

```bash
# 查看詳細日誌
docker-compose logs

# 檢查容器狀態
docker-compose ps -a
```

### Backend 無法連接到 S3

1. 確認 `config.json` 內容正確
2. 檢查 AWS credentials 是否有效
3. 確認 S3 bucket 存在且有訪問權限

```bash
# 進入後端容器檢查配置
docker exec -it cloudsyncer-backend cat /config/config.json
```

### 前端無法連接到後端

1. 確認兩個容器都在運行
2. 檢查 docker network

```bash
docker network inspect cloudstoragesyncer_cloudsyncer-network
```

### 瀏覽器 HTTPS 警告

這是正常的，因為使用自簽憑證。在瀏覽器中：
- Chrome: 點擊「進階」→「繼續前往 localhost (不安全)」
- Firefox: 點擊「進階」→「接受風險並繼續」
- Safari: 點擊「顯示詳細資訊」→「訪問此網站」

## 生產環境建議

1. **使用正式 SSL 憑證**: 如 Let's Encrypt
2. **設定環境變數**: 不要使用預設帳號密碼
3. **設定防火牆規則**: 限制訪問來源
4. **定期備份**: S3 bucket 和配置檔案
5. **監控日誌**: 使用 docker-compose logs 或集中式日誌系統
6. **資源限制**: 在 docker-compose.yml 中設定 CPU 和記憶體限制

## 更新與維護

```bash
# 更新程式碼
git pull

# 重新 build 並部署
docker-compose down
docker-compose up -d --build

# 清理舊的 image
docker image prune -f
```
