#!/bin/bash

# 專門測試刪除功能

echo "🧹 清理舊的服務..."
pkill -f "npm run dev" || true
pkill -f "vite" || true
pkill -f "wiremock" || true
docker-compose down 2>/dev/null || true

echo "🚀 啟動 WireMock..."
docker-compose up -d

echo "⏳ 等待 WireMock..."
for i in {1..10}; do
  if curl -s http://localhost:8080/__admin/health >/dev/null 2>&1; then
    echo "✅ WireMock 就緒"
    break
  fi
  echo "   等待中... ($i/10)"
  sleep 1
done

echo "🚀 啟動前端..."
cd /Users/fatesaikou/testPY/CloudStorageSyncer/src/web-ui
VITE_API_BASE_URL=http://localhost:8080 npm run dev &
FRONTEND_PID=$!

echo "⏳ 等待前端..."
for i in {1..10}; do
  if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "✅ 前端就緒"
    break
  fi
  echo "   等待中... ($i/10)"
  sleep 2
done

echo "🧪 執行刪除測試..."
cd /Users/fatesaikou/testPY/CloudStorageSyncer/test-ui-frontend-e2e
npx playwright test tests/FileListPage/file-delete.spec.js --headed

echo "🧹 清理..."
kill $FRONTEND_PID 2>/dev/null || true
docker-compose down

echo "✅ 完成"
