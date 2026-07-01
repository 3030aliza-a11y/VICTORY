# Tóm tắt Quy trình Tạo và Cấu trúc Ứng dụng VICTORY — Tự Do Tài Chính

Dự án **VICTORY — Tự do tài chính** được thiết kế dưới dạng ứng dụng web trang đơn (Single Page Application - SPA) chạy trực tiếp trên trình duyệt (local-first), bảo mật dữ liệu tuyệt đối cho người dùng và tích hợp hệ thống thanh toán tự động.

---

## 1. Trụ Cột Tính Năng Của Ứng Dụng
Ứng dụng được thiết kế xoay quanh 3 trụ cột tài chính cá nhân cốt lõi:
*   **Quản lý tiền (Money)**: Theo dõi thu nhập, chi tiêu thực tế, quản lý hạn mức ngân sách theo danh mục, tích lũy quỹ khẩn cấp và theo dõi các khoản nợ.
*   **Tăng trưởng tài sản (Wealth)**: Thống kê tài sản ròng (Net Worth), theo dõi cơ cấu phân bổ tài sản, ghi nhận thu nhập thụ động, và tính toán lộ trình Tự do tài chính (chỉ số FIRE, số năm dự kiến đạt FI).
*   **Thiết kế cuộc sống (Life)**: Thiết lập mục tiêu cuộc sống ngắn/dài hạn (Life Goals) và các Sứ mệnh tài chính cụ thể (Missions) để tính ra số tiền cần tích lũy mỗi tháng.
*   **Tính năng bổ sung**:
    *   **AI Coach (Gợi ý tài chính)**: Đưa ra cảnh báo vượt ngân sách, lời khuyên tăng tiết kiệm, gợi ý phân bổ tài sản theo các quy tắc thiết lập sẵn.
    *   **Thử thách 4 tuần**: Kế hoạch thực hành từng bước giúp thay đổi thói quen quản lý tài chính.
    *   **Khóa học & Ebook tích hợp**: Bài học tài chính cơ bản hỗ trợ người dùng áp dụng trực tiếp vào app.

---

## 2. Kiến Trúc và Thành Phần Mã Nguồn (Codebase)

Dự án sử dụng công nghệ cốt lõi là **HTML5, CSS3 thuần (Vanilla CSS) và JavaScript thuần**, không sử dụng framework nặng nề để tối ưu tốc độ và tính gọn nhẹ.

*   `index.html`: Giao diện SPA chính, bao gồm màn hình chào (Splash Screen), thanh điều hướng Sidebar và khu vực hiển thị nội dung động.
*   `landing.html` & `css/landing.css`: Trang giới thiệu sản phẩm (Landing Page) tích hợp bảng giá, FAQ và một **khung xem trước (iframe)** chạy app thật với dữ liệu demo (`?demo=1`).
*   `css/style.css`: Hệ thống thiết kế (Design System) hiện đại, responsive hoàn chỉnh trên cả mobile và desktop.
*   `js/storage.js`: Quản lý lưu trữ trạng thái người dùng tại máy khách (`localStorage`), tự động di chuyển phiên bản dữ liệu (data migration), tạo mã thanh toán ngẫu nhiên (`paymentCode`).
*   `js/calc.js`: Chứa toàn bộ công thức tính toán tài chính và logic của AI Coach.
*   `js/charts.js`: Vẽ biểu đồ trực quan hóa tài sản ròng và phân bổ danh mục đầu tư.
*   `js/ui.js` & `js/landing.js`: Định tuyến ứng dụng (hash-based router), render giao diện và xử lý sự kiện tương tác, tích hợp QR thanh toán VietQR.

---

## 3. Hệ Thống Thanh Toán & Đối Chiếu Tự Động (SePay Integration)
Để kích hoạt tài khoản trả phí (66.000đ/tháng), ứng dụng sử dụng cơ chế đối chiếu giao dịch qua cổng **SePay Webhook** với tài khoản ngân hàng ACB (30116809) của chủ ứng dụng.

### Luồng xử lý thanh toán:
1.  **Tạo mã chuyển khoản**: Mỗi thiết bị tự động sinh một mã ngẫu nhiên dạng `VICTORY-XXXXXX` (lưu trong `localStorage` -> `paymentCode`).
2.  **Quét mã QR**: App hiển thị mã QR động chứa số tiền (66.000đ) và nội dung chuyển khoản được định cấu hình tự động.
3.  **Webhook callback**: Khi nhận được tiền, SePay gửi thông tin giao dịch tới backend của ứng dụng qua Webhook bảo mật bằng `SEPAY_API_KEY`.
4.  **Lưu trạng thái & Bật tính năng**: Backend lưu trạng thái thanh toán vào database (KV Store) và Client sẽ định kỳ kiểm tra trạng thái để kích hoạt thời gian sử dụng (`paidUntil`).

### Hai tùy chọn Backend đã được triển khai:
*   **Giải pháp Vercel Serverless (Khuyên dùng khi đưa lên Vercel)**:
    *   Sử dụng thư mục `api/sepay-webhook.js` và `api/status.js` làm endpoint nhận dữ liệu.
    *   Lưu trữ trạng thái qua dịch vụ **Vercel KV (Upstash Redis)**.
    *   Tài liệu hướng dẫn triển khai: `HUONG-DAN-VERCEL.md`.
*   **Giải pháp Cloudflare Workers (Chạy độc lập)**:
    *   Sử dụng Cloudflare Worker (`backend/sepay-worker.js`) chạy serverless cực kỳ nhanh và miễn phí.
    *   Lưu trữ trạng thái qua **Cloudflare KV**.
    *   Tài liệu hướng dẫn triển khai: `backend/HUONG-DAN.md`.
