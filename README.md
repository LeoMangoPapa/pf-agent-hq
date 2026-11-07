# Agent HQ – Pearl Farm

Bảng điều khiển 3D cho thấy các bot AI của Pearl Farm đang làm gì (Làm / Rảnh), các việc đang chờ chủ duyệt (blocker) và tác vụ.

## Kiến trúc
- **Cloudflare Worker** (`cf/worker.js`, gói miễn phí): phục vụ trang tĩnh trong `cf/public/` (binding `ASSETS`) và API `/api/*`. Trạng thái lưu trong **KV** (binding `HQ`).
- **Các theme (route)**:
  - `/` – Hồ Gươm (`v2/`, `src/`)
  - `/space` – Ngọc trai vũ trụ (`space-pearl/`)
  - `/candy` – Lâu đài kẹo ngọt (`candy-castle/`)
  - `/hoian` – Phố Hội đèn lồng (`hoi-an/`)
  Mỗi theme là một file HTML tự chứa, build bằng esbuild + three.js (`*/build.sh`); mô hình 3D trong `assets/models` (Kenney, CC0) được nhúng qua `build-models.py`.
- **Đăng nhập**: một mật khẩu chung. Worker chỉ giữ `PAGE_HASH` (SHA-256 của mật khẩu) trong Worker secret; đăng nhập đúng thì đặt cookie `pfhq` HttpOnly suy ra từ hash. Chưa đăng nhập thì `/api/status` trả 403.
- **API cho bot**: ghi trạng thái bằng header `X-PF-HQ-Key`, so với `WRITE_HASH`; đọc với `READ_HASH`. Tùy chọn gọi webhook (`HQ_WEBHOOK_URL`, `HQ_WEBHOOK_KEY`) khi có tác vụ mới.

## Build
```
npm install
python3 build-models.py      # tạo assets/models.js
sh v2/build.sh; sh space-pearl/build.sh; sh candy-castle/build.sh; sh hoi-an/build.sh
```
Chép `index.html` mỗi theme vào `cf/public/` (index.html, space.html, candy.html, hoian-v2.html).

## Deploy với secret riêng
1. Tạo KV namespace: `npx wrangler kv namespace create pf-hq-state`.
2. `cp .env.example .env`, điền giá trị của bạn (không commit `.env`).
3. `set -a; . ./.env; set +a; bash cf/deploy.sh` – script sinh `cf/wrangler.toml` từ template và đặt `PAGE_HASH`, `READ_HASH`, `WRITE_HASH` bằng `wrangler secret put`.

Không có mật khẩu, khóa, token hay ID tài khoản nào trong repo này.
