# Hướng dẫn deploy VICTORY + kết nối SePay trên Vercel

Máy này chưa có Node.js nên ta dùng đường **GitHub → Vercel** (kéo-thả trên web, không cần cài gì thêm).

## Bước 1 — Đưa code lên GitHub
1. Vào https://github.com/new, tạo 1 repository mới (đặt tên `victory-app`, để **Private** hoặc **Public** tùy bạn), **không** tick "Add a README".
2. Repo cục bộ đã được chuẩn bị sẵn (git đã `init` + `commit`). Copy 2 dòng lệnh GitHub hiện ra sau khi tạo repo (dạng "…or push an existing repository from the command line"), thường là:
   ```
   git remote add origin https://github.com/<ten-ban>/victory-app.git
   git push -u origin main
   ```
3. Chạy 2 lệnh đó trong Terminal, tại thư mục dự án. Lần đầu push, GitHub sẽ mở cửa sổ đăng nhập trình duyệt để xác thực — làm theo hướng dẫn trên màn hình.

## Bước 2 — Import vào Vercel
1. Đăng nhập https://vercel.com bằng tài khoản GitHub (bạn đã tạo tài khoản rồi).
2. Bấm **Add New...** → **Project**.
3. Chọn repo `victory-app` vừa đẩy lên → **Import**.
4. Ở phần **Framework Preset**, để **Other** (Vercel sẽ tự nhận file tĩnh + thư mục `/api`).
5. Bấm **Deploy**. Chờ khoảng 30 giây tới khi thấy "Congratulations".
6. Bạn sẽ có 1 địa chỉ dạng `https://victory-app-xxxx.vercel.app` — vào thử `/index.html` để xem app đã chạy online chưa.

## Bước 3 — Thêm Redis (để lưu trạng thái đã thanh toán)
1. Trong project vừa deploy, vào tab **Storage** (hoặc **Marketplace**) → tìm **Upstash Redis** hoặc **Redis** → **Add**/**Install**.
2. Làm theo bước tạo database (miễn phí ở mức dùng thử nhỏ) → **Connect** vào đúng project `victory-app`.
3. Vercel sẽ tự thêm biến môi trường `KV_REST_API_URL` và `KV_REST_API_TOKEN` (hoặc `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) vào project — không cần bạn tự nhập.

## Bước 4 — Đặt mật khẩu bí mật cho webhook
1. Vào **Settings** → **Environment Variables**.
2. Thêm biến: Tên `SEPAY_API_KEY`, Giá trị: **tự bạn nghĩ ra** 1 chuỗi dài ngẫu nhiên (ví dụ `VICTORY-9f2a7c1e-secret`) — đây không phải thứ SePay cấp, chính bạn đặt ra rồi khai báo lại y chang ở Bước 6.
3. Save. Sau đó vào tab **Deployments** → bấm dấu "..." ở bản deploy mới nhất → **Redeploy** (để biến môi trường mới có hiệu lực).

## Bước 5 — Lấy địa chỉ webhook
Địa chỉ webhook của bạn là:
```
https://<du-an-cua-ban>.vercel.app/api/sepay-webhook
```
Địa chỉ kiểm tra trạng thái (app/landing page sẽ tự gọi):
```
https://<du-an-cua-ban>.vercel.app/api/status
```

## Bước 6 — Khai báo Webhook trong SePay
1. Đăng nhập https://my.sepay.vn → **Tích hợp WebHooks** → **Thêm Webhook**.
2. Điền:
   - **URL nhận thông báo:** `https://<du-an-cua-ban>.vercel.app/api/sepay-webhook`
   - **Phương thức xác thực:** API Key
   - **API Key:** dán đúng chuỗi bạn đặt ở Bước 4
   - **Tài khoản ngân hàng áp dụng:** ACB (30116809)
3. Lưu lại.

## Bước cuối — Gửi lại cho mình
Gửi lại **địa chỉ Vercel** (dạng `https://victory-app-xxxx.vercel.app`, không cần gửi API Key) — mình sẽ điền vào biến `SEPAY_WORKER_URL` trong `js/ui.js` và `LANDING_SEPAY_WORKER_URL` trong `js/landing.js` để bật nút "Kiểm tra thanh toán" tự động trên cả app lẫn landing page.

## Sau này muốn cập nhật code
Sau khi đã kết nối GitHub ↔ Vercel, mỗi lần mình sửa code xong, chỉ cần bạn chạy:
```
git add -A
git commit -m "cập nhật"
git push
```
Vercel sẽ tự động deploy lại bản mới trong khoảng 30 giây.
