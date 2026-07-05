// AIHub - Vercel Serverless Function: chat trực tiếp giữa khách và trợ lý AI
// Route: https://<du-an-cua-ban>.vercel.app/api/chat
//
// Cần cấu hình trong Vercel Dashboard trước khi hoạt động:
//   Settings -> Environment Variables -> thêm GROQ_API_KEY (lấy miễn phí tại console.groq.com)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const SYSTEM_PROMPT = `Bạn là trợ lý AI của AIHub — cửa hàng bán tài khoản AI bản quyền (Grok, Veo 3, ChatGPT Plus, CapCut Pro, Gemini Google AI Pro).

SẢN PHẨM & GIÁ:
- Grok AI: 99.000đ/tháng, tặng kèm tool sản xuất ảnh & video hàng loạt bằng AI.
- Veo 3 (Google DeepMind) Pro 18 tháng: giá ưu đãi, liên hệ trực tiếp để biết giá.
- Veo 3 Ultra loại 0 credit: tài khoản cấp 199.000đ/tháng, tài khoản mail chính chủ 399.000đ/tháng.
- Veo 3 Ultra loại có credit (12.500–60K), nâng mail chính chủ: 1 tháng 620.000đ, 3 tháng 1.299.000đ, 12 tháng 2.300.000đ.
- ChatGPT Plus: TK dùng chung 79.000đ/tháng hoặc 520.000đ/năm; nâng mail chính chủ 899.000đ/năm; TK EDU 1.299.000đ/2 năm.
- CapCut Pro: TK cấp (bảo hành 1 đổi 1) 520.000đ/năm; Gmail chính chủ 899.000đ/năm.
- Gemini Google AI Pro: nâng mail chính chủ (Gemini, Veo3, NotebookLM...) 599.000đ/18 tháng.

THANH TOÁN: khách chọn gói → điền form đăng ký → quét mã SePay/VietQR (tự động đúng số tiền, ngân hàng ACB, số tài khoản 30116809, chủ tài khoản NGUYEN THI ANH THU) → nhắn Zalo hoặc gọi điện xác nhận.
KÍCH HOẠT: thường trong 5–30 phút sau khi chuyển khoản và nhắn Zalo xác nhận.
LIÊN HỆ: hotline/Zalo 0903 887 366.

QUY TẮC TRẢ LỜI:
- Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện, đúng trọng tâm (khoảng 2-5 câu).
- Chỉ dùng đúng thông tin giá/sản phẩm ở trên, tuyệt đối không bịa thêm gói hay mức giá khác.
- Với câu hỏi về đơn hàng cụ thể, hoàn tiền, khiếu nại, hoặc bất cứ điều gì bạn không chắc chắn: hướng khách nhắn Zalo hoặc gọi 0903 887 366 để nhân viên hỗ trợ trực tiếp, không tự suy đoán.
- Không hứa hẹn điều gì ngoài phạm vi thông tin ở trên.`;

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
      return Response.json({ error: 'method not allowed' }, { status: 405, headers: CORS_HEADERS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'invalid json' }, { status: 400, headers: CORS_HEADERS });
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 800) {
      return Response.json({ error: 'invalid message' }, { status: 400, headers: CORS_HEADERS });
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-6)
      : [];

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'Chat AI chưa được cấu hình. Vui lòng nhắn Zalo/hotline 0903 887 366.' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: message }],
          temperature: 0.4,
          max_tokens: 350
        })
      });

      if (!groqRes.ok) {
        return Response.json(
          { error: 'Trợ lý đang bận, vui lòng thử lại hoặc nhắn Zalo 0903 887 366.' },
          { status: 502, headers: CORS_HEADERS }
        );
      }

      const data = await groqRes.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      return Response.json(
        {
          reply:
            reply ||
            'Xin lỗi, mình chưa có câu trả lời phù hợp. Bạn nhắn Zalo 0903 887 366 để được hỗ trợ trực tiếp nhé!'
        },
        { headers: CORS_HEADERS }
      );
    } catch (err) {
      return Response.json(
        { error: 'Có lỗi xảy ra, vui lòng thử lại hoặc nhắn Zalo 0903 887 366.' },
        { status: 500, headers: CORS_HEADERS }
      );
    }
  }
};
