# Hướng dẫn kết nối SePay cho VICTORY

Không cần Node.js, không cần server riêng — toàn bộ làm qua trình duyệt bằng Cloudflare (miễn phí).

## Bước 1 — Tạo tài khoản Cloudflare
1. Vào https://dash.cloudflare.com/sign-up, đăng ký tài khoản miễn phí.

## Bước 2 — Tạo Worker
1. Trong Cloudflare Dashboard → menu bên trái chọn **Workers & Pages**.
2. Bấm **Create** → **Create Worker**.
3. Đặt tên, ví dụ `victory-payments` → **Deploy** (dùng bản mặc định trước, sẽ sửa code ở bước sau).

## Bước 3 — Dán code
1. Sau khi deploy xong, bấm **Edit code** (hoặc "Quick edit").
2. Xóa toàn bộ code mẫu, dán **toàn bộ nội dung file** `backend/sepay-worker.js` (đã có sẵn trong dự án) vào.
3. Bấm **Save and deploy**.

## Bước 4 — Tạo nơi lưu trạng thái thanh toán (KV)
1. Trong Workers & Pages, vào tab **KV** (bên trái) → **Create a namespace**.
2. Đặt tên `VICTORY_KV` → **Add**.

## Bước 5 — Gắn KV vào Worker
1. Vào lại Worker `victory-payments` → tab **Settings** → **Variables**.
2. Mục **KV Namespace Bindings** → **Add binding**.
3. Variable name: `VICTORY_KV` (phải gõ đúng chữ hoa/thường này) → KV namespace: chọn `VICTORY_KV` vừa tạo → **Save**.

## Bước 6 — Đặt mật khẩu bí mật cho webhook
1. Vẫn ở tab **Settings** → **Variables** → mục **Environment Variables** → **Add variable**.
2. Tên: `SEPAY_API_KEY`.
3. Giá trị: **tự bạn nghĩ ra** một chuỗi dài, ngẫu nhiên, khó đoán (ví dụ: `VICTORY-9f2a7c1e-secret`). Đây không phải thứ SePay cấp cho bạn — chính bạn đặt ra, rồi khai báo lại y chang ở Bước 8.
4. Bấm biểu tượng ổ khóa để **Encrypt** giá trị này → **Save and deploy**.
5. **Ghi nhớ lại chuỗi này**, sẽ cần dùng ở Bước 8.

## Bước 7 — Lấy địa chỉ Worker
1. Trong trang Worker, ở đầu trang sẽ thấy địa chỉ dạng:
   `https://victory-payments.<ten-cua-ban>.workers.dev`
2. Copy lại địa chỉ này.

## Bước 8 — Khai báo Webhook trong SePay
1. Đăng nhập https://my.sepay.vn.
2. Vào mục **Công ty** (hoặc **Cấu hình**) → **Webhooks** → **Thêm Webhook**.
3. Điền:
   - **URL nhận thông báo:** `<địa chỉ Worker ở Bước 7>/sepay-webhook`
     (ví dụ: `https://victory-payments.abc.workers.dev/sepay-webhook`)
   - **Phương thức xác thực:** API Key
   - **API Key:** dán đúng chuỗi bạn đặt ở Bước 6
   - **Tài khoản ngân hàng áp dụng:** chọn tài khoản ACB (30116809) đã liên kết với SePay
4. Lưu lại.

## Bước 9 — Kiểm tra thử
1. Quét QR trong app VICTORY (mục Cài đặt → "Xem thông tin thanh toán"), chuyển khoản thật 66.000đ — nội dung chuyển khoản sẽ tự có mã dạng `VICTORY-AB12CD34`, giữ nguyên nội dung này.
2. Chờ 1–2 phút, vào Cloudflare → Worker `victory-payments` → tab **Logs** (bật "Begin log stream") để xem request từ SePay có tới không.

## Bước cuối — Gửi lại cho mình
Gửi lại **địa chỉ Worker ở Bước 7** (không cần gửi API Key) — mình sẽ điền vào biến `SEPAY_WORKER_URL` trong file `js/ui.js` để app bật nút "Kiểm tra thanh toán" tự động.
