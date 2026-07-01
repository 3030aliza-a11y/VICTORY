// VICTORY - Vercel Serverless Function: app/landing page gọi vào đây để kiểm tra
// 1 mã thanh toán đã được xác nhận chưa.
// Route: https://<du-an-cua-ban>.vercel.app/api/status?code=XXXXXXXX

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

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

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const url = new URL(request.url);
    const code = (url.searchParams.get('code') || '').toUpperCase().trim();
    if (!code) return Response.json({ paid: false }, { headers: CORS_HEADERS });

    const paidUntilStr = await kvGet('paid_' + code);
    const paidUntil = paidUntilStr ? Number(paidUntilStr) : 0;
    return Response.json({ paid: paidUntil > Date.now(), paidUntil }, { headers: CORS_HEADERS });
  }
};
