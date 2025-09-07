#!/usr/bin/env python3
"""
簡單的 Mock API Server for 測試
"""

import base64
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse


class MockAPIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """處理 CORS 預檢請求"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
        )
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        """處理 GET 請求"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == "/files/list":
            self._handle_files_list()
        else:
            self.send_response(404)
            self.end_headers()

    def _handle_files_list(self):
        """處理文件列表請求"""
        # 檢查認證
        auth_header = self.headers.get("Authorization", "")

        if self._check_auth(auth_header):
            # 返回成功響應
            response_data = {
                "success": True,
                "data": {
                    "files": [
                        {
                            "key": "test-file-1.txt",
                            "size": 1024,
                            "last_modified": "2025-09-07T10:30:00Z",
                            "etag": '"abc123"',
                            "storage_class": "STANDARD",
                        },
                        {
                            "key": "documents/report.pdf",
                            "size": 2048576,
                            "last_modified": "2025-09-07T09:15:00Z",
                            "etag": '"def456"',
                            "storage_class": "STANDARD",
                        },
                        {
                            "key": "images/photo.jpg",
                            "size": 512000,
                            "last_modified": "2025-09-07T08:45:00Z",
                            "etag": '"ghi789"',
                            "storage_class": "STANDARD",
                        },
                    ],
                    "total_count": 3,
                    "prefix": "",
                },
                "message": "Found 3 files",
                "error": "",
                "error_code": "",
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
        else:
            # 返回認證失敗
            error_response = {
                "success": False,
                "data": None,
                "message": "Invalid credentials",
                "error": "Username or password incorrect",
                "error_code": "AUTH_002",
            }

            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("WWW-Authenticate", "Basic")
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())

    def _check_auth(self, auth_header):
        """檢查認證"""
        if not auth_header.startswith("Basic "):
            return False

        try:
            encoded_creds = auth_header.replace("Basic ", "")
            decoded_creds = base64.b64decode(encoded_creds).decode("utf-8")
            username, password = decoded_creds.split(":", 1)
            return username == "admin" and password == "cloudsyncer2025"
        except (ValueError, UnicodeDecodeError):
            return False

    def log_message(self, format, *args):
        """簡化日誌輸出"""
        print(f"[API] {format % args}")


if __name__ == "__main__":
    server = HTTPServer(("localhost", 8000), MockAPIHandler)
    print("🚀 Mock API Server running on http://localhost:8000")
    print("📋 Endpoints:")
    print("   GET /files/list (requires auth: admin/cloudsyncer2025)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.shutdown()
