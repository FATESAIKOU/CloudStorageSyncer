#!/bin/bash

# Main E2E Test Runner
source "$(dirname "$0")/config.sh"

# Test scripts to run
TEST_SCRIPTS=(
    "test_auth.sh"
    "test_files_list.sh"
    "test_files_upload.sh"
    "test_files_download.sh"
    "test_files_delete.sh"
    "test_files_search.sh"
)

run_all_tests() {
    echo "=========================================="
    echo "    CloudStorageSyncer API E2E Tests"
    echo "=========================================="

    # Always start a fresh API server for tests
    local server_pid=""

    # Stop any existing servers first
    log_info "Stopping any existing API servers..."
    stop_api_server

    # Start API server for tests
    log_info "Starting API server for tests..."
    server_pid=$(start_api_server 2>/dev/null | tail -1)
    if [ $? -ne 0 ] || [ -z "$server_pid" ]; then
        log_error "Failed to start API server"
        echo ""
        echo "Please check the server configuration:"
        echo "cd $(pwd)/.."
        echo "uv run uvicorn src.cloud_storage_syncer.web_api:app --host 0.0.0.0 --port 8000"
        exit 1
    fi

    log_success "API server started successfully (PID: $server_pid)"

    echo ""
    log_info "Running all E2E test suites..."
    echo ""

    local total_suites=0
    local passed_suites=0
    local failed_suites=0

    # Run each test script
    for script in "${TEST_SCRIPTS[@]}"; do
        ((total_suites++))
        echo ""
        echo "Running $script..."
        echo "----------------------------------------"

        # Reset counters for this script
        TOTAL_TESTS=0
        PASSED_TESTS=0
        FAILED_TESTS=0

        # Run the test script
        if bash "$(dirname "$0")/$script"; then
            ((passed_suites++))
            log_success "Test suite $script completed successfully"
        else
            ((failed_suites++))
            log_error "Test suite $script failed"
        fi

        echo "----------------------------------------"
    done

    # Always stop the server we started
    log_info "Stopping API server..."
    stop_api_server "$server_pid"

    # Final summary
    echo ""
    echo "=========================================="
    echo "         Final Test Summary"
    echo "=========================================="
    echo "Total Test Suites: $total_suites"
    echo "Passed Suites: $passed_suites"
    echo "Failed Suites: $failed_suites"
    echo "=========================================="

    if [ $failed_suites -eq 0 ]; then
        log_success "All test suites passed!"
        echo ""
        echo "🎉 API E2E tests completed successfully!"
        echo "The API is ready for production use."
        exit 0
    else
        log_error "$failed_suites test suite(s) failed!"
        echo ""
        echo "❌ Some API tests failed."
        echo "Please review the errors above and fix the issues."
        exit 1
    fi
}

# Show usage information
show_usage() {
    echo "CloudStorageSyncer API E2E Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -l, --list     List available test scripts"
    echo "  -s, --single   Run a single test script"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 --list             # List test scripts"
    echo "  $0 --single test_auth.sh  # Run only auth tests"
}

# List available test scripts
list_tests() {
    echo "Available test scripts:"
    for script in "${TEST_SCRIPTS[@]}"; do
        echo "  - $script"
    done
}

# Run single test script
run_single_test() {
    local script="$1"

    if [[ ! " ${TEST_SCRIPTS[@]} " =~ " ${script} " ]]; then
        log_error "Test script '$script' not found"
        echo ""
        list_tests
        exit 1
    fi

    echo "Running single test: $script"
    echo "----------------------------------------"

    if ! check_api_server; then
        exit 1
    fi

    bash "$(dirname "$0")/$script"
}

# Main function
main() {
    case "$1" in
        -h|--help)
            show_usage
            ;;
        -l|--list)
            list_tests
            ;;
        -s|--single)
            if [ -z "$2" ]; then
                log_error "Please specify a test script to run"
                show_usage
                exit 1
            fi
            run_single_test "$2"
            ;;
        "")
            run_all_tests
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
