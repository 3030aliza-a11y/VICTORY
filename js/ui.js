// VICTORY - toàn bộ logic giao diện, router (hash-based) và tương tác
(function () {
  const hadExistingState = !!localStorage.getItem(Store.KEY);
  let state = Store.load();
  // Lưu ngay từ lần đầu mở app: nếu không, ngày cài đặt (createdAt) và mã thanh toán
  // (paymentCode) chỉ tồn tại trong bộ nhớ và sẽ bị sinh lại (mất khớp với giao dịch
  // đã chuyển khoản) nếu người dùng đóng tab trước khi thực hiện thao tác nào khác.
  if (!hadExistingState) Store.save(state);
  let ui = { moneyTab: 'transactions', wealthTab: 'assets', lifeTab: 'goals', txMonth: Calc.currentMonthKey(), bonusTab: 'course', advisoryTab: 'allocation' };

  const PALETTE = ['#16a34a', '#d97706', '#2563eb', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#4d7c0f'];

  const TRIAL_DAYS = 7;
  const MONTHLY_PRICE = 66000;
  const PAYMENT_CONTACT_EMAIL = '3030aliza@gmail.com';
  const BANNER_DISMISS_KEY = 'victory_trial_banner_dismissed_date';
  // Điền URL Cloudflare Worker sau khi triển khai (xem backend/HUONG-DAN.md) để bật
  // kiểm tra thanh toán SePay tự động. Để trống '' thì app dùng luồng xác nhận thủ công qua email.
  const SEPAY_WORKER_URL = '';

  function vietqrUrl(code) {
    const addInfo = encodeURIComponent('VICTORY-' + code);
    return 'https://img.vietqr.io/image/acb-30116809-compact2.png?amount=' + MONTHLY_PRICE + '&addInfo=' + addInfo + '&accountName=NGUYEN%20THI%20ANH%20THU';
  }

  const ASSET_TYPES = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'saving', label: 'Tiết kiệm ngân hàng' },
    { value: 'stock', label: 'Cổ phiếu' },
    { value: 'fund', label: 'Quỹ đầu tư' },
    { value: 'crypto', label: 'Tiền số' },
    { value: 'realestate', label: 'Bất động sản' },
    { value: 'gold', label: 'Vàng' },
    { value: 'business', label: 'Kinh doanh riêng' },
    { value: 'other', label: 'Khác' }
  ];
  const LIFE_GOAL_CATEGORIES = [
    { value: 'travel', label: 'Du lịch', icon: '🌍' },
    { value: 'family', label: 'Gia đình', icon: '❤️' },
    { value: 'career', label: 'Sự nghiệp', icon: '💼' },
    { value: 'health', label: 'Sức khỏe', icon: '🏃' },
    { value: 'community', label: 'Cộng đồng', icon: '🤝' },
    { value: 'other', label: 'Khác', icon: '✨' }
  ];
  const MISSION_TYPES = [
    { value: 'buy_house', label: 'Mua nhà' },
    { value: 'travel', label: 'Du lịch' },
    { value: 'retire_early', label: 'Nghỉ hưu sớm' },
    { value: 'custom', label: 'Tùy chỉnh' }
  ];

  // ---------- Bonus content ----------
  const COURSE_CHAPTERS = [
    { title: 'Chương 1. Tư duy về tiền bạc', items: ['Hiểu đúng về tài chính cá nhân', 'Những sai lầm phổ biến khi quản lý tiền', 'Xây dựng tư duy làm chủ tài chính'] },
    { title: 'Chương 2. Lập kế hoạch tài chính', items: ['Xác định mục tiêu tài chính', 'Phương pháp SMART', 'Lập kế hoạch ngắn hạn và dài hạn'] },
    { title: 'Chương 3. Quản lý thu nhập và chi tiêu', items: ['Ghi chép thu chi hiệu quả', 'Phân loại các khoản chi', 'Quy tắc 50/30/20'] },
    { title: 'Chương 4. Xây dựng quỹ khẩn cấp', items: ['Tại sao cần quỹ dự phòng', 'Cách tích lũy từ thu nhập hằng tháng'] },
    { title: 'Chương 5. Tiết kiệm thông minh', items: ['Các phương pháp tiết kiệm hiệu quả', 'Kỹ thuật tiết kiệm tự động'] },
    { title: 'Chương 6. Đầu tư dành cho người mới', items: ['Chứng khoán', 'Quỹ mở', 'Vàng', 'Tiền gửi ngân hàng', 'Bất động sản'] },
    { title: 'Chương 7. Lập kế hoạch nghỉ hưu và tự do tài chính', items: ['Tính số tiền cần để tự do tài chính', 'Tỷ lệ rút an toàn (Safe Withdrawal Rate)'] },
    { title: 'Chương 8. Thực hành cùng VICTORY', items: ['Áp dụng từng chương vào Quản lý tiền, Tăng trưởng tài sản và Thiết kế cuộc sống trong app'] }
  ];

  const EBOOK_SECTIONS = [
    { title: 'Giới thiệu ứng dụng', desc: 'Ba trụ cột của VICTORY: Quản lý tiền, Tăng trưởng tài sản, Thiết kế cuộc sống.', route: null },
    { title: 'Tạo & quản lý hồ sơ', desc: 'Nhập tên, năm sinh, tuổi nghỉ hưu mong muốn và các thông số tài chính trong Cài đặt.', route: '#/settings' },
    { title: 'Thêm khoản thu / khoản chi', desc: 'Dùng nút "+" nổi hoặc "Thêm giao dịch" để ghi chép nhanh.', route: '#/money', tab: 'transactions' },
    { title: 'Quản lý danh mục', desc: 'Tùy chỉnh danh mục thu/chi theo thói quen của bạn trong Cài đặt.', route: '#/settings' },
    { title: 'Thiết lập ngân sách', desc: 'Đặt hạn mức chi tiêu theo từng danh mục ở tab Ngân sách.', route: '#/money', tab: 'budgets' },
    { title: 'Theo dõi mục tiêu tiết kiệm', desc: 'Tạo Sứ mệnh (Mission) và để app tính số tiền cần tiết kiệm mỗi tháng.', route: '#/life', tab: 'missions' },
    { title: 'Xem báo cáo tài chính', desc: 'Trang Tổng quan hiển thị Điểm VICTORY, tài sản ròng và gợi ý từ AI Coach.', route: '#/dashboard' },
    { title: 'Xuất / nhập dữ liệu', desc: 'Xuất toàn bộ dữ liệu ra file JSON để sao lưu, hoặc nhập lại khi đổi thiết bị — trong Cài đặt.', route: '#/settings' },
    { title: 'Câu hỏi thường gặp', desc: 'Xem phần Hỏi đáp trên trang giới thiệu VICTORY.', route: null }
  ];

  const TEMPLATE_MAP = [
    { name: 'Quản lý thu chi', route: '#/money', tab: 'transactions', desc: 'Thay cho file Excel thu chi — ghi chép và xem báo cáo theo tháng.' },
    { name: 'Lập ngân sách tháng', route: '#/money', tab: 'budgets', desc: 'Đặt hạn mức theo danh mục, tự động so sánh với thực chi.' },
    { name: 'Kế hoạch trả nợ', route: '#/money', tab: 'debts', desc: 'Theo dõi từng khoản nợ, lãi suất và số tiền trả hàng tháng.' },
    { name: 'Kế hoạch tiết kiệm', route: '#/life', tab: 'missions', desc: 'Mission Planner tự tính số tiền cần tiết kiệm mỗi tháng cho từng mục tiêu.' },
    { name: 'Quản lý tài sản', route: '#/wealth', tab: 'assets', desc: 'Danh sách tài sản và biểu đồ tài sản ròng theo thời gian.' },
    { name: 'Theo dõi đầu tư', route: '#/wealth', tab: 'allocation', desc: 'Biểu đồ phân bổ danh mục đầu tư theo loại tài sản.' },
    { name: 'Tính giá trị tài sản ròng (Net Worth)', route: '#/dashboard', tab: null, desc: 'Tự động tính và vẽ biểu đồ tài sản ròng ngay trên Tổng quan.' }
  ];

  const CHALLENGE_WEEKS = [
    { title: 'Tuần 1: Nhận diện dòng tiền', tasks: [
      { id: 'w1t1', label: 'Ghi chép toàn bộ thu nhập trong tuần' },
      { id: 'w1t2', label: 'Ghi chép toàn bộ chi tiêu trong tuần' },
      { id: 'w1t3', label: 'Phân loại các khoản chi theo danh mục' }
    ]},
    { title: 'Tuần 2: Kiểm soát chi tiêu', tasks: [
      { id: 'w2t1', label: 'Thiết lập ngân sách cho ít nhất 3 danh mục' },
      { id: 'w2t2', label: 'Xác định 1 khoản chi không cần thiết để cắt giảm' },
      { id: 'w2t3', label: 'Theo dõi ngân sách hàng ngày' }
    ]},
    { title: 'Tuần 3: Tăng khả năng tiết kiệm', tasks: [
      { id: 'w3t1', label: 'Tiết kiệm tối thiểu 10% thu nhập tháng này' },
      { id: 'w3t2', label: 'Cập nhật số dư quỹ khẩn cấp' },
      { id: 'w3t3', label: 'Đặt mục tiêu quỹ khẩn cấp 3-6 tháng chi phí' }
    ]},
    { title: 'Tuần 4: Hướng đến tự do tài chính', tasks: [
      { id: 'w4t1', label: 'Xem lại Điểm VICTORY và đánh giá tiến bộ' },
      { id: 'w4t2', label: 'Tạo 1 Sứ mệnh (Mission) tài chính mới' },
      { id: 'w4t3', label: 'Lập kế hoạch tài chính cho 6-12 tháng tới' }
    ]}
  ];

  const SPENDING_TIPS = [
    'Áp dụng quy tắc 24 giờ trước khi mua món đồ trên 500.000đ.', 'Không mua sắm khi đang buồn hoặc căng thẳng.',
    'Luôn so sánh giá ở ít nhất 2-3 nơi trước khi mua đồ giá trị lớn.', 'Lập danh sách trước khi đi siêu thị và bám sát danh sách.',
    'Không đi siêu thị khi đang đói.', 'Tận dụng chương trình tích điểm, hoàn tiền của ngân hàng và cửa hàng.',
    'Chỉ mua đúng nhu cầu, tránh chạy theo xu hướng.', 'Ghi lại mọi khoản chi, kể cả những khoản nhỏ như ly cà phê.',
    'Hạn chế quẹt thẻ tín dụng nếu chưa kiểm soát được chi tiêu.', 'Trích ít nhất 10-20% thu nhập để tiết kiệm ngay khi nhận lương.',
    'Tự động hóa việc chuyển tiền tiết kiệm ngay đầu tháng.', 'Đặt hạn mức chi tiêu cho từng danh mục và theo dõi sát.',
    'Hủy các gói đăng ký (subscription) không còn dùng đến.', 'So sánh giá điện, nước, internet định kỳ để tìm gói tốt hơn.',
    'Nấu ăn tại nhà nhiều hơn thay vì ăn ngoài.', 'Mang cơm trưa đi làm ít nhất 3 ngày/tuần.',
    'Tránh mua đồ chỉ vì đang giảm giá nếu không thực sự cần.', 'Đặt câu hỏi "Mình có thực sự cần món này không?" trước khi thanh toán.',
    'Theo dõi hạn sử dụng thẻ quà tặng, voucher để không bị lãng phí.', 'Gộp các chuyến đi mua sắm để tiết kiệm chi phí di chuyển.',
    'Ưu tiên trả nợ có lãi suất cao nhất trước.', 'Tránh vay tiêu dùng lãi suất cao cho các nhu cầu không cấp thiết.',
    'Đọc kỹ điều khoản trước khi vay hoặc mở thẻ tín dụng mới.', 'Giữ tỷ lệ nợ trên thu nhập dưới 30%.',
    'Đặt mục tiêu tiết kiệm cụ thể, có thời hạn rõ ràng.', 'Chia nhỏ mục tiêu lớn thành các mốc nhỏ dễ đạt được.',
    'Xây dựng quỹ khẩn cấp tương đương 3-6 tháng chi phí sinh hoạt.', 'Để quỹ khẩn cấp ở nơi dễ rút nhưng tách biệt với tài khoản chi tiêu hàng ngày.',
    'Không dùng quỹ khẩn cấp cho mục đích không khẩn cấp.', 'Ôn lại ngân sách của bạn vào cuối mỗi tháng.',
    'Đặt ngày cố định hàng tháng để "họp" với chính mình về tài chính.', 'Theo dõi giá trị tài sản ròng (net worth) định kỳ mỗi quý.',
    'Đa dạng hóa danh mục đầu tư thay vì dồn hết vào một kênh.', 'Chỉ đầu tư số tiền bạn sẵn sàng chấp nhận rủi ro.',
    'Tránh đầu tư theo tâm lý đám đông (FOMO).', 'Tìm hiểu kỹ trước khi đầu tư vào bất kỳ kênh nào.',
    'Bắt đầu đầu tư sớm để tận dụng sức mạnh lãi kép.', 'Tái đầu tư cổ tức hoặc lợi nhuận thay vì rút hết ra tiêu.',
    'Đừng bỏ hết trứng vào một giỏ.', 'Xem lại danh mục đầu tư ít nhất 6 tháng/lần.',
    'Đặt câu hỏi "Nếu mất việc, mình cầm cự được bao lâu?"', 'Mua bảo hiểm sức khỏe/nhân thọ phù hợp với khả năng tài chính.',
    'Đọc kỹ hợp đồng bảo hiểm trước khi ký.', 'Không để bảo hiểm thay thế hoàn toàn quỹ khẩn cấp.',
    'Thương lượng lại lãi suất vay nếu có thể.', 'Trả nợ nhiều hơn mức tối thiểu mỗi khi có thể.',
    'Tránh mở quá nhiều thẻ tín dụng cùng lúc.', 'Thanh toán dư nợ thẻ tín dụng đúng hạn, tránh lãi phạt.',
    'Đặt nhắc lịch thanh toán hóa đơn để tránh phí trễ hạn.', 'Kiểm tra sao kê ngân hàng hàng tháng để phát hiện phí bất thường.',
    'Tránh rút tiền mặt bằng thẻ tín dụng — phí rất cao.', 'Tận dụng dùng thử miễn phí trước khi mua gói trả phí dài hạn.',
    'Đặt giới hạn chi tiêu giải trí hàng tháng và tuân thủ.', 'Ưu tiên trải nghiệm hơn vật chất nếu ngân sách eo hẹp.',
    'Trước khi mua đồ đắt tiền, hãy "ngủ một đêm" rồi quyết định.', 'Theo dõi các khoản chi định kỳ (subscription) mỗi 3 tháng.',
    'Đặt mục tiêu tăng thu nhập song song với việc tiết kiệm.', 'Học thêm một kỹ năng mới để tăng khả năng thu nhập.',
    'Tìm kiếm nguồn thu nhập thụ động phù hợp với bạn.', 'Đầu tư vào bản thân là khoản đầu tư sinh lời bền vững nhất.',
    'Đừng so sánh tài chính của mình với người khác trên mạng xã hội.', 'Ăn mừng những cột mốc tài chính nhỏ để duy trì động lực.',
    'Chia sẻ mục tiêu tài chính với người thân để được hỗ trợ.', 'Dạy con về tiền bạc từ sớm bằng ví dụ thực tế.',
    'Đọc ít nhất 1 cuốn sách về tài chính cá nhân mỗi năm.', 'Theo dõi tin tức kinh tế cơ bản để hiểu bối cảnh đầu tư.',
    'Tránh quyết định tài chính lớn khi đang cảm xúc bất ổn.', 'Luôn có kế hoạch B cho các mục tiêu tài chính quan trọng.',
    'Đặt mục tiêu tự do tài chính rõ ràng, có con số cụ thể.', 'Tính toán số tiền cần thiết để nghỉ hưu sớm bằng quy tắc rút 4%.',
    'Kiểm tra lại các khoản chi "vô hình" như phí ngân hàng, phí duy trì thẻ.', 'Tận dụng ưu đãi mùa sale nhưng chỉ cho món đã có trong kế hoạch.',
    'Đặt ngân sách quà tặng, cưới hỏi, lễ Tết từ đầu năm.', 'Tránh mua đồ trả góp 0% nếu không thực sự cần thiết ngay.',
    'Kiểm tra tổng chi phí thực (bao gồm lãi, phí) trước khi mua trả góp.', 'Giữ thói quen xem báo cáo tài chính cá nhân mỗi tuần.',
    'Đặt mục tiêu giảm 1 khoản chi không cần thiết mỗi tháng.', 'Thử thách bản thân "không chi tiêu" 1 ngày mỗi tuần.',
    'Bán lại đồ không dùng đến để có thêm tiền tiết kiệm.', 'Tận dụng thư viện, ứng dụng miễn phí thay vì mua bản quyền không cần thiết.',
    'So sánh giá theo đơn vị (giá/100g, giá/lít) thay vì giá tổng.', 'Tự pha cà phê, trà tại nhà thay vì mua ngoài hàng ngày.',
    'Đi chung xe hoặc dùng phương tiện công cộng khi có thể.', 'Bảo dưỡng xe định kỳ để tránh chi phí sửa chữa lớn.',
    'Tắt các thiết bị điện không dùng để tiết kiệm hóa đơn điện.', 'So sánh giá bảo hiểm xe/nhà mỗi năm trước khi gia hạn.',
    'Tránh ký hợp đồng dài hạn khi chưa chắc chắn về nhu cầu.', 'Đặt câu hỏi "1 giờ làm việc của mình đáng giá bao nhiêu?" trước khi mua.',
    'Ghi lại lý do mỗi lần mua sắm ngoài kế hoạch để rút kinh nghiệm.', 'Ưu tiên trả trước khoản nợ lãi suất cao nhất (phương pháp Avalanche).',
    'Hoặc trả các khoản nợ nhỏ trước để tạo động lực (phương pháp Snowball).', 'Đừng vay để đầu tư nếu chưa hiểu rõ rủi ro.',
    'Giữ quỹ dự phòng riêng cho xe/nhà nếu bạn sở hữu.', 'Đặt mục tiêu tăng tỷ lệ tiết kiệm thêm 1% mỗi quý.',
    'Xem lại tất cả mục tiêu tài chính vào đầu mỗi năm mới.', 'Ưu tiên sức khỏe — chi phí y tế bất ngờ là rủi ro tài chính lớn nhất.',
    'Đầu tư thời gian tìm hiểu thay vì nghe theo lời khuyên đầu tư trên mạng xã hội.', 'Nhớ rằng tự do tài chính là hành trình, không phải đích đến duy nhất.',
    'Kiên nhẫn — của cải bền vững được xây dựng qua nhiều năm, không phải một đêm.'
  ];

  const CHATBOT_QA = [
    { keywords: ['ngân sách', 'budget'], answer: 'Bạn vào Quản lý tiền → tab Ngân sách để đặt hạn mức chi tiêu cho từng danh mục. App sẽ tự so sánh với chi tiêu thực tế mỗi tháng.' },
    { keywords: ['quỹ khẩn cấp', 'khẩn cấp'], answer: 'Quỹ khẩn cấp nên đủ 3-6 tháng chi phí sinh hoạt. Cập nhật số dư ở Quản lý tiền → tab Quỹ khẩn cấp.' },
    { keywords: ['nợ', 'vay', 'trả nợ'], answer: 'Ưu tiên trả khoản nợ lãi suất cao nhất trước (phương pháp Avalanche). Bạn có thể theo dõi ở Quản lý tiền → tab Nợ.' },
    { keywords: ['đầu tư', 'chứng khoán', 'cổ phiếu'], answer: 'VICTORY giúp bạn theo dõi phân bổ đầu tư ở Tăng trưởng tài sản → Danh mục đầu tư. Nên đa dạng hóa và chỉ đầu tư số tiền sẵn sàng chấp nhận rủi ro.' },
    { keywords: ['tự do tài chính', 'fire', 'nghỉ hưu'], answer: 'Vào Tăng trưởng tài sản → Máy tính Tự Do Tài Chính để xem số tiền bạn cần và số năm dự kiến, dựa trên chi phí sinh hoạt và tỷ lệ rút an toàn.' },
    { keywords: ['tiết kiệm'], answer: 'Mẹo nhanh: trích ít nhất 10-20% thu nhập để tiết kiệm ngay khi nhận lương, và tự động hóa việc này để không "quên".' },
    { keywords: ['thanh toán', 'giá', 'phí', '66'], answer: 'VICTORY cho dùng thử miễn phí 7 ngày. Sau đó phí duy trì là 66.000đ/tháng, thanh toán qua chuyển khoản VietQR ở phần Cài đặt.' },
    { keywords: ['coach', 'chuyên gia', 'tư vấn', 'đặt lịch'], answer: 'Bạn có thể đặt lịch tư vấn 1:1 với chuyên gia ở mục Tư vấn tài chính → Đặt lịch Coach.' },
    { keywords: ['mission', 'sứ mệnh', 'mục tiêu'], answer: 'Vào Thiết kế cuộc sống → Sứ mệnh (Mission Planner) để tạo mục tiêu và app sẽ tự tính số tiền cần tiết kiệm mỗi tháng.' }
  ];
  const CHATBOT_DEFAULT_ANSWER = 'Mình chưa có câu trả lời sẵn cho câu hỏi này. Bạn có thể đặt lịch với chuyên gia ở mục "Đặt lịch Coach" bên dưới để được tư vấn chi tiết hơn nhé!';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function assetTypeLabel(v) { return (ASSET_TYPES.find(t => t.value === v) || {}).label || v; }
  function goalCatMeta(v) { return LIFE_GOAL_CATEGORIES.find(c => c.value === v) || LIFE_GOAL_CATEGORIES[LIFE_GOAL_CATEGORIES.length - 1]; }
  function missionTypeLabel(v) { return (MISSION_TYPES.find(t => t.value === v) || {}).label || v; }

  function persist() {
    Store.maybeSnapshotNetWorth(state, Calc.netWorth(state));
    Store.save(state);
  }

  function rerender() { render(); }

  // ---------- Modal ----------
  function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

  function fieldHtml(f) {
    const style = f.full ? ' style="grid-column: 1 / -1;"' : '';
    if (f.type === 'select') {
      return `<div class="form-row"${style}><label>${esc(f.label)}</label><select id="f_${f.name}">${f.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(f.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="form-row"${style}><label>${esc(f.label)}</label><textarea id="f_${f.name}" rows="2">${esc(f.value || '')}</textarea></div>`;
    }
    if (f.type === 'checkbox') {
      return `<div class="form-row"${style}><label class="flex gap-8" style="align-items:center;"><input type="checkbox" id="f_${f.name}" ${f.value ? 'checked' : ''}/> ${esc(f.label)}</label></div>`;
    }
    return `<div class="form-row"${style}><label>${esc(f.label)}</label><input type="${f.type || 'text'}" id="f_${f.name}" value="${f.value !== undefined && f.value !== null ? esc(String(f.value)) : ''}" ${f.step ? `step="${f.step}"` : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.required ? 'required' : ''} placeholder="${esc(f.placeholder || '')}"/></div>`;
  }

  function openFormModal(opts) {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-backdrop" id="modalBackdrop">
        <div class="modal">
          <div class="modal-header">
            <h3>${esc(opts.title)}</h3>
            <button class="btn-icon" id="modalCloseBtn" type="button">✕</button>
          </div>
          <form id="modalForm">
            <div class="form-grid">${opts.fields.map(fieldHtml).join('')}</div>
            ${opts.extraHtml || ''}
            <div class="flex gap-8" style="margin-top:14px; justify-content:flex-end;">
              ${opts.onDelete ? '<button type="button" class="btn btn-danger" id="modalDeleteBtn" style="margin-right:auto;">Xóa</button>' : ''}
              <button type="button" class="btn btn-secondary" id="modalCancelBtn">Hủy</button>
              <button type="submit" class="btn btn-primary">${esc(opts.submitLabel || 'Lưu')}</button>
            </div>
          </form>
        </div>
      </div>`;
    document.getElementById('modalCloseBtn').onclick = closeModal;
    document.getElementById('modalCancelBtn').onclick = closeModal;
    document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal(); });
    if (opts.onDelete) {
      document.getElementById('modalDeleteBtn').onclick = () => { opts.onDelete(); closeModal(); };
    }
    const formEl = document.getElementById('modalForm');
    if (opts.afterRender) opts.afterRender(formEl);
    formEl.addEventListener('submit', e => {
      e.preventDefault();
      const data = {};
      opts.fields.forEach(f => {
        const el = document.getElementById('f_' + f.name);
        if (!el) return;
        if (f.type === 'checkbox') data[f.name] = el.checked;
        else if (f.type === 'number') data[f.name] = parseFloat(el.value) || 0;
        else data[f.name] = el.value;
      });
      opts.onSubmit(data);
      closeModal();
    });
  }

  // ---------- Payment / trial ----------
  function openPaymentModal() {
    if (!state.meta.paymentCode) { state.meta.paymentCode = Store.uid().toUpperCase(); persist(); }
    const code = state.meta.paymentCode;
    const isPaid = state.meta.paidUntil && state.meta.paidUntil > Date.now();
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-backdrop" id="modalBackdrop">
        <div class="modal">
          <div class="modal-header">
            <h3>💚 Đồng hành cùng VICTORY</h3>
            <button class="btn-icon" id="modalCloseBtn" type="button">✕</button>
          </div>
          ${isPaid ? `<div class="insight insight-success"><div class="insight-icon">✅</div><div><div class="insight-title">Đã thanh toán</div><p class="insight-msg">Còn hiệu lực tới ${new Date(state.meta.paidUntil).toLocaleDateString('vi-VN')}.</p></div></div>` : ''}
          <p class="muted">Cảm ơn bạn đã đồng hành cùng VICTORY! Ủng hộ <strong>${Calc.fmtVND(MONTHLY_PRICE)}/tháng</strong> để tiếp tục sử dụng và giúp đội ngũ duy trì, phát triển ứng dụng.</p>
          <img src="${vietqrUrl(code)}" alt="Mã VietQR thanh toán VICTORY" style="width:100%; max-width:260px; display:block; margin:0 auto 14px; border-radius:12px; border:1px solid var(--border);" />
          <p class="small-note" style="text-align:center;">Quét bằng app ngân hàng bất kỳ (hỗ trợ VietQR/Napas 247). Nội dung chuyển khoản đã tự điền mã <strong>VICTORY-${esc(code)}</strong> — giữ nguyên nội dung này để đối chiếu.</p>
          ${SEPAY_WORKER_URL ? `
            <div id="paymentCheckResult" class="small-note" style="text-align:center; min-height:16px;"></div>
            <button type="button" class="btn btn-secondary" id="checkPaymentBtn" style="width:100%; margin-top:8px;">🔄 Tôi đã chuyển khoản — Kiểm tra ngay</button>
          ` : `<p class="small-note" style="text-align:center;">Sau khi chuyển khoản, gửi ảnh biên lai tới <strong>${PAYMENT_CONTACT_EMAIL}</strong> để được xác nhận nhé!</p>`}
          <div class="flex gap-8" style="margin-top:16px; justify-content:flex-end;">
            <button type="button" class="btn btn-primary" id="modalCancelBtn">Tôi đã hiểu</button>
          </div>
        </div>
      </div>`;
    document.getElementById('modalCloseBtn').onclick = closeModal;
    document.getElementById('modalCancelBtn').onclick = closeModal;
    document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal(); });
    const checkBtn = document.getElementById('checkPaymentBtn');
    if (checkBtn) {
      checkBtn.onclick = async () => {
        const resultEl = document.getElementById('paymentCheckResult');
        checkBtn.disabled = true;
        resultEl.textContent = 'Đang kiểm tra...';
        try {
          const res = await fetch(SEPAY_WORKER_URL + '/status?code=' + encodeURIComponent(code));
          const data = await res.json();
          if (data.paid) {
            state.meta.paidUntil = data.paidUntil;
            persist();
            resultEl.textContent = '✅ Đã ghi nhận thanh toán! Cảm ơn bạn.';
            setTimeout(() => { closeModal(); rerender(); }, 1200);
          } else {
            resultEl.textContent = 'Chưa thấy giao dịch. Giao dịch thường được ghi nhận trong vài phút, thử lại sau nhé.';
          }
        } catch (e) {
          resultEl.textContent = 'Không kiểm tra được lúc này, vui lòng thử lại.';
        }
        checkBtn.disabled = false;
      };
    }
  }

  function isPaidActive() {
    return !!(state.meta.paidUntil && state.meta.paidUntil > Date.now());
  }

  function trialBannerHtml() {
    if (isPaidActive()) return '';
    const days = Calc.daysSinceInstall(state);
    if (days < TRIAL_DAYS) return '';
    if (localStorage.getItem(BANNER_DISMISS_KEY) === Calc.localISODate(new Date())) return '';
    return `
      <div class="card section-gap" id="trialBanner" style="border:1px solid var(--gold); background:var(--gold-light); display:flex; align-items:center; gap:12px;">
        <div style="font-size:22px;">💚</div>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:13.5px;">Bạn đã dùng thử VICTORY được ${days} ngày</div>
          <p class="muted" style="margin:2px 0 0;">Ủng hộ ${Calc.fmtVND(MONTHLY_PRICE)}/tháng để tiếp tục đồng hành cùng VICTORY nhé!</p>
        </div>
        <button class="btn btn-primary btn-sm" id="trialPayBtn">Thanh toán</button>
        <button class="btn-icon" id="trialDismissBtn" title="Để sau">✕</button>
      </div>`;
  }

  function wireTrialBanner() {
    const payBtn = document.getElementById('trialPayBtn');
    const dismissBtn = document.getElementById('trialDismissBtn');
    if (payBtn) payBtn.onclick = openPaymentModal;
    if (dismissBtn) dismissBtn.onclick = () => {
      localStorage.setItem(BANNER_DISMISS_KEY, Calc.localISODate(new Date()));
      document.getElementById('trialBanner').remove();
    };
  }

  // ---------- Transaction modal ----------
  function categoryOptions(type) {
    return (state.categories[type] || []).map(c => ({ value: c, label: c }));
  }

  function openTransactionModal(tx) {
    const isEdit = !!tx;
    openFormModal({
      title: isEdit ? 'Sửa giao dịch' : 'Thêm giao dịch',
      submitLabel: 'Lưu giao dịch',
      fields: [
        { name: 'type', label: 'Loại', type: 'select', full: true, value: tx ? tx.type : 'expense', options: [{ value: 'expense', label: 'Chi tiêu' }, { value: 'income', label: 'Thu nhập' }] },
        { name: 'date', label: 'Ngày', type: 'date', value: tx ? tx.date.slice(0, 10) : Calc.localISODate(new Date()), required: true },
        { name: 'amount', label: 'Số tiền (₫)', type: 'number', step: '1000', min: '0', value: tx ? tx.amount : '', required: true },
        { name: 'category', label: 'Danh mục', type: 'select', full: true, value: tx ? tx.category : (state.categories.expense[0] || ''), options: categoryOptions(tx ? tx.type : 'expense') },
        { name: 'note', label: 'Ghi chú', type: 'textarea', full: true, value: tx ? tx.note : '' }
      ],
      afterRender: (form) => {
        const typeSel = form.querySelector('#f_type');
        typeSel.addEventListener('change', () => {
          const catSel = form.querySelector('#f_category');
          const opts = categoryOptions(typeSel.value);
          catSel.innerHTML = opts.map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
        });
      },
      onDelete: isEdit ? () => { state.transactions = state.transactions.filter(t => t.id !== tx.id); persist(); rerender(); } : null,
      onSubmit: (data) => {
        if (isEdit) {
          Object.assign(tx, data);
        } else {
          state.transactions.push({ id: Store.uid(), ...data });
        }
        persist();
        rerender();
      }
    });
  }

  // ---------- Router ----------
  const ROUTES = {
    dashboard: { title: 'Tổng quan', sub: 'Hành trình tự do tài chính của bạn', render: renderDashboard },
    money: { title: 'Quản lý tiền', sub: 'Kiểm soát dòng tiền của bạn', render: renderMoney },
    wealth: { title: 'Tăng trưởng tài sản', sub: 'Làm cho tiền sinh ra tiền', render: renderWealth },
    life: { title: 'Thiết kế cuộc sống', sub: 'Kết nối mục tiêu sống với kế hoạch tài chính', render: renderLife },
    bonus: { title: 'Bonus dành cho bạn', sub: 'Khóa học, cẩm nang, mẹo và thử thách 30 ngày', render: renderBonus },
    advisory: { title: 'Tư vấn tài chính', sub: 'Phân bổ dòng tiền, chatbot và Coach 1:1', render: renderAdvisory },
    settings: { title: 'Cài đặt', sub: 'Hồ sơ, danh mục và dữ liệu', render: renderSettings }
  };

  function currentRouteKey() {
    const h = location.hash.replace('#/', '') || 'dashboard';
    return ROUTES[h] ? h : 'dashboard';
  }

  function render() {
    const key = currentRouteKey();
    const route = ROUTES[key];
    document.getElementById('pageTitle').textContent = route.title;
    document.getElementById('pageSub').textContent = route.sub;
    document.querySelectorAll('.nav-link, .mobile-nav a').forEach(a => a.classList.toggle('active', a.dataset.route === key));
    const content = document.getElementById('content');
    content.innerHTML = '';
    route.render(content);
  }

  // ---------- Small render helpers ----------
  function statCard(icon, label, value, sub) {
    return `<div class="card"><div class="metric-icon">${icon}</div><div class="card-title">${esc(label)}</div><div class="metric-value">${value}</div>${sub ? `<div class="metric-sub">${sub}</div>` : ''}</div>`;
  }

  function emptyState(emoji, text) {
    return `<div class="empty-state"><div class="emoji">${emoji}</div><p>${esc(text)}</p></div>`;
  }

  // ---------- DASHBOARD ----------
  const MISSION_ICON = {
    buy_house: { icon: '🏠', bg: '#dbeafe' },
    travel: { icon: '🌍', bg: '#dcfce7' },
    retire_early: { icon: '🌱', bg: '#ede9fe' },
    custom: { icon: '🎯', bg: '#fef3c7' }
  };

  function greetingPhrase() {
    const h = new Date().getHours();
    if (h < 11) return 'Chào buổi sáng';
    if (h < 14) return 'Chào buổi trưa';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  function ratingClass(label) {
    if (label === 'Rất tốt' || label === 'Tốt') return 'rating-good';
    if (label === 'Khá') return 'rating-ok';
    return 'rating-bad';
  }

  function renderDashboard(content) {
    const progress = Calc.freedomProgress(state);
    const netWorth = Calc.netWorth(state);
    const passiveInc = Calc.monthlyPassiveIncome(state);
    const monthsCovered = Calc.monthsCoveredByPassiveIncome(state);
    const years = Calc.yearsToFI(state);
    const projectedAge = Calc.projectedFreedomAge(state);
    const scores = Calc.victoryScores(state);
    const overall = Calc.overallVictoryScore(scores);
    const netWorthChange = Calc.netWorthChangePct(state);
    const incThis = Calc.monthlyIncome(state);
    const expThis = Calc.monthlyExpense(state);
    const investAssets = Calc.totalInvestableAssets(state);
    const saveAssets = Calc.totalCashLikeAssets(state);
    const sRate = Calc.savingsRate(state);
    const insights = Calc.generateInsights(state);
    const topInsight = insights[0];
    const displayName = state.profile.name || 'bạn';
    const initial = (state.profile.name || 'V').trim().charAt(0).toUpperCase();

    const cashFlowLabel = sRate >= 0.2 ? 'Rất tốt' : sRate >= 0.1 ? 'Tốt' : sRate >= 0 ? 'Khá' : 'Cần cải thiện';
    const debtRatio = Calc.debtToIncomeRatio(state);
    const debtLabel = debtRatio < 0.2 ? 'Rất tốt' : debtRatio < 0.4 ? 'Tốt' : debtRatio < 0.6 ? 'Khá' : 'Cần cải thiện';
    const savingLabel = Calc.ratingLabel(scores.savingScore);
    const investLabel = Calc.ratingLabel(scores.investmentScore);
    const overallRating = Calc.ratingLabel(overall);

    const topMissions = state.missions.slice(0, 3);

    content.innerHTML = `
      ${trialBannerHtml()}
      <div class="greeting-row">
        <div class="avatar">${esc(initial)}</div>
        <div>
          <p class="greeting-name">${esc(greetingPhrase())}, ${esc(displayName)}</p>
          <p class="greeting-sub">Hành trình tự do tài chính đang chờ bạn hôm nay</p>
        </div>
        <button class="bell-btn" id="bellBtn" title="Xem gợi ý">🔔</button>
      </div>

      <div class="hero-card">
        <div class="hero-gauge-wrap" id="heroGauge"></div>
        <div class="hero-text">
          <div class="hero-label">Tiến độ tự do tài chính</div>
          <div class="hero-headline">${sRate >= 0.15 ? 'Bạn đang đi đúng hướng! 🎉' : 'Hãy tăng tốc để về đích sớm hơn 💪'}</div>
          ${projectedAge ? `<p class="hero-detail">Dự kiến đạt tự do tài chính ở tuổi <strong>${projectedAge}</strong></p>` : ''}
          <p class="hero-detail">${years === Infinity ? 'Cần thêm dữ liệu thu nhập/chi tiêu để dự đoán' : `Còn khoảng <strong>${years.toFixed(1)} năm</strong> nữa`}</p>
        </div>
      </div>

      <div class="insight insight-info section-gap" style="margin-top:16px;">
        <div class="insight-icon">💡</div>
        <div><div class="insight-title">Mẹo hôm nay</div><p class="insight-msg">${esc(SPENDING_TIPS[Math.floor(Date.now() / 86400000) % SPENDING_TIPS.length])}</p></div>
      </div>

      <div class="card section-gap" id="netWorthCard" style="cursor:pointer;">
        <div class="card-title">Giá trị tài sản ròng</div>
        <div class="flex" style="align-items:baseline; gap:10px;">
          <div class="metric-value">${Calc.fmtCompactVND(netWorth)}</div>
          ${netWorthChange !== null ? `<span class="change-badge ${netWorthChange >= 0 ? 'change-up' : 'change-down'}">${netWorthChange >= 0 ? '↑' : '↓'} ${Math.abs(netWorthChange).toFixed(1)}%</span>` : ''}
        </div>
        <p class="metric-sub">${netWorthChange !== null ? 'So với khoảng 1 tháng trước · ' : ''}Chạm để xem chi tiết tài sản →</p>
        <div class="stat-circle-row">
          <div class="stat-circle-item"><div class="stat-circle stat-circle-income">💰</div><div class="stat-circle-label">Thu nhập</div><div class="stat-circle-value">${Calc.fmtCompactVND(incThis)}</div></div>
          <div class="stat-circle-item"><div class="stat-circle stat-circle-expense">🛍️</div><div class="stat-circle-label">Chi tiêu</div><div class="stat-circle-value">${Calc.fmtCompactVND(expThis)}</div></div>
          <div class="stat-circle-item"><div class="stat-circle stat-circle-invest">📈</div><div class="stat-circle-label">Đầu tư</div><div class="stat-circle-value">${Calc.fmtCompactVND(investAssets)}</div></div>
          <div class="stat-circle-item"><div class="stat-circle stat-circle-save">🐷</div><div class="stat-circle-label">Tiết kiệm</div><div class="stat-circle-value">${Calc.fmtCompactVND(saveAssets)}</div></div>
        </div>
      </div>

      <div class="card section-gap">
        <div class="card-title-row"><h3>🌟 Mục tiêu cuộc sống</h3><a href="#/life" class="small-note" style="font-weight:700;">Xem tất cả →</a></div>
        ${topMissions.length ? topMissions.map(m => {
          const meta = MISSION_ICON[m.type] || MISSION_ICON.custom;
          const pct = m.targetAmount ? Math.min(100, ((m.currentSaved || 0) / m.targetAmount) * 100) : 0;
          return `<div class="goal-preview-item">
            <div class="goal-avatar" style="background:${meta.bg}">${meta.icon}</div>
            <div class="goal-preview-body">
              <div class="goal-preview-title">${esc(m.title)}</div>
              <div class="progress-track" style="margin:0;"><div class="progress-fill" style="width:${pct}%"></div></div>
              <div class="goal-preview-amount">Đã tiết kiệm: ${Calc.fmtCompactVND(m.currentSaved || 0)} / ${Calc.fmtCompactVND(m.targetAmount || 0)}</div>
            </div>
            <div class="goal-preview-pct">${pct.toFixed(0)}%</div>
          </div>`;
        }).join('') : emptyState('🌟', 'Chưa có sứ mệnh nào. Thêm mục tiêu ở mục Thiết kế cuộc sống.')}
      </div>

      <div class="grid grid-2 section-gap">
        <div class="card">
          <div class="card-title-row"><h3>Sức khỏe tài chính</h3></div>
          <div class="gauge-score-wrap">
            <div id="scoreGauge"></div>
            <div class="gauge-score-value">${overall}/100</div>
            <div class="gauge-score-rating">${esc(overallRating)}</div>
          </div>
          <div class="badge-row">
            <div class="badge-chip"><div class="badge-chip-icon">💵</div><div class="badge-chip-label">Dòng tiền</div><div class="badge-chip-value ${ratingClass(cashFlowLabel)}">${esc(cashFlowLabel)}</div></div>
            <div class="badge-chip"><div class="badge-chip-icon">🐷</div><div class="badge-chip-label">Tiết kiệm</div><div class="badge-chip-value ${ratingClass(savingLabel)}">${esc(savingLabel)}</div></div>
            <div class="badge-chip"><div class="badge-chip-icon">📈</div><div class="badge-chip-label">Đầu tư</div><div class="badge-chip-value ${ratingClass(investLabel)}">${esc(investLabel)}</div></div>
            <div class="badge-chip"><div class="badge-chip-icon">💳</div><div class="badge-chip-label">Nợ phải trả</div><div class="badge-chip-value ${ratingClass(debtLabel)}">${esc(debtLabel)}</div></div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-title">Thu nhập thụ động</div>
            <div class="metric-value">${Calc.fmtCompactVND(passiveInc)}<span style="font-size:13px; color:var(--text-muted); font-weight:600;">/tháng</span></div>
            <p class="metric-sub">Đủ chi trả ${isFinite(monthsCovered) ? monthsCovered.toFixed(1) : '0'} tháng chi phí sinh hoạt</p>
          </div>
          ${topInsight ? `<div class="coach-card section-gap">
            <div class="coach-avatar">🤖</div>
            <div>
              <div class="coach-title">AI Coach</div>
              <p class="coach-msg">${esc(topInsight.message)}</p>
              <a href="#" id="viewAllInsights" class="coach-link">Xem chi tiết ›</a>
            </div>
          </div>` : ''}
        </div>
      </div>

      <div class="grid grid-2 section-gap">
        <div class="card">
          <div class="card-title-row"><h3>Tài sản ròng theo thời gian</h3></div>
          <div id="netWorthChart"></div>
        </div>
        <div class="card">
          <div class="card-title-row"><h3>Điểm VICTORY (7 trụ cột)</h3></div>
          <div id="radarChart" class="flex" style="justify-content:center;"></div>
        </div>
      </div>
      <div class="card section-gap" id="insightsCard">
        <div class="card-title-row"><h3>💬 Toàn bộ gợi ý từ VICTORY Coach</h3></div>
        <div id="insightsList"></div>
      </div>
    `;

    Charts.gaugeCircle(document.getElementById('heroGauge'), { percent: progress, size: 120, thickness: 11, fillColor: '#f5c451', trackColor: 'rgba(255,255,255,0.22)', centerLabel: progress.toFixed(0) + '%' });
    Charts.gaugeArc(document.getElementById('scoreGauge'), { value: overall, max: 100, size: 170, thickness: 14 });
    Charts.lineChart(document.getElementById('netWorthChart'), state.netWorthHistory.map(h => ({ value: h.value })));
    Charts.radarChart(document.getElementById('radarChart'), [
      { label: 'Sức khỏe TC', value: scores.financialHealth },
      { label: 'Tiết kiệm', value: scores.savingScore },
      { label: 'Đầu tư', value: scores.investmentScore },
      { label: 'TN thụ động', value: scores.passiveIncomeScore },
      { label: 'Tự do TC', value: scores.freedomScore },
      { label: 'Cuộc sống', value: scores.lifestyleScore },
      { label: 'Đóng góp', value: scores.impactScore }
    ]);

    document.getElementById('insightsList').innerHTML = insights.map(i => `
      <div class="insight insight-${i.tone}">
        <div class="insight-icon">${i.icon}</div>
        <div><div class="insight-title">${esc(i.title)}</div><p class="insight-msg">${esc(i.message)}</p></div>
      </div>`).join('');

    document.getElementById('netWorthCard').addEventListener('click', () => { location.hash = '#/wealth'; });
    const bellBtn = document.getElementById('bellBtn');
    if (bellBtn) bellBtn.addEventListener('click', () => document.getElementById('insightsCard').scrollIntoView({ behavior: 'smooth' }));
    const viewAllLink = document.getElementById('viewAllInsights');
    if (viewAllLink) viewAllLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('insightsCard').scrollIntoView({ behavior: 'smooth' }); });
    wireTrialBanner();
  }

  // ---------- MONEY ----------
  function renderMoney(content) {
    content.innerHTML = `
      <div class="pill-nav">
        <button class="pill-btn" data-tab="transactions">Giao dịch</button>
        <button class="pill-btn" data-tab="budgets">Ngân sách</button>
        <button class="pill-btn" data-tab="emergency">Quỹ khẩn cấp</button>
        <button class="pill-btn" data-tab="debts">Nợ</button>
      </div>
      <div id="moneyTabBody"></div>
    `;
    content.querySelectorAll('.pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === ui.moneyTab);
      b.addEventListener('click', () => { ui.moneyTab = b.dataset.tab; renderMoney(content); });
    });
    const body = document.getElementById('moneyTabBody');
    if (ui.moneyTab === 'transactions') renderTransactionsTab(body);
    else if (ui.moneyTab === 'budgets') renderBudgetsTab(body);
    else if (ui.moneyTab === 'emergency') renderEmergencyTab(body);
    else renderDebtsTab(body);
  }

  function shiftMonth(mKey, delta) {
    const [y, m] = mKey.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return Calc.monthKey(d);
  }
  function monthLabel(mKey) {
    const [y, m] = mKey.split('-').map(Number);
    return `Tháng ${m}/${y}`;
  }

  function renderTransactionsTab(body) {
    const mKey = ui.txMonth;
    const list = state.transactions.filter(t => Calc.monthKey(t.date) === mKey).sort((a, b) => b.date.localeCompare(a.date));
    const inc = Calc.monthlyIncome(state, mKey);
    const exp = Calc.monthlyExpense(state, mKey);
    body.innerHTML = `
      <div class="flex-between section-gap" style="margin-top:0;">
        <div class="flex gap-8" style="align-items:center;">
          <button class="btn btn-secondary btn-sm" id="prevMonth">‹</button>
          <strong>${monthLabel(mKey)}</strong>
          <button class="btn btn-secondary btn-sm" id="nextMonth">›</button>
        </div>
        <button class="btn btn-primary btn-sm" id="addTxBtn">+ Thêm giao dịch</button>
      </div>
      <div class="grid grid-3 section-gap">
        ${statCard('💚', 'Thu nhập', Calc.fmtCompactVND(inc))}
        ${statCard('❤️', 'Chi tiêu', Calc.fmtCompactVND(exp))}
        ${statCard('⚖️', 'Chênh lệch', Calc.fmtCompactVND(inc - exp))}
      </div>
      <div class="card section-gap">
        ${list.length ? list.map(t => `
          <div class="tx-row">
            <div class="tx-icon tx-icon-${t.type}">${t.type === 'income' ? '↓' : '↑'}</div>
            <div class="tx-body">
              <div class="tx-category">${esc(t.category)}</div>
              <div class="tx-meta">${esc(t.date.slice(0, 10))}${t.note ? ' · ' + esc(t.note) : ''}</div>
            </div>
            <div class="tx-right">
              <div class="tx-amount amount-${t.type}">${t.type === 'income' ? '+' : '-'}${Calc.fmtVND(t.amount)}</div>
              <button class="btn-icon tx-edit-btn" data-edit-tx="${t.id}">✏️</button>
            </div>
          </div>`).join('') : emptyState('🧾', 'Chưa có giao dịch nào trong tháng này.')}
      </div>
    `;
    document.getElementById('prevMonth').onclick = () => { ui.txMonth = shiftMonth(mKey, -1); renderMoney(body.parentElement); };
    document.getElementById('nextMonth').onclick = () => { ui.txMonth = shiftMonth(mKey, 1); renderMoney(body.parentElement); };
    document.getElementById('addTxBtn').onclick = () => openTransactionModal(null);
    body.querySelectorAll('[data-edit-tx]').forEach(btn => {
      btn.onclick = () => openTransactionModal(state.transactions.find(t => t.id === btn.dataset.editTx));
    });
  }

  function renderBudgetsTab(body) {
    const mKey = Calc.currentMonthKey();
    const spentByCat = {};
    state.transactions.filter(t => t.type === 'expense' && Calc.monthKey(t.date) === mKey).forEach(t => { spentByCat[t.category] = (spentByCat[t.category] || 0) + t.amount; });
    const bars = state.budgets.map(b => ({ label: b.category, value: spentByCat[b.category] || 0, limit: b.monthlyLimit }));
    body.innerHTML = `
      <div class="flex-between section-gap" style="margin-top:0;">
        <p class="muted" style="margin:0;">Ngân sách tháng ${monthLabel(mKey).replace('Tháng ', '')}</p>
        <button class="btn btn-primary btn-sm" id="addBudgetBtn">+ Thêm ngân sách</button>
      </div>
      <div class="card section-gap"><div id="budgetChart"></div></div>
      <div class="card section-gap">
        ${state.budgets.length ? `<table><thead><tr><th>Danh mục</th><th class="text-right">Hạn mức</th><th class="text-right">Đã chi</th><th class="text-right">Còn lại</th><th></th></tr></thead><tbody>
        ${state.budgets.map(b => {
          const spent = spentByCat[b.category] || 0;
          const remain = b.monthlyLimit - spent;
          return `<tr><td>${esc(b.category)}</td><td class="text-right">${Calc.fmtVND(b.monthlyLimit)}</td><td class="text-right">${Calc.fmtVND(spent)}</td><td class="text-right" style="color:${remain < 0 ? 'var(--red)' : 'var(--green-dark)'}">${Calc.fmtVND(remain)}</td><td class="text-right"><button class="btn-icon" data-edit-budget="${esc(b.category)}">✏️</button></td></tr>`;
        }).join('')}
        </tbody></table>` : emptyState('📊', 'Chưa có ngân sách nào. Thêm ngân sách để kiểm soát chi tiêu.')}
      </div>
    `;
    Charts.barChart(document.getElementById('budgetChart'), bars);
    document.getElementById('addBudgetBtn').onclick = () => openBudgetModal(null);
    body.querySelectorAll('[data-edit-budget]').forEach(btn => {
      btn.onclick = () => openBudgetModal(state.budgets.find(b => b.category === btn.dataset.editBudget));
    });
  }

  function openBudgetModal(b) {
    const isEdit = !!b;
    const usedCats = state.budgets.map(x => x.category);
    const available = state.categories.expense.filter(c => isEdit ? c === b.category : !usedCats.includes(c));
    if (!available.length && !isEdit) { alert('Tất cả danh mục chi tiêu đã có ngân sách.'); return; }
    openFormModal({
      title: isEdit ? 'Sửa ngân sách' : 'Thêm ngân sách',
      fields: [
        { name: 'category', label: 'Danh mục', type: 'select', full: true, value: b ? b.category : available[0], options: available.map(c => ({ value: c, label: c })) },
        { name: 'monthlyLimit', label: 'Hạn mức / tháng (₫)', type: 'number', full: true, step: '10000', value: b ? b.monthlyLimit : '', required: true }
      ],
      onDelete: isEdit ? () => { state.budgets = state.budgets.filter(x => x.category !== b.category); persist(); rerender(); } : null,
      onSubmit: (data) => {
        if (isEdit) { b.monthlyLimit = data.monthlyLimit; }
        else state.budgets.push({ category: data.category, monthlyLimit: data.monthlyLimit });
        persist(); rerender();
      }
    });
  }

  function renderEmergencyTab(body) {
    const exp = state.profile.monthlyExpenseTarget || Calc.last3MonthsAvg(state, Calc.monthlyExpense);
    const months = exp > 0 ? (state.emergencyFund.current || 0) / exp : 0;
    const targetMonths = exp > 0 ? (state.emergencyFund.target || 0) / exp : 0;
    const pct = state.emergencyFund.target > 0 ? Math.min(100, (state.emergencyFund.current / state.emergencyFund.target) * 100) : 0;
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0;">
        <div class="card-title-row"><h3>🛟 Quỹ khẩn cấp</h3><button class="btn btn-secondary btn-sm" id="editEmergencyBtn">Chỉnh sửa</button></div>
        <div class="metric-value">${Calc.fmtCompactVND(state.emergencyFund.current || 0)} <span class="muted" style="font-size:14px;">/ ${Calc.fmtCompactVND(state.emergencyFund.target || 0)}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <p class="muted">Hiện đủ dùng <strong>${months.toFixed(1)}</strong> tháng chi phí ${targetMonths ? `(mục tiêu ${targetMonths.toFixed(1)} tháng)` : ''}. Khuyến nghị: 3-6 tháng chi phí sinh hoạt.</p>
      </div>
    `;
    document.getElementById('editEmergencyBtn').onclick = () => {
      openFormModal({
        title: 'Cập nhật quỹ khẩn cấp',
        fields: [
          { name: 'current', label: 'Số dư hiện tại (₫)', type: 'number', step: '10000', value: state.emergencyFund.current || 0 },
          { name: 'target', label: 'Mục tiêu (₫)', type: 'number', step: '10000', value: state.emergencyFund.target || 0 }
        ],
        onSubmit: (data) => { state.emergencyFund = data; persist(); rerender(); }
      });
    };
  }

  function renderDebtsTab(body) {
    const total = Calc.totalDebtRemaining(state);
    body.innerHTML = `
      <div class="flex-between section-gap" style="margin-top:0;">
        <div>${statCard('💳', 'Tổng nợ còn lại', Calc.fmtCompactVND(total))}</div>
      </div>
      <div class="card section-gap">
        <div class="card-title-row"><h3>Danh sách khoản nợ</h3><button class="btn btn-primary btn-sm" id="addDebtBtn">+ Thêm khoản nợ</button></div>
        ${state.debts.length ? `<table><thead><tr><th>Tên</th><th class="text-right">Gốc</th><th class="text-right">Còn lại</th><th class="text-right">Lãi suất/năm</th><th class="text-right">Trả/tháng</th><th></th></tr></thead><tbody>
        ${state.debts.map(d => `<tr>
          <td>${esc(d.name)}</td>
          <td class="text-right">${Calc.fmtVND(d.principal)}</td>
          <td class="text-right">${Calc.fmtVND(d.remaining)}</td>
          <td class="text-right">${Math.round((d.interestRate || 0) * 100)}%</td>
          <td class="text-right">${Calc.fmtVND(d.monthlyPayment)}</td>
          <td class="text-right"><button class="btn-icon" data-edit-debt="${d.id}">✏️</button></td>
        </tr>`).join('')}</tbody></table>` : emptyState('💳', 'Không có khoản nợ nào. Tuyệt vời!')}
      </div>
    `;
    document.getElementById('addDebtBtn').onclick = () => openDebtModal(null);
    body.querySelectorAll('[data-edit-debt]').forEach(btn => {
      btn.onclick = () => openDebtModal(state.debts.find(d => d.id === btn.dataset.editDebt));
    });
  }

  function openDebtModal(d) {
    const isEdit = !!d;
    openFormModal({
      title: isEdit ? 'Sửa khoản nợ' : 'Thêm khoản nợ',
      fields: [
        { name: 'name', label: 'Tên khoản nợ', type: 'text', full: true, value: d ? d.name : '', required: true },
        { name: 'principal', label: 'Số tiền gốc (₫)', type: 'number', step: '10000', value: d ? d.principal : '' },
        { name: 'remaining', label: 'Còn lại (₫)', type: 'number', step: '10000', value: d ? d.remaining : '' },
        { name: 'interestRatePct', label: 'Lãi suất / năm (%)', type: 'number', step: '0.1', value: d ? (d.interestRate * 100) : '' },
        { name: 'monthlyPayment', label: 'Trả hàng tháng (₫)', type: 'number', step: '10000', value: d ? d.monthlyPayment : '' }
      ],
      onDelete: isEdit ? () => { state.debts = state.debts.filter(x => x.id !== d.id); persist(); rerender(); } : null,
      onSubmit: (data) => {
        const payload = { name: data.name, principal: data.principal, remaining: data.remaining, interestRate: (data.interestRatePct || 0) / 100, monthlyPayment: data.monthlyPayment };
        if (isEdit) Object.assign(d, payload);
        else state.debts.push({ id: Store.uid(), ...payload });
        persist(); rerender();
      }
    });
  }

  // ---------- WEALTH ----------
  function renderWealth(content) {
    content.innerHTML = `
      <div class="pill-nav">
        <button class="pill-btn" data-tab="assets">Tài sản</button>
        <button class="pill-btn" data-tab="allocation">Danh mục đầu tư</button>
        <button class="pill-btn" data-tab="passive">Thu nhập thụ động</button>
        <button class="pill-btn" data-tab="fire">Máy tính Tự Do Tài Chính</button>
      </div>
      <div id="wealthTabBody"></div>
    `;
    content.querySelectorAll('.pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === ui.wealthTab);
      b.addEventListener('click', () => { ui.wealthTab = b.dataset.tab; renderWealth(content); });
    });
    const body = document.getElementById('wealthTabBody');
    if (ui.wealthTab === 'assets') renderAssetsTab(body);
    else if (ui.wealthTab === 'allocation') renderAllocationTab(body);
    else if (ui.wealthTab === 'passive') renderPassiveTab(body);
    else renderFireTab(body);
  }

  function renderAssetsTab(body) {
    const total = Calc.totalAssets(state);
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0;">
        <div class="card-title-row"><h3>Tài sản ròng theo thời gian</h3></div>
        <div id="assetsLineChart"></div>
      </div>
      <div class="card section-gap">
        <div class="card-title-row"><h3>Danh sách tài sản (Tổng: ${Calc.fmtCompactVND(total)})</h3><button class="btn btn-primary btn-sm" id="addAssetBtn">+ Thêm tài sản</button></div>
        ${state.assets.length ? `<table><thead><tr><th>Tên</th><th>Loại</th><th class="text-right">Giá trị</th><th></th></tr></thead><tbody>
        ${state.assets.map(a => `<tr><td>${esc(a.name)}</td><td class="muted">${esc(assetTypeLabel(a.type))}</td><td class="text-right">${Calc.fmtVND(a.value)}</td><td class="text-right"><button class="btn-icon" data-edit-asset="${a.id}">✏️</button></td></tr>`).join('')}
        </tbody></table>` : emptyState('💼', 'Chưa có tài sản nào được ghi nhận.')}
      </div>
    `;
    Charts.lineChart(document.getElementById('assetsLineChart'), state.netWorthHistory.map(h => ({ value: h.value })));
    document.getElementById('addAssetBtn').onclick = () => openAssetModal(null);
    body.querySelectorAll('[data-edit-asset]').forEach(btn => {
      btn.onclick = () => openAssetModal(state.assets.find(a => a.id === btn.dataset.editAsset));
    });
  }

  function openAssetModal(a) {
    const isEdit = !!a;
    openFormModal({
      title: isEdit ? 'Sửa tài sản' : 'Thêm tài sản',
      fields: [
        { name: 'name', label: 'Tên tài sản', type: 'text', full: true, value: a ? a.name : '', required: true },
        { name: 'type', label: 'Loại', type: 'select', value: a ? a.type : 'saving', options: ASSET_TYPES },
        { name: 'value', label: 'Giá trị (₫)', type: 'number', step: '10000', value: a ? a.value : '', required: true }
      ],
      onDelete: isEdit ? () => { state.assets = state.assets.filter(x => x.id !== a.id); persist(); rerender(); } : null,
      onSubmit: (data) => {
        if (isEdit) Object.assign(a, data);
        else state.assets.push({ id: Store.uid(), ...data });
        persist(); rerender();
      }
    });
  }

  function renderAllocationTab(body) {
    const byType = {};
    state.assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + (Number(a.value) || 0); });
    const segments = Object.keys(byType).map((t, i) => ({ label: assetTypeLabel(t), value: byType[t], color: PALETTE[i % PALETTE.length] }));
    const total = segments.reduce((s, x) => s + x.value, 0);
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0;">
        <div class="card-title-row"><h3>Phân bổ tài sản</h3></div>
        <div class="flex" style="gap:24px; flex-wrap:wrap; align-items:center;">
          <div id="allocDonut"></div>
          <div class="legend" style="flex-direction:column; align-items:flex-start;">
            ${segments.length ? segments.map(s => `<div class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${esc(s.label)}: ${total ? Math.round(s.value / total * 100) : 0}% (${Calc.fmtCompactVND(s.value)})</div>`).join('') : '<span class="muted">Chưa có tài sản</span>'}
          </div>
        </div>
      </div>
    `;
    Charts.donutChart(document.getElementById('allocDonut'), segments);
  }

  function renderPassiveTab(body) {
    const total = Calc.monthlyPassiveIncome(state);
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0;">
        <div class="card-title-row"><h3>Thu nhập thụ động (Tổng: ${Calc.fmtCompactVND(total)}/tháng)</h3><button class="btn btn-primary btn-sm" id="addPassiveBtn">+ Thêm nguồn</button></div>
        ${state.passiveIncomes.length ? `<table><thead><tr><th>Nguồn thu</th><th class="text-right">Số tiền / tháng</th><th></th></tr></thead><tbody>
        ${state.passiveIncomes.map(p => `<tr><td>${esc(p.source)}</td><td class="text-right">${Calc.fmtVND(p.monthlyAmount)}</td><td class="text-right"><button class="btn-icon" data-edit-passive="${p.id}">✏️</button></td></tr>`).join('')}
        </tbody></table>` : emptyState('📈', 'Chưa có nguồn thu nhập thụ động nào. Cổ tức, cho thuê, lãi tiết kiệm... đều tính.')}
      </div>
    `;
    document.getElementById('addPassiveBtn').onclick = () => openPassiveModal(null);
    body.querySelectorAll('[data-edit-passive]').forEach(btn => {
      btn.onclick = () => openPassiveModal(state.passiveIncomes.find(p => p.id === btn.dataset.editPassive));
    });
  }

  function openPassiveModal(p) {
    const isEdit = !!p;
    openFormModal({
      title: isEdit ? 'Sửa nguồn thu nhập thụ động' : 'Thêm nguồn thu nhập thụ động',
      fields: [
        { name: 'source', label: 'Nguồn thu', type: 'text', full: true, value: p ? p.source : '', required: true },
        { name: 'monthlyAmount', label: 'Số tiền / tháng (₫)', type: 'number', full: true, step: '10000', value: p ? p.monthlyAmount : '', required: true }
      ],
      onDelete: isEdit ? () => { state.passiveIncomes = state.passiveIncomes.filter(x => x.id !== p.id); persist(); rerender(); } : null,
      onSubmit: (data) => {
        if (isEdit) Object.assign(p, data);
        else state.passiveIncomes.push({ id: Store.uid(), ...data });
        persist(); rerender();
      }
    });
  }

  function renderFireTab(body) {
    const fire = Calc.fireNumber(state);
    const investable = Calc.totalInvestableAssets(state) + Calc.totalCashLikeAssets(state);
    const progress = Calc.freedomProgress(state);
    const years = Calc.yearsToFI(state);
    body.innerHTML = `
      <div class="grid grid-3 section-gap" style="margin-top:0;">
        ${statCard('🎯', 'Số tiền cần để Tự Do Tài Chính (FIRE)', Calc.fmtCompactVND(fire), `Dựa trên chi phí/tháng mục tiêu × 12 ÷ tỷ lệ rút an toàn (${Math.round((state.profile.safeWithdrawalRate || 0.04) * 100)}%)`)}
        ${statCard('💼', 'Tài sản có thể đầu tư hiện tại', Calc.fmtCompactVND(investable))}
        ${statCard('📊', 'Tiến độ', progress.toFixed(1) + '%')}
      </div>
      <div class="card section-gap">
        <div class="card-title-row"><h3>🔮 Giả lập: Nếu tăng tỷ lệ tiết kiệm</h3></div>
        <p class="muted">Số năm dự kiến hiện tại: <strong>${years === Infinity ? 'Chưa đủ dữ liệu' : years.toFixed(1) + ' năm'}</strong></p>
        <div class="form-row" style="max-width:320px;">
          <label>Tăng thêm tỷ lệ tiết kiệm: <span id="extraRateLabel">0%</span></label>
          <input type="range" id="extraRateSlider" min="0" max="30" value="0" step="1"/>
        </div>
        <p id="whatIfResult" class="muted"></p>
      </div>
    `;
    const slider = document.getElementById('extraRateSlider');
    const label = document.getElementById('extraRateLabel');
    const result = document.getElementById('whatIfResult');
    function updateWhatIf() {
      const extra = Number(slider.value);
      label.textContent = extra + '%';
      if (extra === 0) { result.textContent = ''; return; }
      const newYears = Calc.yearsToFIWithExtraRate(state, extra / 100);
      if (years !== Infinity && newYears !== Infinity) {
        const diffMonths = Math.round((years - newYears) * 12);
        result.textContent = diffMonths > 0 ? `→ Bạn có thể đạt tự do tài chính sớm hơn khoảng ${diffMonths} tháng.` : '→ Cần có thu nhập/chi tiêu để tính toán.';
      } else {
        result.textContent = '→ Chưa đủ dữ liệu thu nhập/chi tiêu để mô phỏng.';
      }
    }
    slider.addEventListener('input', updateWhatIf);
    updateWhatIf();
  }

  // ---------- LIFE ----------
  function renderLife(content) {
    content.innerHTML = `
      <div class="pill-nav">
        <button class="pill-btn" data-tab="goals">Mục tiêu sống</button>
        <button class="pill-btn" data-tab="missions">Sứ mệnh (Mission Planner)</button>
      </div>
      <div id="lifeTabBody"></div>
    `;
    content.querySelectorAll('.pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === ui.lifeTab);
      b.addEventListener('click', () => { ui.lifeTab = b.dataset.tab; renderLife(content); });
    });
    const body = document.getElementById('lifeTabBody');
    if (ui.lifeTab === 'goals') renderGoalsTab(body);
    else renderMissionsTab(body);
  }

  function renderGoalsTab(body) {
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0;">
        <div class="card-title-row"><h3>🌟 Mục tiêu sống</h3><button class="btn btn-primary btn-sm" id="addGoalBtn">+ Thêm mục tiêu</button></div>
        ${state.lifeGoals.length ? state.lifeGoals.map(g => {
          const meta = goalCatMeta(g.category);
          return `<div class="life-goal-item ${g.done ? 'done' : ''}">
            <input type="checkbox" data-toggle-goal="${g.id}" ${g.done ? 'checked' : ''}/>
            <span>${meta.icon}</span>
            <div style="flex:1;"><strong>${esc(g.title)}</strong><div class="muted">${esc(meta.label)}</div></div>
            <button class="btn-icon" data-edit-goal="${g.id}">✏️</button>
          </div>`;
        }).join('') : emptyState('🌟', 'Chưa có mục tiêu sống nào. Bắt đầu mơ lớn nhé!')}
      </div>
    `;
    document.getElementById('addGoalBtn').onclick = () => openGoalModal(null);
    body.querySelectorAll('[data-toggle-goal]').forEach(cb => {
      cb.onchange = () => { const g = state.lifeGoals.find(x => x.id === cb.dataset.toggleGoal); g.done = cb.checked; persist(); renderGoalsTab(body); };
    });
    body.querySelectorAll('[data-edit-goal]').forEach(btn => {
      btn.onclick = () => openGoalModal(state.lifeGoals.find(g => g.id === btn.dataset.editGoal));
    });
  }

  function openGoalModal(g) {
    const isEdit = !!g;
    openFormModal({
      title: isEdit ? 'Sửa mục tiêu sống' : 'Thêm mục tiêu sống',
      fields: [
        { name: 'title', label: 'Mục tiêu', type: 'text', full: true, value: g ? g.title : '', required: true, placeholder: 'VD: Du lịch Nhật Bản' },
        { name: 'category', label: 'Nhóm', type: 'select', full: true, value: g ? g.category : 'travel', options: LIFE_GOAL_CATEGORIES },
        { name: 'done', label: 'Đã hoàn thành', type: 'checkbox', full: true, value: g ? g.done : false }
      ],
      onDelete: isEdit ? () => { state.lifeGoals = state.lifeGoals.filter(x => x.id !== g.id); persist(); rerender(); } : null,
      onSubmit: (data) => {
        if (isEdit) Object.assign(g, data);
        else state.lifeGoals.push({ id: Store.uid(), ...data });
        persist(); rerender();
      }
    });
  }

  function renderMissionsTab(body) {
    body.innerHTML = `
      <div class="flex-between section-gap" style="margin-top:0;">
        <p class="muted" style="margin:0;">AI tính toán lộ trình cho từng sứ mệnh dựa trên số tiền hiện có, thời hạn và lãi suất kỳ vọng.</p>
        <button class="btn btn-primary btn-sm" id="addMissionBtn">+ Thêm sứ mệnh</button>
      </div>
      <div class="grid grid-2 section-gap" id="missionsGrid"></div>
    `;
    const grid = document.getElementById('missionsGrid');
    if (!state.missions.length) {
      grid.innerHTML = emptyState('🚀', 'Chưa có sứ mệnh nào. Ví dụ: "Mua nhà trước 35 tuổi", "Du lịch 50 quốc gia".');
    } else {
      grid.innerHTML = state.missions.map(m => {
        const today = new Date();
        const target = m.targetDate ? new Date(m.targetDate) : null;
        const months = target ? Math.max(0, Math.round((target - today) / (1000 * 60 * 60 * 24 * 30.44))) : 0;
        const rate = state.profile.expectedReturnRate || 0.08;
        const needed = target ? Calc.requiredMonthlySavings(m.currentSaved || 0, m.targetAmount || 0, months, rate) : null;
        const pct = m.targetAmount ? Math.min(100, ((m.currentSaved || 0) / m.targetAmount) * 100) : 0;
        return `<div class="card mission-card">
          <div class="card-title-row"><h3>${esc(m.title)}</h3><button class="btn-icon" data-edit-mission="${m.id}">✏️</button></div>
          <div class="muted">${esc(missionTypeLabel(m.type))}${target ? ' · Hạn: ' + esc(m.targetDate) : ''}</div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <p class="muted">${Calc.fmtCompactVND(m.currentSaved || 0)} / ${Calc.fmtCompactVND(m.targetAmount || 0)}</p>
          ${needed !== null ? `<p><strong>Cần tiết kiệm/đầu tư ≈ ${Calc.fmtCompactVND(needed)}/tháng</strong> để đạt mục tiêu đúng hạn.</p>` : ''}
          ${m.notes ? `<p class="small-note">${esc(m.notes)}</p>` : ''}
        </div>`;
      }).join('');
      grid.querySelectorAll('[data-edit-mission]').forEach(btn => {
        btn.onclick = () => openMissionModal(state.missions.find(m => m.id === btn.dataset.editMission));
      });
    }
    document.getElementById('addMissionBtn').onclick = () => openMissionModal(null);
  }

  function openMissionModal(m) {
    const isEdit = !!m;
    openFormModal({
      title: isEdit ? 'Sửa sứ mệnh' : 'Thêm sứ mệnh mới',
      fields: [
        { name: 'title', label: 'Tên sứ mệnh', type: 'text', full: true, value: m ? m.title : '', required: true, placeholder: 'VD: Mua nhà trước 35 tuổi' },
        { name: 'type', label: 'Loại', type: 'select', value: m ? m.type : 'custom', options: MISSION_TYPES },
        { name: 'targetDate', label: 'Thời hạn', type: 'date', value: m ? m.targetDate : '' },
        { name: 'targetAmount', label: 'Số tiền cần (₫)', type: 'number', value: m ? m.targetAmount : '', step: '100000' },
        { name: 'currentSaved', label: 'Đã tích lũy (₫)', type: 'number', value: m ? m.currentSaved : 0, step: '100000' },
        { name: 'notes', label: 'Ghi chú', type: 'textarea', full: true, value: m ? m.notes : '' }
      ],
      onDelete: isEdit ? () => { state.missions = state.missions.filter(x => x.id !== m.id); persist(); rerender(); } : null,
      onSubmit: (data) => {
        if (isEdit) Object.assign(m, data);
        else state.missions.push({ id: Store.uid(), ...data });
        persist(); rerender();
      }
    });
  }

  // ---------- BONUS ----------
  function renderBonus(content) {
    content.innerHTML = `
      <div class="pill-nav">
        <button class="pill-btn" data-tab="course">Khóa học</button>
        <button class="pill-btn" data-tab="ebook">Cẩm nang</button>
        <button class="pill-btn" data-tab="tips">Mẹo tiêu dùng</button>
        <button class="pill-btn" data-tab="templates">Mẫu có sẵn</button>
        <button class="pill-btn" data-tab="challenge">Thử thách 30 ngày</button>
      </div>
      <div id="bonusTabBody"></div>
    `;
    content.querySelectorAll('.pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === ui.bonusTab);
      b.addEventListener('click', () => { ui.bonusTab = b.dataset.tab; renderBonus(content); });
    });
    const body = document.getElementById('bonusTabBody');
    if (ui.bonusTab === 'course') renderBonusCourse(body);
    else if (ui.bonusTab === 'ebook') renderBonusEbook(body);
    else if (ui.bonusTab === 'tips') renderBonusTips(body);
    else if (ui.bonusTab === 'templates') renderBonusTemplates(body);
    else renderBonusChallenge(body);
  }

  function accordionCard(title, bodyHtml, id) {
    return `<div class="lp-faq-item" id="${id}">
      <div class="lp-faq-q" data-accordion-toggle="${id}"><span>${esc(title)}</span><span class="lp-faq-icon">+</span></div>
      <div class="lp-faq-a">${bodyHtml}</div>
    </div>`;
  }
  function wireAccordions(container) {
    container.querySelectorAll('[data-accordion-toggle]').forEach(q => {
      q.addEventListener('click', () => q.closest('.lp-faq-item').classList.toggle('open'));
    });
  }

  function renderBonusCourse(body) {
    body.innerHTML = `<div class="card section-gap" style="margin-top:0;">
      <div class="card-title-row"><h3>🎓 Khóa học "Quản lý Tài chính Cá nhân từ Cơ bản đến Nâng cao"</h3></div>
      <p class="muted">8 chương, đi từ tư duy tiền bạc đến thực hành ngay trong VICTORY.</p>
      ${COURSE_CHAPTERS.map((c, i) => accordionCard(c.title, `<ul style="margin:0; padding-left:18px;">${c.items.map(it => `<li>${esc(it)}</li>`).join('')}</ul>`, 'course' + i)).join('')}
    </div>`;
    wireAccordions(body);
  }

  function renderBonusEbook(body) {
    body.innerHTML = `<div class="card section-gap" style="margin-top:0;">
      <div class="card-title-row"><h3>📘 Cẩm nang sử dụng VICTORY</h3></div>
      <p class="muted">Hướng dẫn từng bước — bấm vào mục để đi thẳng tới tính năng tương ứng.</p>
      ${EBOOK_SECTIONS.map((s, i) => accordionCard(s.title, `<p style="margin:0 0 8px;">${esc(s.desc)}</p>${s.route ? `<button class="btn btn-secondary btn-sm" data-ebook-idx="${i}">Mở tính năng này →</button>` : ''}`, 'ebook' + i)).join('')}
    </div>`;
    wireAccordions(body);
    body.querySelectorAll('[data-ebook-idx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const s = EBOOK_SECTIONS[Number(btn.dataset.ebookIdx)];
        if (s.route === '#/money') ui.moneyTab = s.tab || 'transactions';
        else if (s.route === '#/wealth') ui.wealthTab = s.tab || 'assets';
        else if (s.route === '#/life') ui.lifeTab = s.tab || 'goals';
        location.hash = s.route;
      });
    });
  }

  function renderBonusTips(body) {
    const dayIndex = Math.floor(Date.now() / 86400000) % SPENDING_TIPS.length;
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0; background:var(--green-light); border-color:#bbf7d0;">
        <div class="card-title">💡 Mẹo hôm nay</div>
        <p style="margin:0; font-weight:600;">${esc(SPENDING_TIPS[dayIndex])}</p>
      </div>
      <div class="card section-gap">
        <div class="card-title-row"><h3>💡 100 Mẹo Tiêu dùng Thông minh</h3></div>
        <ol style="margin:0; padding-left:20px; display:grid; gap:8px; font-size:13.5px; color:var(--text);">
          ${SPENDING_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  function renderBonusTemplates(body) {
    body.innerHTML = `<div class="grid grid-2 section-gap" style="margin-top:0;">
      ${TEMPLATE_MAP.map((t, i) => `<div class="card">
        <div class="card-title">${esc(t.name)}</div>
        <p class="muted" style="margin:0 0 10px;">${esc(t.desc)}</p>
        <button class="btn btn-secondary btn-sm" data-template-idx="${i}">Mở trong app →</button>
      </div>`).join('')}
    </div>
    <p class="small-note section-gap">VICTORY đã tích hợp sẵn các mẫu quản lý tài chính ngay trong ứng dụng — không cần tải file Excel rời rạc.</p>`;
    body.querySelectorAll('[data-template-idx]').forEach(btn => {
      btn.onclick = () => {
        const t = TEMPLATE_MAP[Number(btn.dataset.templateIdx)];
        if (t.route === '#/money') ui.moneyTab = t.tab;
        else if (t.route === '#/wealth') ui.wealthTab = t.tab;
        else if (t.route === '#/life') ui.lifeTab = t.tab;
        location.hash = t.route;
      };
    });
  }

  function renderBonusChallenge(body) {
    const done = state.challenge.tasksDone || [];
    const totalTasks = CHALLENGE_WEEKS.reduce((s, w) => s + w.tasks.length, 0);
    const doneCount = done.length;
    const pct = totalTasks ? (doneCount / totalTasks) * 100 : 0;
    const completed = doneCount >= totalTasks;
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0;">
        <div class="card-title-row"><h3>🏆 Thử thách 30 Ngày Làm Chủ Tài Chính</h3></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <p class="muted">${doneCount}/${totalTasks} nhiệm vụ hoàn thành</p>
        ${completed ? `<div class="insight insight-success"><div class="insight-icon">🏅</div><div><div class="insight-title">Chúc mừng! Bạn đã hoàn thành thử thách</div><p class="insight-msg">Huy hiệu "Nhà Quản Lý Tài Chính" đã được trao. Tiếp tục duy trì thói quen này nhé!</p></div></div>` : ''}
      </div>
      ${CHALLENGE_WEEKS.map((w, wi) => `
        <div class="card section-gap">
          <div class="card-title">${esc(w.title)}</div>
          ${w.tasks.map(t => `<div class="life-goal-item ${done.includes(t.id) ? 'done' : ''}">
            <input type="checkbox" data-challenge-task="${t.id}" ${done.includes(t.id) ? 'checked' : ''}/>
            <span>${esc(t.label)}</span>
          </div>`).join('')}
        </div>
      `).join('')}
    `;
    body.querySelectorAll('[data-challenge-task]').forEach(cb => {
      cb.onchange = () => {
        const id = cb.dataset.challengeTask;
        const idx = state.challenge.tasksDone.indexOf(id);
        if (cb.checked && idx === -1) state.challenge.tasksDone.push(id);
        else if (!cb.checked && idx !== -1) state.challenge.tasksDone.splice(idx, 1);
        persist();
        renderBonusChallenge(body);
      };
    });
  }

  // ---------- ADVISORY (Tư vấn tài chính) ----------
  function renderAdvisory(content) {
    content.innerHTML = `
      <div class="pill-nav">
        <button class="pill-btn" data-tab="allocation">Phân bổ dòng tiền</button>
        <button class="pill-btn" data-tab="chatbot">Chatbot hỗ trợ</button>
        <button class="pill-btn" data-tab="coach">Đặt lịch Coach 1:1</button>
      </div>
      <div id="advisoryTabBody"></div>
    `;
    content.querySelectorAll('.pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === ui.advisoryTab);
      b.addEventListener('click', () => { ui.advisoryTab = b.dataset.tab; renderAdvisory(content); });
    });
    const body = document.getElementById('advisoryTabBody');
    if (ui.advisoryTab === 'allocation') renderAllocationAdvisor(body);
    else if (ui.advisoryTab === 'chatbot') renderChatbot(body);
    else renderCoachBooking(body);
  }

  function renderAllocationAdvisor(body) {
    const inc = Calc.monthlyIncome(state) || Calc.last3MonthsAvg(state, Calc.monthlyIncome);
    const needCats = ['Nhà ở', 'Ăn uống', 'Di chuyển', 'Hóa đơn & tiện ích', 'Sức khỏe', 'Trả nợ'];
    const wantCats = ['Giải trí', 'Mua sắm', 'Giáo dục', 'Khác'];
    const mKey = Calc.currentMonthKey();
    const txThisMonth = state.transactions.filter(t => t.type === 'expense' && Calc.monthKey(t.date) === mKey);
    const needSpent = txThisMonth.filter(t => needCats.includes(t.category)).reduce((s, t) => s + t.amount, 0);
    const wantSpent = txThisMonth.filter(t => wantCats.includes(t.category)).reduce((s, t) => s + t.amount, 0);
    const savingsRateActual = inc > 0 ? Math.max(0, (inc - needSpent - wantSpent) / inc) : 0;
    const bars = [
      { label: 'Thiết yếu (mục tiêu 50%)', recommended: inc * 0.5, actual: needSpent },
      { label: 'Mong muốn (mục tiêu 30%)', recommended: inc * 0.3, actual: wantSpent },
      { label: 'Tiết kiệm/Đầu tư (mục tiêu 20%)', recommended: inc * 0.2, actual: Math.max(0, inc - needSpent - wantSpent) }
    ];
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0;">
        <div class="card-title-row"><h3>📊 Phân bổ dòng tiền theo quy tắc 50/30/20</h3></div>
        <p class="muted">Dựa trên thu nhập tháng này (${Calc.fmtCompactVND(inc)}): 50% Thiết yếu · 30% Mong muốn · 20% Tiết kiệm/Đầu tư.</p>
        ${bars.map(b => {
          const pct = b.recommended ? Math.min(100, (b.actual / b.recommended) * 100) : 0;
          const over = b.actual > b.recommended;
          return `<div class="section-gap" style="margin-top:14px;">
            <div class="flex-between"><strong style="font-size:13px;">${esc(b.label)}</strong><span class="muted" style="font-size:12.5px;">${Calc.fmtCompactVND(b.actual)} / ${Calc.fmtCompactVND(b.recommended)}</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%; ${over ? 'background:var(--red);' : ''}"></div></div>
          </div>`;
        }).join('')}
        <p class="small-note section-gap">Tỷ lệ tiết kiệm thực tế tháng này: <strong>${Math.round(savingsRateActual * 100)}%</strong>. Danh mục "Thiết yếu" gồm Nhà ở, Ăn uống, Di chuyển, Hóa đơn, Sức khỏe, Trả nợ; "Mong muốn" gồm Giải trí, Mua sắm, Giáo dục, Khác.</p>
      </div>
    `;
  }

  let chatHistory = [];
  function renderChatbot(body) {
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0;">
        <div class="card-title-row"><h3>🤖 Chatbot hỗ trợ tài chính</h3></div>
        <p class="muted">Hỏi nhanh về ngân sách, nợ, đầu tư, tự do tài chính... Câu trả lời dựa trên công thức có sẵn, không gọi AI ngoài.</p>
        <div id="chatWindow" style="max-height:320px; overflow-y:auto; margin-bottom:12px;"></div>
        <form id="chatForm" class="flex gap-8">
          <input type="text" id="chatInput" placeholder="VD: Làm sao lập ngân sách?" style="flex:1; padding:10px 12px; border:1px solid var(--border); border-radius:9px;" />
          <button type="submit" class="btn btn-primary">Gửi</button>
        </form>
      </div>
    `;
    const win = document.getElementById('chatWindow');
    function renderHistory() {
      win.innerHTML = chatHistory.map(m => `
        <div class="insight ${m.from === 'bot' ? 'insight-info' : 'insight-success'}" style="margin-bottom:8px;">
          <div class="insight-icon">${m.from === 'bot' ? '🤖' : '🙂'}</div>
          <div><p class="insight-msg" style="color:var(--text);">${esc(m.text)}</p></div>
        </div>`).join('') || '<p class="muted">Chưa có tin nhắn nào. Thử hỏi: "Làm sao xây quỹ khẩn cấp?"</p>';
      win.scrollTop = win.scrollHeight;
    }
    renderHistory();
    document.getElementById('chatForm').addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;
      chatHistory.push({ from: 'user', text });
      const lower = text.toLowerCase();
      const match = CHATBOT_QA.find(qa => qa.keywords.some(k => lower.includes(k)));
      chatHistory.push({ from: 'bot', text: match ? match.answer : CHATBOT_DEFAULT_ANSWER });
      input.value = '';
      renderHistory();
    });
  }

  function renderCoachBooking(body) {
    body.innerHTML = `
      <div class="card section-gap" style="margin-top:0;">
        <div class="card-title-row"><h3>📅 Đặt lịch Coach 1:1 với chuyên gia</h3></div>
        <p class="muted">Điền thông tin bên dưới — VICTORY sẽ mở sẵn email đặt lịch, bạn chỉ cần bấm gửi.</p>
        <form id="bookingForm">
          <div class="form-grid">
            <div class="form-row"><label>Họ tên</label><input id="bk_name" required /></div>
            <div class="form-row"><label>Số điện thoại / Email liên hệ</label><input id="bk_contact" required /></div>
            <div class="form-row"><label>Chủ đề muốn tư vấn</label>
              <select id="bk_topic">
                <option>Phân bổ dòng tiền</option>
                <option>Lập kế hoạch tiết kiệm</option>
                <option>Đầu tư cho người mới</option>
                <option>Kế hoạch nghỉ hưu / tự do tài chính</option>
                <option>Khác</option>
              </select>
            </div>
            <div class="form-row"><label>Thời gian mong muốn</label><input id="bk_time" type="datetime-local" /></div>
          </div>
          <div class="form-row"><label>Ghi chú thêm</label><textarea id="bk_note" rows="3"></textarea></div>
          <button type="submit" class="btn btn-primary">Gửi yêu cầu đặt lịch →</button>
        </form>
      </div>
    `;
    document.getElementById('bookingForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('bk_name').value;
      const contact = document.getElementById('bk_contact').value;
      const topic = document.getElementById('bk_topic').value;
      const time = document.getElementById('bk_time').value;
      const note = document.getElementById('bk_note').value;
      const subject = 'Đặt lịch Coach 1:1 - ' + name;
      const bodyText = `Họ tên: ${name}\nLiên hệ: ${contact}\nChủ đề: ${topic}\nThời gian mong muốn: ${time || '(chưa chọn)'}\nGhi chú: ${note}`;
      const mailto = `mailto:${PAYMENT_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.location.href = mailto;
    });
  }

  // ---------- SETTINGS ----------
  function renderSettings(content) {
    const p = state.profile;
    content.innerHTML = `
      <div class="card">
        <div class="card-title-row"><h3>👤 Hồ sơ & mục tiêu</h3></div>
        <form id="profileForm">
          <div class="form-grid">
            <div class="form-row"><label>Tên của bạn</label><input id="p_name" value="${esc(p.name)}"/></div>
            <div class="form-row"><label>Năm sinh</label><input id="p_birthYear" type="number" value="${p.birthYear || ''}"/></div>
            <div class="form-row"><label>Tuổi mong muốn nghỉ hưu</label><input id="p_retireAgeGoal" type="number" value="${p.retireAgeGoal || ''}"/></div>
            <div class="form-row"><label>Chi phí sinh hoạt mục tiêu / tháng (₫)</label><input id="p_monthlyExpenseTarget" type="number" step="10000" value="${p.monthlyExpenseTarget || ''}"/></div>
            <div class="form-row"><label>Tỷ lệ rút an toàn (%/năm)</label><input id="p_swr" type="number" step="0.1" value="${(p.safeWithdrawalRate || 0.04) * 100}"/></div>
            <div class="form-row"><label>Lợi nhuận đầu tư kỳ vọng (%/năm)</label><input id="p_err" type="number" step="0.1" value="${(p.expectedReturnRate || 0.08) * 100}"/></div>
          </div>
          <button type="submit" class="btn btn-primary">Lưu hồ sơ</button>
        </form>
      </div>

      <div class="card section-gap">
        <div class="card-title-row"><h3>🏷️ Danh mục thu chi</h3></div>
        <div class="grid grid-2">
          <div>
            <div class="card-title">Danh mục thu nhập</div>
            <div class="legend" id="catIncomeList" style="margin-top:0;"></div>
            <div class="flex gap-8 section-gap" style="margin-top:10px;"><input id="newIncomeCat" placeholder="Thêm danh mục mới" style="flex:1; padding:8px 10px; border:1px solid var(--border); border-radius:8px;"/><button class="btn btn-secondary btn-sm" id="addIncomeCatBtn">Thêm</button></div>
          </div>
          <div>
            <div class="card-title">Danh mục chi tiêu</div>
            <div class="legend" id="catExpenseList" style="margin-top:0;"></div>
            <div class="flex gap-8 section-gap" style="margin-top:10px;"><input id="newExpenseCat" placeholder="Thêm danh mục mới" style="flex:1; padding:8px 10px; border:1px solid var(--border); border-radius:8px;"/><button class="btn btn-secondary btn-sm" id="addExpenseCatBtn">Thêm</button></div>
          </div>
        </div>
      </div>

      <div class="card section-gap">
        <div class="card-title-row"><h3>💾 Dữ liệu</h3></div>
        <p class="muted">Toàn bộ dữ liệu chỉ lưu trên trình duyệt này (localStorage). Hãy sao lưu định kỳ.</p>
        <div class="flex gap-8" style="flex-wrap:wrap;">
          <button class="btn btn-secondary" id="exportBtn">⬇️ Xuất dữ liệu (JSON)</button>
          <label class="btn btn-secondary" style="margin:0;">⬆️ Nhập dữ liệu<input type="file" id="importInput" accept="application/json" class="hidden"/></label>
          <button class="btn btn-secondary" id="sampleBtn">✨ Nạp dữ liệu mẫu</button>
          <button class="btn btn-danger" id="resetBtn">🗑️ Xóa toàn bộ dữ liệu</button>
        </div>
      </div>

      <div class="card section-gap">
        <div class="card-title-row"><h3>💚 Đồng hành cùng VICTORY</h3></div>
        ${isPaidActive()
          ? `<p class="muted">✅ Đã thanh toán — còn hiệu lực tới <strong>${new Date(state.meta.paidUntil).toLocaleDateString('vi-VN')}</strong>.</p>`
          : `<p class="muted">Bạn đã dùng VICTORY được ${Calc.daysSinceInstall(state)} ngày. Gói dùng thử miễn phí ${TRIAL_DAYS} ngày, sau đó ${Calc.fmtVND(MONTHLY_PRICE)}/tháng để tiếp tục đồng hành.</p>`}
        <button class="btn btn-primary" id="openPaymentBtn">Xem thông tin thanh toán</button>
      </div>

      <div class="card section-gap">
        <div class="card-title-row"><h3>🎁 Bonus dành cho bạn</h3></div>
        <p class="muted">Khóa học tài chính, cẩm nang sử dụng, 100 mẹo tiêu dùng và thử thách 30 ngày làm chủ tài chính.</p>
        <a href="#/bonus" class="btn btn-secondary">Xem Bonus</a>
      </div>

      <div class="card section-gap">
        <div class="card-title-row"><h3>🧭 Tư vấn tài chính</h3></div>
        <p class="muted">Công cụ phân bổ dòng tiền, chatbot hỗ trợ và đặt lịch Coach 1:1 với chuyên gia.</p>
        <a href="#/advisory" class="btn btn-secondary">Xem tư vấn</a>
      </div>

      <div class="card section-gap">
        <div class="card-title-row"><h3>✨ Giới thiệu</h3></div>
        <p class="muted">Xem lại màn hình chào và slogan của VICTORY.</p>
        <button class="btn btn-secondary" id="showSplashBtn">Xem màn hình chào</button>
      </div>
    `;

    document.getElementById('profileForm').addEventListener('submit', e => {
      e.preventDefault();
      state.profile = {
        name: document.getElementById('p_name').value,
        birthYear: parseInt(document.getElementById('p_birthYear').value) || null,
        retireAgeGoal: parseInt(document.getElementById('p_retireAgeGoal').value) || 45,
        monthlyExpenseTarget: parseFloat(document.getElementById('p_monthlyExpenseTarget').value) || 0,
        safeWithdrawalRate: (parseFloat(document.getElementById('p_swr').value) || 4) / 100,
        expectedReturnRate: (parseFloat(document.getElementById('p_err').value) || 8) / 100
      };
      persist();
      alert('Đã lưu hồ sơ.');
    });

    function renderCatLists() {
      document.getElementById('catIncomeList').innerHTML = state.categories.income.map(c => `<span class="tag tag-income">${esc(c)} <a href="#" data-rm-cat="income:${esc(c)}" style="color:inherit; margin-left:4px;">✕</a></span>`).join('');
      document.getElementById('catExpenseList').innerHTML = state.categories.expense.map(c => `<span class="tag tag-expense">${esc(c)} <a href="#" data-rm-cat="expense:${esc(c)}" style="color:inherit; margin-left:4px;">✕</a></span>`).join('');
      content.querySelectorAll('[data-rm-cat]').forEach(a => {
        a.onclick = (e) => {
          e.preventDefault();
          const [kind, cat] = a.dataset.rmCat.split(':');
          state.categories[kind] = state.categories[kind].filter(c => c !== cat);
          persist(); renderCatLists();
        };
      });
    }
    renderCatLists();
    document.getElementById('addIncomeCatBtn').onclick = () => {
      const input = document.getElementById('newIncomeCat');
      if (input.value.trim()) { state.categories.income.push(input.value.trim()); input.value = ''; persist(); renderCatLists(); }
    };
    document.getElementById('addExpenseCatBtn').onclick = () => {
      const input = document.getElementById('newExpenseCat');
      if (input.value.trim()) { state.categories.expense.push(input.value.trim()); input.value = ''; persist(); renderCatLists(); }
    };

    document.getElementById('exportBtn').onclick = () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'victory-du-lieu-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };
    document.getElementById('importInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          state = Store.migrate(parsed);
          persist();
          alert('Đã nhập dữ liệu thành công.');
          rerender();
        } catch (err) {
          alert('Tệp không hợp lệ.');
        }
      };
      reader.readAsText(file);
    });
    document.getElementById('sampleBtn').onclick = () => {
      if (!confirm('Nạp dữ liệu mẫu sẽ được thêm vào dữ liệu hiện có. Tiếp tục?')) return;
      loadSampleData();
      persist();
      rerender();
    };
    document.getElementById('openPaymentBtn').onclick = () => openPaymentModal();
    document.getElementById('showSplashBtn').onclick = () => showSplash();
    document.getElementById('resetBtn').onclick = () => {
      if (!confirm('Xóa toàn bộ dữ liệu VICTORY? Hành động này không thể hoàn tác.')) return;
      state = Store.defaultState();
      persist();
      rerender();
    };
  }

  function loadSampleData() {
    const today = new Date();
    // Neo theo ngày trong tháng hiện tại (giới hạn ở ngày hôm nay) để dữ liệu mẫu
    // luôn rơi vào tháng này, kể cả khi hôm nay là đầu tháng.
    const mkDay = (day) => Calc.localISODate(new Date(today.getFullYear(), today.getMonth(), Math.min(day, today.getDate())));
    state.transactions.push(
      { id: Store.uid(), type: 'income', date: mkDay(1), amount: 25000000, category: 'Lương', note: 'Lương tháng' },
      { id: Store.uid(), type: 'expense', date: mkDay(3), amount: 6000000, category: 'Ăn uống', note: '' },
      { id: Store.uid(), type: 'expense', date: mkDay(4), amount: 4500000, category: 'Nhà ở', note: 'Thuê nhà' },
      { id: Store.uid(), type: 'expense', date: mkDay(6), amount: 1200000, category: 'Di chuyển', note: '' },
      { id: Store.uid(), type: 'expense', date: mkDay(8), amount: 800000, category: 'Giải trí', note: '' },
      { id: Store.uid(), type: 'income', date: mkDay(1), amount: 3000000, category: 'Đầu tư', note: 'Cổ tức' }
    );
    if (!state.budgets.length) state.budgets.push({ category: 'Ăn uống', monthlyLimit: 7000000 }, { category: 'Giải trí', monthlyLimit: 1000000 });
    if (!state.assets.length) state.assets.push(
      { id: Store.uid(), name: 'Tiết kiệm ngân hàng', type: 'saving', value: 150000000 },
      { id: Store.uid(), name: 'Cổ phiếu VN30', type: 'stock', value: 80000000 },
      { id: Store.uid(), name: 'Căn hộ cho thuê', type: 'realestate', value: 1800000000 }
    );
    if (!state.debts.length) state.debts.push({ id: Store.uid(), name: 'Vay mua xe', principal: 300000000, remaining: 180000000, interestRate: 0.09, monthlyPayment: 8000000 });
    if (!state.passiveIncomes.length) state.passiveIncomes.push({ id: Store.uid(), source: 'Cho thuê căn hộ', monthlyAmount: 8000000 }, { id: Store.uid(), source: 'Cổ tức đầu tư', monthlyAmount: 1500000 });
    if (!state.emergencyFund.target) state.emergencyFund = { current: 45000000, target: 60000000 };
    if (!state.lifeGoals.length) state.lifeGoals.push(
      { id: Store.uid(), title: 'Du lịch Nhật Bản', category: 'travel', done: false },
      { id: Store.uid(), title: 'Học đầu tư chứng khoán bài bản', category: 'career', done: true },
      { id: Store.uid(), title: 'Xây quỹ học bổng nhỏ cho trẻ em', category: 'community', done: false }
    );
    if (!state.missions.length) state.missions.push({ id: Store.uid(), title: 'Nghỉ hưu ở tuổi 45', type: 'retire_early', targetAmount: 6000000000, targetDate: '2045-01-01', currentSaved: 230000000, notes: 'Dựa trên chi phí sinh hoạt mục tiêu và tỷ lệ rút an toàn 4%.' });
    if (!state.profile.monthlyExpenseTarget) state.profile.monthlyExpenseTarget = 15000000;
  }

  // ---------- Init ----------
  const SPLASH_SEEN_KEY = 'victory_splash_seen';
  function hideSplash() {
    document.getElementById('splashScreen').classList.add('hidden');
    localStorage.setItem(SPLASH_SEEN_KEY, '1');
  }
  function showSplash() {
    document.getElementById('splashScreen').classList.remove('hidden');
  }

  window.addEventListener('hashchange', render);
  document.addEventListener('DOMContentLoaded', () => {
    render();
    document.getElementById('quickAddBtn').addEventListener('click', () => openTransactionModal(null));
    const fab = document.getElementById('fabAddBtn');
    if (fab) fab.addEventListener('click', (e) => { e.preventDefault(); openTransactionModal(null); });

    if (localStorage.getItem(SPLASH_SEEN_KEY)) hideSplash();
    document.getElementById('splashStartBtn').addEventListener('click', hideSplash);
  });
})();
