// VICTORY - lưu trữ dữ liệu cục bộ (localStorage), không gửi đi bất cứ đâu
(function () {
  // ?demo=1 (dùng bởi landing.html) trỏ tới một key riêng, tách biệt hoàn toàn
  // với dữ liệu thật của người dùng, để trang giới thiệu không bao giờ ghi đè lên đó.
  const isDemo = /[?&]demo=1\b/.test(location.search);
  const KEY = isDemo ? 'victory_app_state_demo_v1' : 'victory_app_state_v1';

  const DEFAULT_CATEGORIES = {
    income: ['Lương', 'Thưởng', 'Kinh doanh', 'Đầu tư', 'Thu nhập thụ động', 'Khác'],
    expense: [
      'Ăn uống', 'Nhà ở', 'Di chuyển', 'Hóa đơn & tiện ích', 'Sức khỏe',
      'Giáo dục', 'Giải trí', 'Mua sắm', 'Trả nợ', 'Từ thiện', 'Khác'
    ]
  };

  function defaultState() {
    return {
      profile: {
        name: '',
        birthYear: null,
        retireAgeGoal: 45,
        monthlyExpenseTarget: 0,
        safeWithdrawalRate: 0.04,
        expectedReturnRate: 0.08
      },
      transactions: [],
      budgets: [],
      emergencyFund: { target: 0, current: 0 },
      debts: [],
      assets: [],
      passiveIncomes: [],
      lifeGoals: [],
      missions: [],
      categories: DEFAULT_CATEGORIES,
      netWorthHistory: [],
      settings: { currency: 'VND', locale: 'vi-VN' },
      meta: { createdAt: new Date().toISOString(), lastSnapshot: null, paymentCode: randomCode(), paidUntil: null },
      challenge: { tasksDone: [] }
    };
  }

  // Mã ngắn dùng để nhận diện thiết bị này trong nội dung chuyển khoản (VD: VICTORY-AB12CD34),
  // giúp đối chiếu tự động khi tích hợp SePay — không chứa thông tin cá nhân.
  function randomCode() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  function migrate(state) {
    const d = defaultState();
    const merged = Object.assign({}, d, state);
    merged.profile = Object.assign({}, d.profile, state.profile || {});
    merged.emergencyFund = Object.assign({}, d.emergencyFund, state.emergencyFund || {});
    merged.categories = Object.assign({}, d.categories, state.categories || {});
    merged.settings = Object.assign({}, d.settings, state.settings || {});
    merged.meta = Object.assign({}, d.meta, state.meta || {});
    if (!merged.meta.paymentCode) merged.meta.paymentCode = randomCode();
    merged.challenge = Object.assign({}, d.challenge, state.challenge || {});
    ['transactions', 'budgets', 'debts', 'assets', 'passiveIncomes', 'lifeGoals', 'missions', 'netWorthHistory']
      .forEach(k => { merged[k] = Array.isArray(state[k]) ? state[k] : (d[k] || []); });
    merged.challenge.tasksDone = Array.isArray(merged.challenge.tasksDone) ? merged.challenge.tasksDone : [];
    return merged;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return migrate(JSON.parse(raw));
    } catch (e) {
      console.error('Không đọc được dữ liệu, dùng mặc định.', e);
      return defaultState();
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function maybeSnapshotNetWorth(state, netWorth) {
    const today = Calc.localISODate(new Date());
    const last = state.netWorthHistory[state.netWorthHistory.length - 1];
    if (last && last.date === today) {
      last.value = netWorth;
    } else {
      state.netWorthHistory.push({ date: today, value: netWorth });
    }
    if (state.netWorthHistory.length > 365) state.netWorthHistory.shift();
  }

  window.Store = { load, save, uid, defaultState, migrate, maybeSnapshotNetWorth, KEY };
})();
