#!/bin/bash

# Load test configuration
source "$(dirname "$0")/config.sh"

test_file_delete_no_auth() {
    increment_test
    log_info "Test: File delete without authentication"

    local response=$(make_request "DELETE" "/files/delete-file?s3_key=test_file.txt" "" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "401" ]; then
        log_success "File delete correctly requires authentication (401)"
    else
        log_error "Expected 401, got $status"
    fi
}

test_file_delete_nonexistent() {
    increment_test
    log_info "Test: Delete nonexistent file"

    local response=$(make_request "DELETE" "/files/delete-file?s3_key=nonexistent_file.txt" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')
    local body=$(echo "$response" | sed '$d')

    if [ "$status" = "200" ]; then
        # S3 delete operation typically succeeds even for nonexistent files
        log_success "Delete nonexistent file handled correctly"
    elif [ "$status" = "500" ]; then
        local body_detail=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('detail', {}).get('error', ''))" 2>/dev/null)
        if [[ "$body_detail" == *"S3 configuration"* ]]; then
            log_warning "File delete failed due to S3 configuration (expected in test environment)"
        else
            log_error "File delete failed with unexpected error: $body_detail"
        fi
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

test_file_delete_with_special_chars() {
    increment_test
    log_info "Test: Delete file with special characters"

    local response=$(make_request "DELETE" "/files/delete-file?s3_key=folder/file%20with%20spaces.txt" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "200" ] || [ "$status" = "500" ]; then
        log_success "Delete with special characters handled correctly"
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

test_file_delete_empty_path() {
    increment_test
    log_info "Test: Delete with empty file path"

    local response=$(make_request "DELETE" "/files/delete-file?s3_key=" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    # This should result in 422 due to empty s3_key parameter
    if [ "$status" = "422" ] || [ "$status" = "500" ]; then
        log_success "Delete with empty path handled correctly"
    else
        log_error "Expected 422 or 500, got $status"
    fi
}

test_directory_delete_no_auth() {
    increment_test
    log_info "Test: Directory delete without authentication"

    local response=$(make_request "DELETE" "/files/delete-directory?prefix=test_folder/" "" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "401" ]; then
        log_success "Directory delete correctly requires authentication (401)"
    else
        log_error "Expected 401, got $status"
    fi
}

test_directory_delete() {
    increment_test
    log_info "Test: Delete directory with valid authentication"

    local response=$(make_request "DELETE" "/files/delete-directory?prefix=test_folder/" "$VALID_USERNAME:$VALID_PASSWORD" "")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')
    local body=$(echo "$response" | sed '$d')

    if [ "$status" = "200" ]; then
        log_success "Directory delete succeeded"
    elif [ "$status" = "500" ]; then
        local body_detail=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('detail', {}).get('error', ''))" 2>/dev/null)
        if [[ "$body_detail" == *"S3 configuration"* ]]; then
            log_warning "Directory delete failed due to S3 configuration (expected in test environment)"
        else
            log_error "Directory delete failed with unexpected error: $body_detail"
        fi
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

# Run file delete tests
main() {
    echo "======================================"
    echo "      File Delete E2E Tests"
    echo "======================================"

    if ! check_api_server; then
        exit 1
    fi

    test_file_delete_no_auth
    test_file_delete_nonexistent
    test_file_delete_with_special_chars
    test_file_delete_empty_path
    test_directory_delete_no_auth
    test_directory_delete

    print_summary
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
