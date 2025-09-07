#!/bin/bash

# 完全自包含的測試執行腳本
set -e

cd "$(dirname "$0")"

echo "🧹 Stopping all existing services..."
# 停止所有可能的服務
pkill -f "mock-server.py" || true
pkill -f "vite.*dev" || true
pkill -f "node.*vite" || true
pkill -f "npm.*dev" || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
lsof -ti:5175 | xargs kill -9 2>/dev/null || true
lsof -ti:5176 | xargs kill -9 2>/dev/null || true
sleep 2

echo "📦 Installing Node.js dependencies..."
npm install --silent

echo "🎭 Installing Playwright browsers..."
npx playwright install chromium --with-deps > /dev/null 2>&1

# 清理舊的測試結果
rm -rf playwright-report/ test-results/

echo "🚀 Starting Mock API Server..."
python3 mock-server.py &
API_PID=$!

echo "⏳ Waiting for API server to start..."
for i in {1..10}; do
    if curl -s http://localhost:8000/files/list > /dev/null 2>&1; then
        echo "✅ Mock API Server is ready!"
        break
    fi
    echo "   Attempt $i/10... waiting"
    sleep 2
done

# 驗證 API 服務器
if ! curl -s http://localhost:8000/files/list > /dev/null 2>&1; then
    echo "❌ Failed to start Mock API Server"
    kill $API_PID 2>/dev/null || true
    exit 1
fi

echo "🚀 Starting Frontend..."
cd ../src/web-ui

# 確保 Frontend dependencies 已安裝
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Frontend dependencies..."
    npm install --silent
fi

# 啟動前端（背景執行）
VITE_API_BASE_URL=http://localhost:8000 npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ../../test-ui-frontend-e2e

echo "⏳ Waiting for Frontend to start..."
FRONTEND_URL=""
for port in 5173 5174 5175 5176 5177; do
    for i in {1..15}; do
        if curl -s http://localhost:$port > /dev/null 2>&1; then
            FRONTEND_URL="http://localhost:$port"
            echo "✅ Frontend is ready on port $port!"
            break 2
        fi
        echo "   Checking port $port... attempt $i/15"
        sleep 2
    done
done

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ Failed to start Frontend"
    kill $API_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo "🧪 Running tests..."
export FRONTEND_URL=$FRONTEND_URL
npx playwright test tests/basic.spec.js --reporter=line

TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed!"
    echo "📋 Test report saved in playwright-report/"
else
    echo ""
    echo "❌ Tests failed!"
    echo "📸 Screenshots and videos saved in test-results/"
    echo "📋 Test report saved in playwright-report/"
fi

echo ""
echo "🧹 Cleaning up services..."
kill $API_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true

echo "✅ Testing complete!"
exit $TEST_RESULT
