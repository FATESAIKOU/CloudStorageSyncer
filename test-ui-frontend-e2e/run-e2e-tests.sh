#!/bin/bash

# E2E 測試執行腳本
# 功能：啟動測試服務 -> 執行測試 -> 關閉測試服務
# 基於 run-simple.sh 的改進版本

set -e

cd "$(dirname "$0")"

echo "🚀 開始 E2E 測試..."

# 函數：清理背景程序
cleanup() {
    echo "🧹 清理背景程序..."

    # 關閉 Docker Compose 服務
    docker-compose down 2>/dev/null || true

    # 關閉前端開發伺服器
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "關閉前端開發伺服器 (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # 清理可能占用端口的程序
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    lsof -ti:5174 | xargs kill -9 2>/dev/null || true
    lsof -ti:5175 | xargs kill -9 2>/dev/null || true
    lsof -ti:5176 | xargs kill -9 2>/dev/null || true

    sleep 2
    echo "✅ 清理完成"
}

# 設置陷阱以確保清理
trap cleanup EXIT INT TERM

echo "🧹 停止所有現有服務..."
# 停止所有可能的服務
pkill -f "vite.*dev" || true
pkill -f "node.*vite" || true
pkill -f "npm.*dev" || true
docker-compose down 2>/dev/null || true
cleanup

echo "� 安裝 Node.js 依賴..."
npm install --silent

echo "🎭 安裝 Playwright 瀏覽器..."
npx playwright install chromium --with-deps > /dev/null 2>&1

# 清理舊的測試結果
rm -rf playwright-report/ test-results/

echo "🚀 使用 Docker Compose 啟動 WireMock..."
docker-compose up -d

echo "⏳ 等待 WireMock 啟動..."
for i in {1..30}; do
    if curl -s http://localhost:8080/__admin/health > /dev/null 2>&1; then
        echo "✅ WireMock 已就緒！"
        break
    fi
    echo "   嘗試 $i/30... 等待中"
    sleep 2
done

# 驗證 WireMock 服務器
if ! curl -s http://localhost:8080/__admin/health > /dev/null 2>&1; then
    echo "❌ WireMock 啟動失敗"
    exit 1
fi

echo "🔍 測試 WireMock 端點..."
curl -s http://localhost:8080/files/list > /dev/null && echo "   檔案端點可存取"

echo "� 啟動前端..."
cd ../src/web-ui

# 確保前端依賴已安裝
if [ ! -d "node_modules" ]; then
    echo "📦 安裝前端依賴..."
    npm install --silent
fi

# 啟動前端（背景執行）
VITE_API_BASE_URL=http://localhost:8080 npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ../../test-ui-frontend-e2e

echo "⏳ 等待前端啟動..."
FRONTEND_URL=""
for port in 5173 5174 5175 5176 5177; do
    for i in {1..15}; do
        if curl -s http://localhost:$port > /dev/null 2>&1; then
            FRONTEND_URL="http://localhost:$port"
            echo "✅ 前端已在端口 $port 準備就緒！"
            break 2
        fi
        echo "   檢查端口 $port... 嘗試 $i/15"
        sleep 2
    done
done

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ 前端啟動失敗"
    exit 1
fi

# 4. 執行測試
echo "🧪 執行 E2E 測試..."
export FRONTEND_URL=$FRONTEND_URL

# 執行測試
if [ "$1" = "--headed" ]; then
    echo "執行有頭模式測試..."
    npx playwright test --headed --reporter=line
elif [ "$1" = "--debug" ]; then
    echo "執行除錯模式測試..."
    npx playwright test --debug --reporter=line
else
    echo "執行無頭模式測試..."
    npx playwright test --reporter=line
fi

TEST_EXIT_CODE=$?

# 5. 顯示測試結果
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "🎉 所有測試通過！"
    echo "📋 測試報告已儲存在 playwright-report/"
else
    echo ""
    echo "❌ 測試失敗！"
    echo "📸 截圖和影片已儲存在 test-results/"
    echo "� 測試報告已儲存在 playwright-report/"
fi

echo ""
echo "🏁 E2E 測試完成"
exit $TEST_EXIT_CODE
