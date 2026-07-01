// VICTORY Landing Page - accordion FAQ + QR thanh toán tự động
// Điền URL Worker sau khi triển khai (xem backend/HUONG-DAN.md) — phải trùng với
// SEPAY_WORKER_URL trong js/ui.js. Để trống thì chỉ hiện QR, ẩn nút kiểm tra tự động.
const LANDING_SEPAY_WORKER_URL = 'https://victory-lime.vercel.app/api';
const LANDING_MONTHLY_PRICE = 66000;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lp-faq-item').forEach(item => {
    const q = item.querySelector('.lp-faq-q');
    q.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.lp-faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  setupPricingQr();
  silentCheckPaymentOnLoad();
});

const AUTO_CHECK_KEY = 'victory_last_auto_check_date';
async function silentCheckPaymentOnLoad() {
  if (!LANDING_SEPAY_WORKER_URL || typeof Store === 'undefined') return;
  const state = Store.load();
  if (!state.meta.paymentCode) return;
  const isPaid = state.meta.paidUntil && state.meta.paidUntil > Date.now();
  if (isPaid && (state.meta.paidUntil - Date.now()) > 3 * 86400000) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(AUTO_CHECK_KEY) === today) return;
  localStorage.setItem(AUTO_CHECK_KEY, today);
  try {
    const res = await fetch(LANDING_SEPAY_WORKER_URL + '/status?code=' + encodeURIComponent(state.meta.paymentCode));
    const data = await res.json();
    if (data.paid) {
      const fresh = Store.load();
      fresh.meta.paidUntil = data.paidUntil;
      Store.save(fresh);
    }
  } catch (e) { /* im lặng bỏ qua nếu không có mạng */ }
}

// Dùng chung state thật của app (Store, key victory_app_state_v1) — KHÔNG phải state
// demo trong các khung xem trước — để mã thanh toán đồng bộ giữa landing page và app.
function setupPricingQr() {
  const qrImg = document.getElementById('pricingQrImg');
  const checkArea = document.getElementById('pricingCheckArea');
  if (!qrImg || typeof Store === 'undefined') return;

  const state = Store.load();
  Store.save(state); // đảm bảo mã thanh toán được lưu lại ngay, không chỉ tồn tại trong bộ nhớ
  const code = state.meta.paymentCode;

  const addInfo = encodeURIComponent('VICTORY-' + code);
  qrImg.src = 'https://img.vietqr.io/image/acb-30116809-compact2.png?amount=' + LANDING_MONTHLY_PRICE + '&addInfo=' + addInfo + '&accountName=NGUYEN%20THI%20ANH%20THU';

  if (!LANDING_SEPAY_WORKER_URL) return;

  checkArea.innerHTML = `
    <div id="pricingCheckResult" class="lp-price-note" style="min-height:16px;"></div>
    <button type="button" class="btn btn-secondary" id="pricingCheckBtn" style="width:100%; margin-top:8px;">🔄 Tôi đã chuyển khoản — Kiểm tra ngay</button>
  `;
  document.getElementById('pricingCheckBtn').addEventListener('click', async () => {
    const btn = document.getElementById('pricingCheckBtn');
    const resultEl = document.getElementById('pricingCheckResult');
    btn.disabled = true;
    resultEl.textContent = 'Đang kiểm tra...';
    try {
      const res = await fetch(LANDING_SEPAY_WORKER_URL + '/status?code=' + encodeURIComponent(code));
      const data = await res.json();
      if (data.paid) {
        const fresh = Store.load();
        fresh.meta.paidUntil = data.paidUntil;
        Store.save(fresh);
        resultEl.textContent = '✅ Đã ghi nhận thanh toán! Cảm ơn bạn — mở app để tiếp tục dùng ngay.';
      } else {
        resultEl.textContent = 'Chưa thấy giao dịch. Thường mất vài phút để ghi nhận, thử lại sau nhé.';
      }
    } catch (e) {
      resultEl.textContent = 'Không kiểm tra được lúc này, vui lòng thử lại.';
    }
    btn.disabled = false;
  });
}
