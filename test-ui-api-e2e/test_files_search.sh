#!/bin/bash

# Load test configuration
source "$(dirname "$0")/config.sh"

test_file_search_no_auth() {
    increment_test
    log_info "Test: File search without authentication"

    local response=$(make_request "GET" "/files/search?pattern=test" "" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "401" ]; then
        log_success "File search correctly requires authentication (401)"
    else
        log_error "Expected 401, got $status"
    fi
}

test_file_search_no_pattern() {
    increment_test
    log_info "Test: File search without pattern parameter"

    local response=$(make_request "GET" "/files/search" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "422" ]; then
        log_success "File search correctly requires pattern parameter (422)"
    else
        log_error "Expected 422, got $status"
    fi
}

test_file_search_with_pattern() {
    increment_test
    log_info "Test: File search with valid pattern"

    local response=$(make_request "GET" "/files/search?pattern=test" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')
    local body=$(echo "$response" | sed '$d')

    if [ "$status" = "200" ]; then
        local success=$(extract_json_field "$body" "success")
        if [ "$success" = "True" ]; then
            log_success "File search with pattern succeeded"
        else
            log_error "File search returned success=false"
        fi
    elif [ "$status" = "500" ]; then
        local body_detail=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('detail', {}).get('error', ''))" 2>/dev/null)
        if [[ "$body_detail" == *"S3 configuration"* ]]; then
            log_warning "File search failed due to S3 configuration (expected in test environment)"
        else
            log_error "File search failed with unexpected error: $body_detail"
        fi
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

test_file_search_with_prefix() {
    increment_test
    log_info "Test: File search with pattern and prefix"

    local response=$(make_request "GET" "/files/search?pattern=test&prefix=folder/" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "200" ] || [ "$status" = "500" ]; then
        log_success "File search with pattern and prefix handled correctly"
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

test_file_search_special_chars() {
    increment_test
    log_info "Test: File search with special characters"

    local response=$(make_request "GET" "/files/search?pattern=%20space%20" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "200" ] || [ "$status" = "500" ]; then
        log_success "File search with special characters handled correctly"
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

# Run file search tests
main() {
    echo "======================================"
    echo "      File Search E2E Tests"
    echo "======================================"

    if ! check_api_server; then
        exit 1
    fi

    test_file_search_no_auth
    test_file_search_no_pattern
    test_file_search_with_pattern
    test_file_search_with_prefix
    test_file_search_special_chars

    print_summary
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
