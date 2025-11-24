#!/bin/bash

# Load test configuration
source "$(dirname "$0")/config.sh"

test_health_check() {
    increment_test
    log_info "Test: Health check (no auth required)"

    local response=$(make_request "GET" "/health" "" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')
    local body=$(echo "$response" | sed '$d')

    if [ "$status" = "200" ]; then
        local success=$(extract_json_field "$body" "success")
        if [ "$success" = "True" ]; then
            log_success "Health check passed"
        else
            log_error "Health check returned success=false"
        fi
    else
        log_error "Health check failed with status $status"
    fi
}

test_auth_no_credentials() {
    increment_test
    log_info "Test: Auth verify without credentials"

    local response=$(make_request "GET" "/auth/verify" "" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "401" ]; then
        log_success "Correctly rejected request without credentials (401)"
    else
        log_error "Expected 401, got $status"
    fi
}

test_auth_invalid_credentials() {
    increment_test
    log_info "Test: Auth verify with invalid credentials"

    local response=$(make_request "GET" "/auth/verify" "$INVALID_USERNAME:$INVALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "401" ]; then
        log_success "Correctly rejected invalid credentials (401)"
    else
        log_error "Expected 401, got $status"
    fi
}

test_auth_valid_credentials() {
    increment_test
    log_info "Test: Auth verify with valid credentials"

    local response=$(make_request "GET" "/auth/verify" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')
    local body=$(echo "$response" | sed '$d')

    if [ "$status" = "200" ]; then
        local success=$(extract_json_field "$body" "success")
        if [ "$success" = "True" ]; then
            log_success "Auth verification passed with valid credentials"
        else
            log_error "Auth returned success=false with valid credentials"
        fi
    else
        log_error "Expected 200, got $status"
    fi
}

# Run authentication tests
main() {
    echo "======================================"
    echo "     Authentication E2E Tests"
    echo "======================================"

    if ! check_api_server; then
        exit 1
    fi

    test_health_check
    test_auth_no_credentials
    test_auth_invalid_credentials
    test_auth_valid_credentials

    print_summary
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
