// VICTORY - Vercel Serverless Function nhận webhook thanh toán từ SePay
// Route: https://<du-an-cua-ban>.vercel.app/api/sepay-webhook
//
// Cần cấu hình trong Vercel Dashboard trước khi hoạt động (xem HUONG-DAN-VERCEL.md):
//   1. Cài "Upstash Redis" (hoặc Redis bất kỳ) từ Vercel Marketplace cho project này
//      -> tự động thêm biến KV_REST_API_URL / KV_REST_API_TOKEN (hoặc UPSTASH_REDIS_REST_URL / _TOKEN)
//   2. Thêm Environment Variable: SEPAY_API_KEY = một chuỗi bí mật bạn tự đặt

const PRICE_VND = 66000;
const EXTEND_DAYS = 31; // gia hạn thêm 31 ngày mỗi lần thanh toán hợp lệ

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function kvUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
}
function kvToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
}

async function kvGet(key) {
  const res = await fetch(`${kvUrl()}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${kvToken()}` }
  });
  const data = await res.json();
  return data.result;
}

async function kvSet(key, value, exSeconds) {
  const url = `${kvUrl()}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}${exSeconds ? `?EX=${exSeconds}` : ''}`;
  await fetch(url, { headers: { Authorization: `Bearer ${kvToken()}` } });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
      return Response.json({ success: false, error: 'method not allowed' }, { status: 405, headers: CORS_HEADERS });
    }

    const auth = request.headers.get('Authorization') || '';
    if (auth !== `Apikey ${process.env.SEPAY_API_KEY}`) {
      return Response.json({ success: false, error: 'unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    let tx;
    try {
      tx = await request.json();
    } catch (e) {
      return Response.json({ success: false, error: 'invalid json' }, { status: 400, headers: CORS_HEADERS });
    }

    // Chống xử lý trùng nếu SePay gửi lại webhook (retry)
    const seenKey = 'seen_' + tx.id;
    const alreadySeen = await kvGet(seenKey);
    if (alreadySeen) {
      return Response.json({ success: true }, { headers: CORS_HEADERS });
    }
    await kvSet(seenKey, '1', 60 * 60 * 24 * 90);

    if (tx.transferType === 'in' && Number(tx.transferAmount) >= PRICE_VND) {
      // Nội dung chuyển khoản có dạng "... VICTORY-AB12CD34 ..." do app tự sinh
      const match = /VICTORY[-\s]?([A-Za-z0-9]{6,12})/i.exec(tx.content || tx.description || '');
      if (match) {
        const code = match[1].toUpperCase();
        const existingStr = await kvGet('paid_' + code);
        const now = Date.now();
        const base = existingStr && Number(existingStr) > now ? Number(existingStr) : now;
        const paidUntil = base + EXTEND_DAYS * 24 * 60 * 60 * 1000;
        await kvSet('paid_' + code, String(paidUntil), 60 * 60 * 24 * 400);
      }
    }

    return Response.json({ success: true }, { headers: CORS_HEADERS });
  }
};
