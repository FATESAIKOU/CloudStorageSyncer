#!/bin/bash

# Load test configuration
source "$(dirname "$0")/config.sh"

test_file_download_no_auth() {
    increment_test
    log_info "Test: File download without authentication"

    local response=$(make_request "GET" "/files/download/test_file.txt" "" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "401" ]; then
        log_success "File download correctly requires authentication (401)"
    else
        log_error "Expected 401, got $status"
    fi
}

test_file_download_nonexistent() {
    increment_test
    log_info "Test: Download nonexistent file"

    local response=$(make_request "GET" "/files/download/nonexistent_file.txt" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "404" ] || [ "$status" = "500" ]; then
        log_success "Download nonexistent file handled correctly (404/500)"
    else
        log_error "Expected 404 or 500, got $status"
    fi
}

test_file_download_with_special_chars() {
    increment_test
    log_info "Test: Download file with special characters in path"

    local response=$(make_request "GET" "/files/download/folder/sub%20folder/file%20name.txt" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "404" ] || [ "$status" = "500" ]; then
        log_success "Download with special characters handled correctly"
    else
        log_error "Expected 404 or 500, got $status"
    fi
}

test_file_download_path_traversal() {
    increment_test
    log_info "Test: Download with path traversal attempt"

    local response=$(make_request "GET" "/files/download/../../../etc/passwd" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    # Should be handled safely by the API
    if [ "$status" = "404" ] || [ "$status" = "500" ] || [ "$status" = "400" ]; then
        log_success "Path traversal attempt handled safely"
    else
        log_error "Path traversal not handled properly, got $status"
    fi
}

# Run file download tests
main() {
    echo "======================================"
    echo "     File Download E2E Tests"
    echo "======================================"

    if ! check_api_server; then
        exit 1
    fi

    test_file_download_no_auth
    test_file_download_nonexistent
    test_file_download_with_special_chars
    test_file_download_path_traversal

    print_summary
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
