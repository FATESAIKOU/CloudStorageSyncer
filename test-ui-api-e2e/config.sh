#!/bin/bash

# API E2E Test Configuration
export API_BASE_URL="http://localhost:8000"
export VALID_USERNAME="admin"
export VALID_PASSWORD="cloudsyncer2025"
export INVALID_USERNAME="wrong"
export INVALID_PASSWORD="pass"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

increment_test() {
    ((TOTAL_TESTS++))
}

# Check if API server is running
check_api_server() {
    log_info "Checking if API server is running..."
    if curl -s "$API_BASE_URL/health" > /dev/null; then
        log_success "API server is running"
        return 0
    else
        log_error "API server is not running at $API_BASE_URL"
        echo "Please start the server with: uv run uvicorn src.cloud_storage_syncer.web_api:app --host 0.0.0.0 --port 8000"
        return 1
    fi
}

# Start API server in background with timeout
start_api_server() {
    log_info "Starting API server in background..."

    # Change to project root directory (one level up from test directory)
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_root="$(dirname "$script_dir")"
    cd "$project_root" || {
        log_error "Failed to change to project root directory: $project_root"
        return 1
    }

    log_info "Starting server from directory: $(pwd)"

    # Start server in background and redirect output to avoid blocking
    nohup uv run uvicorn src.cloud_storage_syncer.web_api:app --host 0.0.0.0 --port 8000 > /tmp/api_server.log 2>&1 &
    local server_pid=$!

    log_info "Started API server with PID: $server_pid"

    # Wait a moment for server to start
    sleep 5

    # Check if server is actually running
    local retry_count=0
    while [ $retry_count -lt 10 ]; do
        if check_api_server; then
            log_success "API server started successfully (PID: $server_pid)"
            echo "$server_pid"  # Only output PID for capture
            return 0
        fi
        sleep 1
        ((retry_count++))
    done

    log_error "API server failed to start within timeout"
    # Try to kill the process if it exists
    if kill -0 "$server_pid" 2>/dev/null; then
        kill "$server_pid" 2>/dev/null
    fi
    return 1
}

# Stop API server
stop_api_server() {
    local server_pid="$1"

    if [ -z "$server_pid" ]; then
        log_warning "No server PID provided, attempting to find and stop uvicorn processes"
        # Try to find and stop uvicorn processes
        local uvicorn_pids
        uvicorn_pids=$(pgrep -f "uvicorn.*cloud_storage_syncer.web_api" || true)
        if [ -n "$uvicorn_pids" ]; then
            log_info "Found uvicorn processes: $uvicorn_pids"
            echo "$uvicorn_pids" | xargs kill 2>/dev/null || true
            sleep 2
            # Force kill if still running
            echo "$uvicorn_pids" | xargs kill -9 2>/dev/null || true
            log_info "Stopped existing uvicorn processes"
        else
            log_info "No uvicorn processes found"
        fi
        return 0
    fi

    log_info "Stopping API server (PID: $server_pid)..."

    # Check if process exists
    if ! kill -0 "$server_pid" 2>/dev/null; then
        log_info "Process $server_pid is not running"
        return 0
    fi

    # Try graceful shutdown first
    kill "$server_pid" 2>/dev/null || true

    # Wait for graceful shutdown
    local retry_count=0
    while [ $retry_count -lt 5 ]; do
        if ! kill -0 "$server_pid" 2>/dev/null; then
            log_success "API server stopped gracefully"
            return 0
        fi
        sleep 1
        ((retry_count++))
    done

    # Force kill if still running
    log_warning "Force killing API server (PID: $server_pid)"
    kill -9 "$server_pid" 2>/dev/null || true

    # Final check
    if ! kill -0 "$server_pid" 2>/dev/null; then
        log_success "API server stopped"
    else
        log_error "Failed to stop API server (PID: $server_pid)"
        return 1
    fi
}

# JSON response helper
extract_json_field() {
    local json="$1"
    local field="$2"
    echo "$json" | python3 -c "import sys, json; print(json.load(sys.stdin).get('$field', ''))" 2>/dev/null || echo ""
}

# HTTP response helper
make_request() {
    local method="$1"
    local endpoint="$2"
    local auth="$3"
    local data="$4"

    local url="$API_BASE_URL$endpoint"
    local curl_cmd="curl -s -w '\nHTTP_STATUS:%{http_code}'"

    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST"
    elif [ "$method" = "DELETE" ]; then
        curl_cmd="$curl_cmd -X DELETE"
    fi

    if [ -n "$auth" ]; then
        curl_cmd="$curl_cmd -u '$auth'"
    fi

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi

    curl_cmd="$curl_cmd '$url'"
    eval $curl_cmd
}

# Summary function
print_summary() {
    echo ""
    echo "======================================"
    echo "         E2E Test Summary"
    echo "======================================"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "======================================"

    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "All tests passed!"
        exit 0
    else
        log_error "$FAILED_TESTS test(s) failed!"
        exit 1
    fi
}
