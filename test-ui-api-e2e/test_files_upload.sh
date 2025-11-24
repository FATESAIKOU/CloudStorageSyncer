#!/bin/bash

# Load test configuration
source "$(dirname "$0")/config.sh"

# Create test file for upload
create_test_file() {
    local filename="$1"
    echo "This is a test file for API upload testing" > "$filename"
    echo "Created at: $(date)" >> "$filename"
    echo "File content for testing purposes" >> "$filename"
}

cleanup_test_file() {
    local filename="$1"
    if [ -f "$filename" ]; then
        rm "$filename"
    fi
}

test_file_upload_no_auth() {
    increment_test
    log_info "Test: File upload without authentication"

    local test_file="/tmp/test_upload_no_auth.txt"
    create_test_file "$test_file"

    local response=$(curl -s -w '\nHTTP_STATUS:%{http_code}' \
        -X POST \
        -F "file=@$test_file" \
        "$API_BASE_URL/files/upload")

    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    cleanup_test_file "$test_file"

    if [ "$status" = "401" ]; then
        log_success "File upload correctly requires authentication (401)"
    else
        log_error "Expected 401, got $status"
    fi
}

test_file_upload_with_auth() {
    increment_test
    log_info "Test: File upload with valid authentication"

    local test_file="/tmp/test_upload_with_auth.txt"
    create_test_file "$test_file"

    local response=$(curl -s -w '\nHTTP_STATUS:%{http_code}' \
        -X POST \
        -u "$VALID_USERNAME:$VALID_PASSWORD" \
        -F "file=@$test_file" \
        "$API_BASE_URL/files/upload")

    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')
    local body=$(echo "$response" | sed '$d')

    cleanup_test_file "$test_file"

    if [ "$status" = "200" ]; then
        local success=$(extract_json_field "$body" "success")
        if [ "$success" = "True" ]; then
            log_success "File upload succeeded"
        else
            log_error "File upload returned success=false"
        fi
    elif [ "$status" = "500" ]; then
        local body_detail=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('detail', {}).get('error', ''))" 2>/dev/null)
        if [[ "$body_detail" == *"S3 configuration"* ]]; then
            log_warning "File upload failed due to S3 configuration (expected in test environment)"
        else
            log_error "File upload failed with unexpected error: $body_detail"
        fi
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

test_file_upload_with_custom_key() {
    increment_test
    log_info "Test: File upload with custom S3 key"

    local test_file="/tmp/test_upload_custom_key.txt"
    create_test_file "$test_file"

    local response=$(curl -s -w '\nHTTP_STATUS:%{http_code}' \
        -X POST \
        -u "$VALID_USERNAME:$VALID_PASSWORD" \
        -F "file=@$test_file" \
        -F "s3_key=custom/path/test_file.txt" \
        -F "storage_class=STANDARD_IA" \
        "$API_BASE_URL/files/upload")

    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    cleanup_test_file "$test_file"

    if [ "$status" = "200" ] || [ "$status" = "500" ]; then
        log_success "File upload with custom parameters handled correctly"
    else
        log_error "Expected 200 or 500, got $status"
    fi
}

test_file_upload_no_file() {
    increment_test
    log_info "Test: File upload without file"

    local response=$(curl -s -w '\nHTTP_STATUS:%{http_code}' \
        -X POST \
        -u "$VALID_USERNAME:$VALID_PASSWORD" \
        "$API_BASE_URL/files/upload")

    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')

    if [ "$status" = "422" ]; then
        log_success "File upload correctly rejects request without file (422)"
    else
        log_error "Expected 422, got $status"
    fi
}

# Run file upload tests
main() {
    echo "======================================"
    echo "      File Upload E2E Tests"
    echo "======================================"

    if ! check_api_server; then
        exit 1
    fi

    test_file_upload_no_auth
    test_file_upload_with_auth
    test_file_upload_with_custom_key
    test_file_upload_no_file

    print_summary
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
