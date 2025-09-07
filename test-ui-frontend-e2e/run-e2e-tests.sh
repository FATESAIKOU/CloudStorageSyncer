#!/bin/bash

# E2E 測試執行腳本
# 功能：啟動測試服務 -> 執行測試 -> 關閉測試服務

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WIREMOCK_PORT=8000
FRONTEND_PORT=5173

echo "🚀 開始 E2E 測試..."

# 函數：清理背景程序
cleanup() {
    echo "🧹 清理背景程序..."

    # 關閉 WireMock
    if [ ! -z "$WIREMOCK_PID" ]; then
        echo "關閉 WireMock (PID: $WIREMOCK_PID)"
        kill $WIREMOCK_PID 2>/dev/null || true
    fi

    # 關閉前端開發伺服器
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "關閉前端開發伺服器 (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # 等待程序完全關閉
    sleep 2

    echo "✅ 清理完成"
}

# 設置陷阱以確保清理
trap cleanup EXIT INT TERM

# 1. 啟動 WireMock 服務
echo "🔧 啟動 WireMock 服務 (Port: $WIREMOCK_PORT)..."
cd "$SCRIPT_DIR"

# 檢查是否有 WireMock jar 檔案
WIREMOCK_JAR="wiremock-standalone-3.0.1.jar"
if [ ! -f "$WIREMOCK_JAR" ]; then
    echo "下載 WireMock..."
    curl -o "$WIREMOCK_JAR" https://repo1.maven.org/maven2/org/wiremock/wiremock-standalone/3.0.1/wiremock-standalone-3.0.1.jar
fi

# 啟動 WireMock
java -jar "$WIREMOCK_JAR" \
    --port $WIREMOCK_PORT \
    --root-dir . \
    --verbose \
    --global-response-templating &
WIREMOCK_PID=$!

echo "WireMock 已啟動 (PID: $WIREMOCK_PID)"

# 2. 啟動前端開發伺服器
echo "🔧 啟動前端開發伺服器 (Port: $FRONTEND_PORT)..."
cd "$SCRIPT_DIR/../src/web-ui"

# 安裝依賴（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安裝前端依賴..."
    npm install
fi

# 啟動開發伺服器
npm run dev &
FRONTEND_PID=$!

echo "前端開發伺服器已啟動 (PID: $FRONTEND_PID)"

# 3. 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 10

# 檢查服務是否正常運行
echo "🔍 檢查服務狀態..."

# 檢查 WireMock
if curl -s "http://localhost:$WIREMOCK_PORT/__admin" > /dev/null; then
    echo "✅ WireMock 服務正常"
else
    echo "❌ WireMock 服務啟動失敗"
    exit 1
fi

# 檢查前端服務
if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null; then
    echo "✅ 前端服務正常"
else
    echo "❌ 前端服務啟動失敗"
    exit 1
fi

# 4. 執行測試
echo "🧪 執行 E2E 測試..."
cd "$SCRIPT_DIR"

# 安裝測試依賴（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安裝測試依賴..."
    npm install
fi

# 執行測試
if [ "$1" = "--headed" ]; then
    echo "執行有頭模式測試..."
    npx playwright test --headed
elif [ "$1" = "--debug" ]; then
    echo "執行除錯模式測試..."
    npx playwright test --debug
else
    echo "執行無頭模式測試..."
    npx playwright test
fi

TEST_EXIT_CODE=$?

# 5. 顯示測試結果
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ 測試通過！"
else
    echo "❌ 測試失敗！"
fi

# 6. 生成測試報告
if [ -d "test-results" ]; then
    echo "📊 生成測試報告..."
    npx playwright show-report
fi

echo "🏁 E2E 測試完成"
exit $TEST_EXIT_CODE
