#!/usr/bin/env bash
# Deploy Agent HQ lên Cloudflare Workers. Mọi secret lấy từ biến môi trường (xem .env.example), không lưu trong repo.
# Cần: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, KV_NAMESPACE_ID, PAGE_PASSWORD, READ_KEY, WRITE_KEY
# Tùy chọn: HQ_WEBHOOK_URL, HQ_WEBHOOK_KEY
set -euo pipefail
cd "$(dirname "$0")"
: "${CLOUDFLARE_API_TOKEN:?}" "${CLOUDFLARE_ACCOUNT_ID:?}" "${KV_NAMESPACE_ID:?}" "${PAGE_PASSWORD:?}" "${READ_KEY:?}" "${WRITE_KEY:?}"
export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
W="npx --prefix .. wrangler"
h(){ printf %s "$1" | sha256sum | cut -d' ' -f1; }
sed "s/__KV_ID__/${KV_NAMESPACE_ID}/" wrangler.toml.tpl > wrangler.toml   # wrangler.toml bị .gitignore
$W deploy 2>&1 | grep -v -i token
# Worker chỉ lưu hash SHA-256 của mật khẩu/khóa, không lưu bản rõ.
h "$WRITE_KEY"     | $W secret put WRITE_HASH >/dev/null
h "$READ_KEY"      | $W secret put READ_HASH  >/dev/null
h "$PAGE_PASSWORD" | $W secret put PAGE_HASH  >/dev/null
[ -n "${HQ_WEBHOOK_URL:-}" ] && printf %s "$HQ_WEBHOOK_URL" | $W secret put HQ_WEBHOOK_URL >/dev/null
[ -n "${HQ_WEBHOOK_KEY:-}" ] && printf %s "$HQ_WEBHOOK_KEY" | $W secret put HQ_WEBHOOK_KEY >/dev/null
echo "Deploy xong. Kiểm tra: GET /api/status khi chưa đăng nhập phải trả 403."
