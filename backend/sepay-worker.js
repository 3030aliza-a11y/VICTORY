// VICTORY - Cloudflare Worker nhận webhook thanh toán từ SePay
//
// Worker này KHÔNG cần Node.js / npm để deploy — dán trực tiếp vào Cloudflare
// Dashboard (Workers & Pages -> Create -> Quick Edit) là chạy được ngay.
//
// Cần cấu hình 2 thứ trong Cloudflare trước khi hoạt động (xem HUONG-DAN.md):
//   1. Một KV Namespace, bind vào biến tên "VICTORY_KV"
//   2. Một Secret tên "SEPAY_API_KEY" = API Key bạn tự đặt khi tạo webhook trong SePay
//
// Hai endpoint:
//   POST /sepay-webhook   <- SePay gọi mỗi khi có giao dịch chuyển khoản vào
//   GET  /status?code=XXX <- app VICTORY gọi để kiểm tra 1 mã đã được thanh toán chưa

const PRICE_VND = 66000;
const EXTEND_DAYS = 31; // gia hạn thêm 31 ngày mỗi lần thanh toán hợp lệ

function withCors(resp) {
  resp.headers.set('Access-Control-Allow-Origin', '*');
  resp.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  resp.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return resp;
}

function jsonResponse(obj, status) {
  return withCors(new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }));
    }

    // ---- SePay gọi vào đây mỗi khi có giao dịch ngân hàng mới ----
    if (request.method === 'POST' && url.pathname === '/sepay-webhook') {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Apikey ${env.SEPAY_API_KEY}`) {
        return jsonResponse({ success: false, error: 'unauthorized' }, 401);
      }

      let tx;
      try {
        tx = await request.json();
      } catch (e) {
        return jsonResponse({ success: false, error: 'invalid json' }, 400);
      }

      // Chống xử lý trùng nếu SePay gửi lại webhook (retry)
      const seenKey = 'seen_' + tx.id;
      const alreadySeen = await env.VICTORY_KV.get(seenKey);
      if (alreadySeen) {
        return jsonResponse({ success: true });
      }
      await env.VICTORY_KV.put(seenKey, '1', { expirationTtl: 60 * 60 * 24 * 90 });

      if (tx.transferType === 'in' && Number(tx.transferAmount) >= PRICE_VND) {
        // Nội dung chuyển khoản có dạng "... VICTORY-AB12CD34 ..." do app tự sinh
        const match = /VICTORY[-\s]?([A-Za-z0-9]{6,12})/i.exec(tx.content || tx.description || '');
        if (match) {
          const code = match[1].toUpperCase();
          const existingStr = await env.VICTORY_KV.get('paid_' + code);
          const now = Date.now();
          const base = existingStr && Number(existingStr) > now ? Number(existingStr) : now;
          const paidUntil = base + EXTEND_DAYS * 24 * 60 * 60 * 1000;
          await env.VICTORY_KV.put('paid_' + code, String(paidUntil), { expirationTtl: 60 * 60 * 24 * 400 });
        }
      }

      return jsonResponse({ success: true });
    }

    // ---- App VICTORY gọi vào đây để kiểm tra trạng thái thanh toán ----
    if (request.method === 'GET' && url.pathname === '/status') {
      const code = (url.searchParams.get('code') || '').toUpperCase().trim();
      if (!code) return jsonResponse({ paid: false });
      const paidUntilStr = await env.VICTORY_KV.get('paid_' + code);
      const paidUntil = paidUntilStr ? Number(paidUntilStr) : 0;
      return jsonResponse({ paid: paidUntil > Date.now(), paidUntil });
    }

    return withCors(new Response('VICTORY payment worker is running.', { status: 200 }));
  }
};
