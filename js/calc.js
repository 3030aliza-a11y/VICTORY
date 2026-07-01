// VICTORY - các phép tính tài chính (thuần công thức, không gọi AI ngoài)
(function () {
  function fmtVND(n) {
    n = Math.round(n || 0);
    return n.toLocaleString('vi-VN') + ' ₫';
  }

  function fmtCompactVND(n) {
    n = n || 0;
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' tỷ ₫';
    if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' tr ₫';
    return fmtVND(n);
  }

  // Định dạng ngày theo giờ địa phương (tránh lệch ngày do toISOString() quy về UTC,
  // gây sai lệch ở múi giờ dương như Việt Nam UTC+7 khi ngày đang là đầu tháng)
  function localISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function monthKey(d) {
    if (typeof d === 'string') return d.slice(0, 7);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function currentMonthKey() {
    return monthKey(new Date());
  }

  function txInMonth(transactions, mKey) {
    return transactions.filter(t => monthKey(t.date) === mKey);
  }

  function sumBy(list, pred, field) {
    return list.filter(pred).reduce((s, x) => s + (Number(x[field]) || 0), 0);
  }

  function monthlyIncome(state, mKey) {
    mKey = mKey || currentMonthKey();
    return sumBy(txInMonth(state.transactions, mKey), t => t.type === 'income', 'amount');
  }

  function monthlyExpense(state, mKey) {
    mKey = mKey || currentMonthKey();
    return sumBy(txInMonth(state.transactions, mKey), t => t.type === 'expense', 'amount');
  }

  function last3MonthsAvg(state, fn) {
    const now = new Date();
    let sum = 0, n = 0;
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      sum += fn(state, monthKey(d));
      n++;
    }
    return n ? sum / n : 0;
  }

  function totalDebtRemaining(state) {
    return sumBy(state.debts, () => true, 'remaining');
  }

  function totalAssets(state) {
    return sumBy(state.assets, () => true, 'value');
  }

  function totalInvestableAssets(state) {
    const growthTypes = ['stock', 'fund', 'crypto', 'realestate', 'gold', 'business'];
    return state.assets.filter(a => growthTypes.includes(a.type)).reduce((s, a) => s + (Number(a.value) || 0), 0);
  }

  function netWorth(state) {
    return totalAssets(state) - totalDebtRemaining(state);
  }

  function monthlyPassiveIncome(state) {
    return sumBy(state.passiveIncomes, () => true, 'monthlyAmount');
  }

  function savingsRate(state, mKey) {
    const inc = monthlyIncome(state, mKey);
    const exp = monthlyExpense(state, mKey);
    if (inc <= 0) return 0;
    return Math.max(0, (inc - exp) / inc);
  }

  function fireNumber(state) {
    const swr = state.profile.safeWithdrawalRate || 0.04;
    const annualExpense = (state.profile.monthlyExpenseTarget || last3MonthsAvg(state, monthlyExpense)) * 12;
    if (swr <= 0) return 0;
    return annualExpense / swr;
  }

  function freedomProgress(state) {
    const fire = fireNumber(state);
    if (fire <= 0) return 0;
    const investable = totalInvestableAssets(state) + totalCashLikeAssets(state);
    return Math.min(100, Math.max(0, (investable / fire) * 100));
  }

  function monthsCoveredByPassiveIncome(state) {
    const exp = state.profile.monthlyExpenseTarget || last3MonthsAvg(state, monthlyExpense);
    if (exp <= 0) return 0;
    return monthlyPassiveIncome(state) / exp;
  }

  // Số tiền cần tiết kiệm/đầu tư mỗi tháng để đạt targetAmount sau n tháng,
  // với lãi suất kỳ vọng hàng năm annualRate, đã có currentSaved.
  function requiredMonthlySavings(currentSaved, targetAmount, months, annualRate) {
    const remaining = targetAmount - currentSaved;
    if (months <= 0) return Math.max(0, remaining);
    const r = (annualRate || 0) / 12;
    if (r === 0) return Math.max(0, remaining / months);
    const growthOfCurrent = currentSaved * Math.pow(1 + r, months);
    const need = targetAmount - growthOfCurrent;
    if (need <= 0) return 0;
    const factor = (Math.pow(1 + r, months) - 1) / r;
    return Math.max(0, need / factor);
  }

  // Mô phỏng số tháng cần để đạt targetAmount, với khoản góp hàng tháng cố định
  function monthsToReachTarget(currentSaved, targetAmount, monthlyContribution, annualRate) {
    if (currentSaved >= targetAmount) return 0;
    const r = (annualRate || 0) / 12;
    let balance = currentSaved;
    let months = 0;
    const maxMonths = 1200; // 100 năm chặn vô hạn
    while (balance < targetAmount && months < maxMonths) {
      balance = balance * (1 + r) + monthlyContribution;
      months++;
    }
    return months >= maxMonths ? Infinity : months;
  }

  function yearsToFI(state) {
    const fire = fireNumber(state);
    const investable = totalInvestableAssets(state) + totalCashLikeAssets(state);
    const inc = state.profile.monthlyExpenseTarget ? monthlyIncome(state) || last3MonthsAvg(state, monthlyIncome) : last3MonthsAvg(state, monthlyIncome);
    const rate = savingsRate(state) || (last3MonthsAvg(state, monthlyIncome) > 0 ? (last3MonthsAvg(state, monthlyIncome) - last3MonthsAvg(state, monthlyExpense)) / last3MonthsAvg(state, monthlyIncome) : 0);
    const monthlyContribution = Math.max(0, inc * rate);
    const months = monthsToReachTarget(investable, fire, monthlyContribution, state.profile.expectedReturnRate || 0.08);
    return months === Infinity ? Infinity : months / 12;
  }

  function daysSinceInstall(state) {
    if (!state.meta || !state.meta.createdAt) return 0;
    return Math.floor((Date.now() - new Date(state.meta.createdAt).getTime()) / 86400000);
  }

  function debtToIncomeRatio(state) {
    const inc = last3MonthsAvg(state, monthlyIncome);
    return inc > 0 ? totalDebtRemaining(state) / (inc * 12) : (totalDebtRemaining(state) > 0 ? 1 : 0);
  }

  function totalCashLikeAssets(state) {
    return sumBy(state.assets, a => a.type === 'cash' || a.type === 'saving', 'value');
  }

  // % thay đổi tài sản ròng so với khoảng ~30 ngày trước (dựa trên lịch sử đã lưu)
  function netWorthChangePct(state) {
    const hist = state.netWorthHistory;
    if (!hist || hist.length < 2) return null;
    const latest = hist[hist.length - 1];
    const targetTime = new Date(latest.date).getTime() - 30 * 86400000;
    let ref = hist[0];
    for (const h of hist) {
      if (new Date(h.date).getTime() <= targetTime) ref = h;
    }
    if (ref.date === latest.date || !ref.value) return null;
    return ((latest.value - ref.value) / Math.abs(ref.value)) * 100;
  }

  function ratingLabel(score) {
    if (score >= 80) return 'Rất tốt';
    if (score >= 60) return 'Tốt';
    if (score >= 40) return 'Khá';
    return 'Cần cải thiện';
  }

  // Tuổi dự kiến đạt tự do tài chính (null nếu chưa khai báo năm sinh)
  function projectedFreedomAge(state) {
    if (!state.profile.birthYear) return null;
    const years = yearsToFI(state);
    if (years === Infinity) return null;
    const currentAge = new Date().getFullYear() - state.profile.birthYear;
    return Math.round(currentAge + years);
  }

  // ---- VICTORY SCORE (7 chỉ số 0-100) ----
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function victoryScores(state) {
    const inc = last3MonthsAvg(state, monthlyIncome);
    const exp = last3MonthsAvg(state, monthlyExpense);
    const sRate = inc > 0 ? clamp((inc - exp) / inc, -1, 1) : 0;

    const monthsExpenseInEmergency = exp > 0 ? (state.emergencyFund.current || 0) / exp : 0;
    const debtToIncome = debtToIncomeRatio(state);

    const financialHealth = clamp(
      (sRate > 0 ? 40 : 10) +
      clamp(monthsExpenseInEmergency / 6, 0, 1) * 40 +
      clamp(1 - debtToIncome, 0, 1) * 20,
      0, 100
    );

    const savingScore = clamp((sRate / 0.3) * 100, 0, 100);

    const assets = totalAssets(state);
    const invest = totalInvestableAssets(state);
    const investRatio = assets > 0 ? invest / assets : 0;
    const distinctTypes = new Set(state.assets.map(a => a.type)).size;
    const investmentScore = clamp(investRatio * 70 + clamp(distinctTypes / 4, 0, 1) * 30, 0, 100);

    const passiveIncomeScore = clamp(monthsCoveredByPassiveIncome(state) * 100, 0, 100);

    const freedomScore = clamp(freedomProgress(state), 0, 100);

    const doneGoals = state.lifeGoals.filter(g => g.done).length;
    const totalGoals = state.lifeGoals.length;
    const missionProgressAvg = state.missions.length
      ? state.missions.reduce((s, m) => s + clamp((m.currentSaved || 0) / (m.targetAmount || 1), 0, 1), 0) / state.missions.length * 100
      : 0;
    const lifestyleScore = clamp((totalGoals ? (doneGoals / totalGoals) * 50 : 0) + missionProgressAvg * 0.5, 0, 100);

    const charityExpense = sumBy(state.transactions.filter(t => monthKey(t.date) === currentMonthKey()), t => t.category === 'Từ thiện', 'amount');
    const communityGoals = state.lifeGoals.filter(g => g.category === 'community');
    const communityDone = communityGoals.filter(g => g.done).length;
    const impactScore = clamp(
      (inc > 0 ? clamp((charityExpense / inc) / 0.05, 0, 1) * 60 : 0) +
      (communityGoals.length ? (communityDone / communityGoals.length) * 40 : 0),
      0, 100
    );

    return {
      financialHealth: Math.round(financialHealth),
      savingScore: Math.round(savingScore),
      investmentScore: Math.round(investmentScore),
      passiveIncomeScore: Math.round(passiveIncomeScore),
      freedomScore: Math.round(freedomScore),
      lifestyleScore: Math.round(lifestyleScore),
      impactScore: Math.round(impactScore)
    };
  }

  function overallVictoryScore(scores) {
    const vals = Object.values(scores);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // ---- AI Coach (rule-based insights) ----
  function generateInsights(state) {
    const insights = [];
    const thisMonth = currentMonthKey();
    const now = new Date();
    const lastMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const expThis = monthlyExpense(state, thisMonth);
    const expLast = monthlyExpense(state, lastMonthKey);
    const incThis = monthlyIncome(state, thisMonth);

    // So sánh chi tiêu theo danh mục tháng này vs tháng trước
    const catThis = {};
    const catLast = {};
    txInMonth(state.transactions, thisMonth).filter(t => t.type === 'expense').forEach(t => { catThis[t.category] = (catThis[t.category] || 0) + t.amount; });
    txInMonth(state.transactions, lastMonthKey).filter(t => t.type === 'expense').forEach(t => { catLast[t.category] = (catLast[t.category] || 0) + t.amount; });
    Object.keys(catThis).forEach(cat => {
      const before = catLast[cat] || 0;
      if (before > 0 && catThis[cat] > before * 1.2) {
        const pct = Math.round((catThis[cat] / before - 1) * 100);
        insights.push({
          tone: 'warning',
          icon: '⚠️',
          title: `Chi tiêu "${cat}" tăng ${pct}%`,
          message: `Khoản chi "${cat}" tháng này tăng ${pct}% so với tháng trước. Điều chỉnh lại sẽ giúp bạn tiến gần hơn tới mục tiêu tự do tài chính.`
        });
      }
    });

    // Ngân sách
    state.budgets.forEach(b => {
      const spent = catThis[b.category] || 0;
      if (b.monthlyLimit > 0 && spent > b.monthlyLimit) {
        insights.push({
          tone: 'warning', icon: '🚨',
          title: `Vượt ngân sách "${b.category}"`,
          message: `Bạn đã chi ${fmtCompactVND(spent)} cho "${b.category}", vượt hạn mức ${fmtCompactVND(b.monthlyLimit)}.`
        });
      } else if (b.monthlyLimit > 0 && spent <= b.monthlyLimit && now.getDate() >= 24) {
        insights.push({
          tone: 'success', icon: '✅',
          title: `Giữ vững ngân sách "${b.category}"`,
          message: `Tuyệt vời! Bạn đang trong hạn mức "${b.category}" tháng này.`
        });
      }
    });

    // Tiết kiệm & tiến độ FI
    if (incThis > 0) {
      const rate = savingsRate(state, thisMonth);
      if (rate >= 0.2) {
        const withBonus = yearsToFIWithExtraRate(state, 0.1);
        const base = yearsToFI(state);
        const diffMonths = (base !== Infinity && withBonus !== Infinity) ? Math.round((base - withBonus) * 12) : null;
        insights.push({
          tone: 'success', icon: '💪',
          title: `Tỷ lệ tiết kiệm ${Math.round(rate * 100)}%`,
          message: diffMonths && diffMonths > 0
            ? `Nếu tăng thêm 10% tỷ lệ tiết kiệm, bạn có thể đạt tự do tài chính sớm hơn khoảng ${diffMonths} tháng.`
            : `Bạn đang duy trì tỷ lệ tiết kiệm tốt. Hãy tiếp tục phát huy!`
        });
      } else if (rate < 0.1) {
        insights.push({
          tone: 'info', icon: '💡',
          title: `Tỷ lệ tiết kiệm còn thấp (${Math.round(rate * 100)}%)`,
          message: `Thử đặt mục tiêu tiết kiệm tối thiểu 20% thu nhập để đẩy nhanh hành trình tự do tài chính.`
        });
      }
    }

    // Quỹ khẩn cấp
    const exp = state.profile.monthlyExpenseTarget || last3MonthsAvg(state, monthlyExpense);
    const monthsCovered = exp > 0 ? (state.emergencyFund.current || 0) / exp : 0;
    if (monthsCovered < 3) {
      insights.push({
        tone: 'info', icon: '🛟',
        title: 'Quỹ khẩn cấp chưa đủ',
        message: `Quỹ khẩn cấp hiện chỉ đủ dùng ${monthsCovered.toFixed(1)} tháng. Mục tiêu an toàn là 3-6 tháng chi phí sinh hoạt.`
      });
    }

    // Nợ lãi cao
    const highInterestDebt = state.debts.filter(d => (d.interestRate || 0) >= 0.15 && d.remaining > 0);
    if (highInterestDebt.length) {
      insights.push({
        tone: 'warning', icon: '💳',
        title: 'Có khoản nợ lãi suất cao',
        message: `Ưu tiên trả trước khoản "${highInterestDebt[0].name}" (lãi ${Math.round(highInterestDebt[0].interestRate * 100)}%/năm) để giảm gánh nặng lãi vay.`
      });
    }

    // Chưa đầu tư
    if (totalInvestableAssets(state) === 0 && totalAssets(state) > 0) {
      insights.push({
        tone: 'info', icon: '📈',
        title: 'Chưa có khoản đầu tư tăng trưởng',
        message: `Toàn bộ tài sản đang ở dạng tiền mặt/tiết kiệm. Cân nhắc phân bổ một phần sang đầu tư để tiền sinh ra tiền.`
      });
    }

    // Milestone tiến độ tự do tài chính
    const progress = freedomProgress(state);
    if (progress >= 25 && progress < 100) {
      insights.push({
        tone: 'success', icon: '🎯',
        title: `Đã đi được ${Math.round(progress)}% hành trình`,
        message: `Bạn đã đạt ${Math.round(progress)}% mục tiêu tự do tài chính. Cứ vững bước!`
      });
    }

    if (!insights.length) {
      insights.push({
        tone: 'info', icon: '👋',
        title: 'Bắt đầu hành trình VICTORY',
        message: `Hãy thêm thu nhập, chi tiêu và tài sản để nhận gợi ý cá nhân hóa từ VICTORY Coach.`
      });
    }

    return insights;
  }

  function yearsToFIWithExtraRate(state, extraRate) {
    const inc = last3MonthsAvg(state, monthlyIncome);
    const exp = last3MonthsAvg(state, monthlyExpense);
    const baseRate = inc > 0 ? clamp((inc - exp) / inc, 0, 1) : 0;
    const newRate = clamp(baseRate + extraRate, 0, 1);
    const fire = fireNumber(state);
    const investable = totalInvestableAssets(state) + totalCashLikeAssets(state);
    const monthlyContribution = Math.max(0, inc * newRate);
    const months = monthsToReachTarget(investable, fire, monthlyContribution, state.profile.expectedReturnRate || 0.08);
    return months === Infinity ? Infinity : months / 12;
  }

  window.Calc = {
    fmtVND, fmtCompactVND, monthKey, currentMonthKey, localISODate,
    monthlyIncome, monthlyExpense, last3MonthsAvg,
    totalDebtRemaining, totalAssets, totalInvestableAssets, totalCashLikeAssets, netWorth,
    monthlyPassiveIncome, savingsRate, fireNumber, freedomProgress,
    monthsCoveredByPassiveIncome, requiredMonthlySavings, monthsToReachTarget,
    yearsToFI, yearsToFIWithExtraRate, victoryScores, overallVictoryScore, generateInsights,
    debtToIncomeRatio, netWorthChangePct, ratingLabel, projectedFreedomAge, daysSinceInstall
  };
})();
