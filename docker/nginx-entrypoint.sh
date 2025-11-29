#!/bin/sh

# 使用環境變數替換 nginx 配置中的變數
envsubst '${BACKEND_HOST} ${BACKEND_PORT} ${MAX_UPLOAD_SIZE}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# 啟動 nginx
exec nginx -g 'daemon off;'
