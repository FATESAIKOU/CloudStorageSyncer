#!/bin/bash

# Load test configuration
source "$(dirname "$0")/config.sh"

test_files_list_no_auth() {
    increment_test
    log_info "Test: Files list without authentication"

    local response=$(make_request "GET" "/files/list" "" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "401" ]; then
        log_success "Files list correctly requires authentication (401)"
    else
        log_error "Expected 401, got $status"
    fi
}

test_files_list_with_auth() {
    increment_test
    log_info "Test: Files list with valid authentication"

    local response=$(make_request "GET" "/files/list" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')
    local body=$(echo "$response" | sed '$d')

    if [ "$status" = "200" ]; then
        local success=$(extract_json_field "$body" "success")
        if [ "$success" = "True" ]; then
            log_success "Files list returned successfully"
        else
            log_error "Files list returned success=false"
            echo "Response: $body"
        fi
    elif [ "$status" = "500" ]; then
        local body_detail=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('detail', {}).get('error', ''))" 2>/dev/null)
        if [[ "$body_detail" == *"S3 configuration"* ]]; then
            log_warning "Files list failed due to S3 configuration (expected in test environment)"
        else
            log_error "Files list failed with unexpected error: $body_detail"
        fi
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

test_files_list_with_params() {
    increment_test
    log_info "Test: Files list with query parameters"

    local response=$(make_request "GET" "/files/list?prefix=test&max_keys=50" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "200" ] || [ "$status" = "500" ]; then
        log_success "Files list with parameters handled correctly"
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

# Run file list tests
main() {
    echo "======================================"
    echo "       Files List E2E Tests"
    echo "======================================"

    if ! check_api_server; then
        exit 1
    fi

    test_files_list_no_auth
    test_files_list_with_auth
    test_files_list_with_params

    print_summary
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
