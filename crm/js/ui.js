/* CRM UI — routing, rendering, forms. Hash routes: #/dashboard #/companies #/groups */
const UI = (() => {
  const app = () => document.getElementById('app');
  const modalRoot = () => document.getElementById('modalRoot');

  let filters = { search: '', groupId: '', capability: '' };
  let editingCompanyId = null;
  let activeTab = 'company';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }

  function groupById(id) {
    return Storage.getState().groups.find(g => g.id === id);
  }

  function currentYear() {
    return new Date().getFullYear();
  }

  // ---------- Router ----------
  function route() {
    const hash = location.hash.replace('#/', '') || 'dashboard';
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === hash);
    });
    if (hash === 'companies') renderCompanies();
    else if (hash === 'groups') renderGroups();
    else renderDashboard();
  }

  window.addEventListener('hashchange', route);

  // ---------- Dashboard ----------
  function renderDashboard() {
    const state = Storage.getState();
    const companies = state.companies;
    const totalCompanies = companies.length;
    const totalGroups = state.groups.length;
    const year = currentYear();

    let paid = 0, unpaid = 0;
    companies.forEach(c => {
      const status = Storage.currentYearFeeStatus(c, year);
      if (status === 'paid') paid++; else unpaid++;
    });

    const birthdays30 = Storage.upcomingBirthdays(30);
    const birthdays7 = birthdays30.filter(b => b.daysUntil <= 7);

    const typeCounts = Storage.BUSINESS_TYPES.map(t => ({
      label: t.label,
      value: companies.filter(c => (c.businessTypes || []).includes(t.key)).length,
      color: ['#7c9cff', '#4fd1c5', '#f5a623', '#f56565', '#b794f4'][Storage.BUSINESS_TYPES.indexOf(t)],
    })).filter(t => t.value > 0);

    const capCounts = Storage.CAPABILITIES.map(cap => ({
      label: cap.label,
      value: companies.filter(c => (c.capabilities || []).includes(cap.key)).length,
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

    app().innerHTML = `
      <div class="page-head">
        <h1>Tổng quan</h1>
        <p>Toàn bộ hội viên và theo từng nhóm dữ liệu</p>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Tổng doanh nghiệp</div>
          <div class="kpi-value">${totalCompanies}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Nhóm dữ liệu</div>
          <div class="kpi-value">${totalGroups}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Hội phí ${year} đã đóng</div>
          <div class="kpi-value">${paid}<span class="kpi-sub">/${totalCompanies}</span></div>
        </div>
        <div class="kpi-card accent">
          <div class="kpi-label">Sinh nhật trong 30 ngày</div>
          <div class="kpi-value">${birthdays30.length}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head">
            <h2>Phân bổ theo loại hình</h2>
          </div>
          <div class="panel-body donut-row">
            <div id="typeDonut"></div>
            <div class="legend">
              ${typeCounts.map(t => `<div class="legend-row"><span class="dot" style="background:${t.color}"></span>${t.label}<b>${t.value}</b></div>`).join('') || '<div class="empty-hint">Chưa có dữ liệu</div>'}
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h2>Sinh nhật đại diện sắp tới</h2>
            <span class="pill">${birthdays7.length} trong 7 ngày</span>
          </div>
          <div class="panel-body">
            ${birthdays30.length ? `<div class="birthday-list">${birthdays30.slice(0, 8).map(b => birthdayRow(b)).join('')}</div>`
              : '<div class="empty-hint">Không có sinh nhật nào trong 30 ngày tới</div>'}
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h2>Lĩnh vực / năng lực phổ biến</h2></div>
          <div class="panel-body"><div id="capBars"></div></div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h2>Nhóm dữ liệu</h2>
            <a href="#/groups" class="link-sm">Quản lý →</a>
          </div>
          <div class="panel-body">
            ${state.groups.map(g => groupCardMini(g, companies)).join('') || '<div class="empty-hint">Chưa có nhóm nào</div>'}
          </div>
        </div>
      </div>

      ${unpaid > 0 ? `
      <div class="panel">
        <div class="panel-head">
          <h2>Chưa đóng hội phí ${year}</h2>
          <a href="#/companies" class="link-sm">Xem tất cả →</a>
        </div>
        <div class="panel-body">
          <div class="mini-table">
            ${companies.filter(c => Storage.currentYearFeeStatus(c, year) !== 'paid').slice(0, 6).map(c => `
              <div class="mini-row">
                <span>${escapeHtml(c.nameVN)}</span>
                <span class="badge badge-warn">Chưa đóng</span>
              </div>`).join('')}
          </div>
        </div>
      </div>` : ''}
    `;

    if (typeCounts.length) Charts.donut(document.getElementById('typeDonut'), typeCounts, { centerLabel: 'lượt' });
    else document.getElementById('typeDonut').innerHTML = '';
    if (capCounts.length) Charts.hbars(document.getElementById('capBars'), capCounts);
    else document.getElementById('capBars').innerHTML = '<div class="empty-hint">Chưa có dữ liệu</div>';

    document.querySelectorAll('[data-copy-wish]').forEach(btn => {
      btn.addEventListener('click', () => copyBirthdayWish(btn.dataset.copyWish, btn.dataset.name));
    });
  }

  function birthdayRow(b) {
    const soonClass = b.daysUntil === 0 ? 'today' : (b.daysUntil <= 7 ? 'soon' : '');
    const when = b.daysUntil === 0 ? 'Hôm nay' : (b.daysUntil === 1 ? 'Ngày mai' : `Còn ${b.daysUntil} ngày`);
    return `
      <div class="birthday-row ${soonClass}">
        <div class="bd-avatar">${escapeHtml((b.contact.name || '?').charAt(0))}</div>
        <div class="bd-info">
          <div class="bd-name">${escapeHtml(b.contact.name || '(chưa có tên)')}</div>
          <div class="bd-company">${escapeHtml(b.company.nameVN)}</div>
        </div>
        <div class="bd-when">
          <div class="bd-days">${when}</div>
          <div class="bd-date">${fmtDate(b.nextDate)}</div>
        </div>
        <button class="btn-icon" title="Sao chép lời chúc" data-copy-wish="${escapeHtml(b.contact.phone || '')}" data-name="${escapeHtml(b.contact.name || '')}">✎</button>
      </div>`;
  }

  function copyBirthdayWish(phone, name) {
    const msg = `Chúc mừng sinh nhật ${name}! Kính chúc Anh/Chị luôn mạnh khỏe, hạnh phúc và thành công. Trân trọng.`;
    navigator.clipboard.writeText(msg).then(() => toast('Đã sao chép lời chúc — dán vào Zalo/SMS để gửi' + (phone ? ` (SĐT: ${phone})` : '')));
  }

  function groupCardMini(g, companies) {
    const count = companies.filter(c => c.groupId === g.id).length;
    const pct = companies.length ? Math.round((count / companies.length) * 100) : 0;
    return `
      <div class="group-mini" data-goto-group="${g.id}">
        <div class="group-mini-top">
          <span class="dot" style="background:${g.color}"></span>
          <span class="group-mini-name">${escapeHtml(g.name)}</span>
          <span class="group-mini-count">${count}</span>
        </div>
        <div class="hbar-track thin"><div class="hbar-fill" style="width:${pct}%;background:${g.color}"></div></div>
      </div>`;
  }

  // ---------- Companies ----------
  function renderCompanies() {
    const state = Storage.getState();
    const year = currentYear();
    let list = state.companies.slice();

    if (filters.groupId) list = list.filter(c => c.groupId === filters.groupId);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c =>
        (c.nameVN || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.contacts || []).some(ct => (ct.phone || '').includes(q) || (ct.name || '').toLowerCase().includes(q))
      );
    }

    app().innerHTML = `
      <div class="page-head">
        <h1>Doanh nghiệp / Hội viên</h1>
        <p>${state.companies.length} doanh nghiệp · ${state.groups.length} nhóm dữ liệu</p>
      </div>

      <div class="toolbar">
        <input id="searchInput" type="text" placeholder="Tìm theo tên, mã ĐV, SĐT, người đại diện..." value="${escapeHtml(filters.search)}" />
        <select id="groupFilter">
          <option value="">Tất cả nhóm</option>
          ${state.groups.map(g => `<option value="${g.id}" ${filters.groupId === g.id ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
        </select>
        <div class="spacer"></div>
        <button class="btn-ghost" id="btnExport">Xuất JSON</button>
        <label class="btn-ghost file-label">Nhập JSON<input type="file" id="importFile" accept="application/json" hidden /></label>
        <button class="btn-primary" id="btnAddCompany">+ Thêm doanh nghiệp</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Doanh nghiệp</th>
              <th>Ngành nghề</th>
              <th>Đại diện chính</th>
              <th>Nhóm</th>
              <th>Quy mô LĐ</th>
              <th>Hội phí ${year}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${list.map(c => companyRow(c, year)).join('') || `<tr><td colspan="7" class="empty-hint">Không có doanh nghiệp nào khớp bộ lọc</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('searchInput').addEventListener('input', e => { filters.search = e.target.value; renderCompanies(); });
    document.getElementById('groupFilter').addEventListener('change', e => { filters.groupId = e.target.value; renderCompanies(); });
    document.getElementById('btnAddCompany').addEventListener('click', () => openCompanyModal(null));
    document.getElementById('btnExport').addEventListener('click', exportJSON);
    document.getElementById('importFile').addEventListener('change', importJSON);

    document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => openCompanyModal(el.dataset.view, true)));
    document.querySelectorAll('[data-edit]').forEach(el => el.addEventListener('click', () => openCompanyModal(el.dataset.edit, false)));
    document.querySelectorAll('[data-delete]').forEach(el => el.addEventListener('click', () => deleteCompanyConfirm(el.dataset.delete)));
  }

  function companyRow(c, year) {
    const g = groupById(c.groupId);
    const rep1 = (c.contacts || [])[0] || {};
    const feeStatus = Storage.currentYearFeeStatus(c, year);
    const feeBadge = feeStatus === 'paid' ? '<span class="badge badge-ok">Đã đóng</span>'
      : feeStatus === 'unpaid' ? '<span class="badge badge-warn">Chưa đóng</span>'
      : '<span class="badge badge-muted">Chưa có</span>';
    return `
      <tr>
        <td>
          <div class="cell-title">${escapeHtml(c.nameVN)}</div>
          <div class="cell-sub">${escapeHtml(c.code || '—')}</div>
        </td>
        <td class="cell-sub">${escapeHtml(c.industry || '—')}</td>
        <td>
          <div class="cell-title">${escapeHtml(rep1.name || '—')}</div>
          <div class="cell-sub">${escapeHtml(rep1.phone || '')}</div>
        </td>
        <td>${g ? `<span class="badge" style="background:${g.color}22;color:${g.color};border-color:${g.color}55">${escapeHtml(g.name)}</span>` : '—'}</td>
        <td class="cell-sub">${escapeHtml(c.laborSize || '—')}</td>
        <td>${feeBadge}</td>
        <td class="cell-actions">
          <button class="btn-icon" data-view="${c.id}" title="Xem">👁</button>
          <button class="btn-icon" data-edit="${c.id}" title="Sửa">✎</button>
          <button class="btn-icon danger" data-delete="${c.id}" title="Xóa">🗑</button>
        </td>
      </tr>`;
  }

  function deleteCompanyConfirm(id) {
    const c = Storage.getState().companies.find(c => c.id === id);
    if (!c) return;
    if (confirm(`Xóa doanh nghiệp "${c.nameVN}"? Hành động này không thể hoàn tác.`)) {
      Storage.deleteCompany(id);
      renderCompanies();
    }
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(Storage.getState(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `crm-data-${Storage.localISODate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!confirm('Nhập dữ liệu này sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?')) return;
        Storage.replaceAll(data);
        renderCompanies();
        toast('Đã nhập dữ liệu thành công');
      } catch (err) {
        alert('File JSON không hợp lệ');
      }
    };
    reader.readAsText(file);
  }

  // ---------- Groups ----------
  function renderGroups() {
    const state = Storage.getState();
    app().innerHTML = `
      <div class="page-head">
        <h1>Nhóm dữ liệu</h1>
        <p>Quản lý các nhóm data riêng biệt — mỗi doanh nghiệp thuộc một nhóm</p>
      </div>
      <div class="toolbar">
        <div class="spacer"></div>
        <button class="btn-primary" id="btnAddGroup">+ Thêm nhóm</button>
      </div>
      <div class="group-grid">
        ${state.groups.map(g => groupCardFull(g, state.companies)).join('') || '<div class="empty-hint">Chưa có nhóm nào</div>'}
      </div>
    `;
    document.getElementById('btnAddGroup').addEventListener('click', () => openGroupPrompt(null));
    document.querySelectorAll('[data-rename-group]').forEach(el => el.addEventListener('click', () => openGroupPrompt(el.dataset.renameGroup)));
    document.querySelectorAll('[data-delete-group]').forEach(el => el.addEventListener('click', () => deleteGroupConfirm(el.dataset.deleteGroup)));
    document.querySelectorAll('[data-filter-group]').forEach(el => el.addEventListener('click', () => {
      filters.groupId = el.dataset.filterGroup;
      location.hash = '#/companies';
    }));
  }

  function groupCardFull(g, companies) {
    const list = companies.filter(c => c.groupId === g.id);
    const totalValue = list.length;
    return `
      <div class="group-card">
        <div class="group-card-top">
          <span class="dot lg" style="background:${g.color}"></span>
          <h3>${escapeHtml(g.name)}</h3>
        </div>
        <div class="group-card-count">${totalValue}<span> doanh nghiệp</span></div>
        <div class="group-card-actions">
          <button class="btn-ghost sm" data-filter-group="${g.id}">Xem danh sách</button>
          <button class="btn-icon" data-rename-group="${g.id}" title="Đổi tên">✎</button>
          <button class="btn-icon danger" data-delete-group="${g.id}" title="Xóa nhóm">🗑</button>
        </div>
      </div>`;
  }

  function openGroupPrompt(id) {
    const existing = id ? groupById(id) : null;
    const name = prompt(existing ? 'Đổi tên nhóm:' : 'Tên nhóm mới:', existing ? existing.name : '');
    if (name === null) return;
    if (existing) Storage.renameGroup(id, name);
    else Storage.addGroup(name);
    renderGroups();
  }

  function deleteGroupConfirm(id) {
    const g = groupById(id);
    if (!g) return;
    const count = Storage.getState().companies.filter(c => c.groupId === id).length;
    const warn = count ? ` và ${count} doanh nghiệp thuộc nhóm này` : '';
    if (confirm(`Xóa nhóm "${g.name}"${warn}? Hành động này không thể hoàn tác.`)) {
      Storage.deleteGroup(id);
      renderGroups();
    }
  }

  // ---------- Company modal (tabbed form) ----------
  function openCompanyModal(companyId, readOnly) {
    editingCompanyId = companyId;
    activeTab = 'company';
    const state = Storage.getState();
    const company = companyId ? state.companies.find(c => c.id === companyId) : Storage.emptyCompany(filters.groupId || (state.groups[0] && state.groups[0].id) || '');
    if (!company) return;
    renderModal(company, !!readOnly);
  }

  function renderModal(company, readOnly) {
    const state = Storage.getState();
    const c = JSON.parse(JSON.stringify(company)); // working copy
    if (!c.contacts) c.contacts = [Storage.emptyContact(true), Storage.emptyContact(false)];
    if (!c.membership) c.membership = Storage.emptyMembership();

    modalRoot().innerHTML = `
      <div class="modal-backdrop">
        <div class="modal">
          <div class="modal-head">
            <h2>${readOnly ? 'Chi tiết doanh nghiệp' : (editingCompanyId ? 'Sửa doanh nghiệp' : 'Thêm doanh nghiệp mới')}</h2>
            <button class="btn-icon" id="modalClose">✕</button>
          </div>
          <div class="tabs">
            <button class="tab-btn ${activeTab === 'company' ? 'active' : ''}" data-tab="company">Doanh nghiệp</button>
            <button class="tab-btn ${activeTab === 'rep1' ? 'active' : ''}" data-tab="rep1">Đại diện 1</button>
            <button class="tab-btn ${activeTab === 'rep2' ? 'active' : ''}" data-tab="rep2">Đại diện 2</button>
            <button class="tab-btn ${activeTab === 'fees' ? 'active' : ''}" data-tab="fees">Hội phí</button>
          </div>
          <form id="companyForm" class="modal-body">
            <fieldset ${readOnly ? 'disabled' : ''}>
              <div class="tab-panel ${activeTab === 'company' ? 'active' : ''}" data-panel="company">${companyTab(c, state)}</div>
              <div class="tab-panel ${activeTab === 'rep1' ? 'active' : ''}" data-panel="rep1">${contactTab(c.contacts[0], 0, true)}</div>
              <div class="tab-panel ${activeTab === 'rep2' ? 'active' : ''}" data-panel="rep2">${contactTab(c.contacts[1], 1, false)}</div>
              <div class="tab-panel ${activeTab === 'fees' ? 'active' : ''}" data-panel="fees">${feesTab(c)}</div>
            </fieldset>
            <div class="modal-footer">
              ${readOnly
                ? `<button type="button" class="btn-primary" id="btnSwitchEdit">Sửa doanh nghiệp này</button>`
                : `<button type="button" class="btn-ghost" id="modalCancel">Hủy</button><button type="submit" class="btn-primary">Lưu</button>`}
            </div>
          </form>
        </div>
      </div>`;

    document.getElementById('modalClose').addEventListener('click', closeModal);
    if (!readOnly) document.getElementById('modalCancel').addEventListener('click', closeModal);
    if (readOnly) document.getElementById('btnSwitchEdit').addEventListener('click', () => openCompanyModal(company.id, false));

    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      collectFormInto(c); // preserve edits made before switching tabs
      renderModal(c, readOnly);
    }));

    if (!readOnly) {
      document.getElementById('companyForm').addEventListener('submit', e => {
        e.preventDefault();
        collectFormInto(c);
        if (!c.nameVN.trim()) { alert('Vui lòng nhập tên doanh nghiệp'); activeTab = 'company'; renderModal(c, false); return; }
        if (editingCompanyId) Storage.updateCompany(editingCompanyId, c);
        else Storage.addCompany(c);
        closeModal();
        route();
      });

      const addFeeBtn = document.getElementById('btnAddFeeRow');
      if (addFeeBtn) addFeeBtn.addEventListener('click', () => {
        collectFormInto(c);
        c.membership.fees.push({ year: currentYear(), fee: 0, paidDate: '', note: '' });
        renderModal(c, false);
      });
      document.querySelectorAll('[data-remove-fee]').forEach(btn => btn.addEventListener('click', () => {
        collectFormInto(c);
        c.membership.fees.splice(Number(btn.dataset.removeFee), 1);
        renderModal(c, false);
      }));
    }
  }

  function companyTab(c, state) {
    return `
      <div class="form-grid">
        <label>Mã đơn vị<input name="code" value="${escapeHtml(c.code)}" /></label>
        <label>Nhóm dữ liệu
          <select name="groupId">
            ${state.groups.map(g => `<option value="${g.id}" ${c.groupId === g.id ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
          </select>
        </label>
        <label class="col-2">Tên doanh nghiệp (VN)*<input name="nameVN" value="${escapeHtml(c.nameVN)}" required /></label>
        <label class="col-2">Company name (EN)<input name="nameEN" value="${escapeHtml(c.nameEN)}" /></label>
        <label class="col-2">Ngành nghề<input name="industry" value="${escapeHtml(c.industry)}" /></label>
      </div>

      <div class="form-section-title">Loại hình hoạt động</div>
      <div class="chip-grid">
        ${Storage.BUSINESS_TYPES.map(t => `
          <label class="chip">
            <input type="checkbox" name="businessTypes" value="${t.key}" ${c.businessTypes.includes(t.key) ? 'checked' : ''} />
            ${t.label}
          </label>`).join('')}
      </div>

      <div class="form-section-title">Lĩnh vực / năng lực</div>
      <div class="chip-grid">
        ${Storage.CAPABILITIES.map(cap => `
          <label class="chip">
            <input type="checkbox" name="capabilities" value="${cap.key}" ${c.capabilities.includes(cap.key) ? 'checked' : ''} />
            ${cap.label}
          </label>`).join('')}
      </div>

      <div class="form-section-title">Địa chỉ &amp; quy mô</div>
      <div class="form-grid">
        <label class="col-2">Địa chỉ trên giấy ĐKKD<input name="addressRegistered" value="${escapeHtml(c.addressRegistered)}" /></label>
        <label class="col-2">Địa chỉ liên lạc &amp; gửi thư<input name="addressMailing" value="${escapeHtml(c.addressMailing)}" /></label>
        <label>Phường/Xã<input name="ward" value="${escapeHtml(c.ward)}" /></label>
        <label>Ngày thành lập<input type="date" name="establishedDate" value="${escapeHtml(c.establishedDate)}" /></label>
        <label>Doanh số (tỉ đồng)<input name="revenue" value="${escapeHtml(c.revenue)}" /></label>
        <label>Doanh số xuất khẩu (%)<input name="exportPercent" value="${escapeHtml(c.exportPercent)}" /></label>
        <label>Quy mô lao động<input name="laborSize" value="${escapeHtml(c.laborSize)}" /></label>
        <label>Website<input name="website" value="${escapeHtml(c.website)}" /></label>
        <label class="col-2">Ghi chú<textarea name="note">${escapeHtml(c.note)}</textarea></label>
      </div>`;
  }

  function contactTab(contact, index, withRole) {
    const p = `contacts.${index}.`;
    return `
      <div class="form-grid">
        <label>Danh xưng
          <select name="${p}title">
            ${Storage.TITLES.map(t => `<option ${contact.title === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </label>
        <label>Họ &amp; tên<input name="${p}name" value="${escapeHtml(contact.name)}" /></label>
        <label>Chức vụ doanh nghiệp<input name="${p}position" value="${escapeHtml(contact.position)}" /></label>
        <label>Học hàm/học vị<input name="${p}degree" value="${escapeHtml(contact.degree)}" /></label>
        <label>Điện thoại<input name="${p}phone" value="${escapeHtml(contact.phone)}" /></label>
        <label>Email chính<input type="email" name="${p}email1" value="${escapeHtml(contact.email1)}" /></label>
        <label>Email phụ<input type="email" name="${p}email2" value="${escapeHtml(contact.email2)}" /></label>
        <label>Ngày sinh<input type="date" name="${p}dob" value="${escapeHtml(contact.dob)}" /></label>
        ${withRole ? `<label>Chức vụ hội<input name="${p}associationPosition" value="${escapeHtml(contact.associationPosition || '')}" /></label>` : ''}
      </div>`;
  }

  function feesTab(c) {
    return `
      <div class="form-grid">
        <label>Ngày vào hội<input type="date" name="membership.joinDate" value="${escapeHtml(c.membership.joinDate)}" /></label>
      </div>
      <div class="form-section-title">Hội phí theo năm</div>
      <div class="fee-table">
        <div class="fee-row fee-head"><span>Năm</span><span>Mức phí (đ)</span><span>Ngày đóng</span><span>Ghi chú</span><span></span></div>
        ${c.membership.fees.map((f, i) => `
          <div class="fee-row">
            <input type="number" name="fees.${i}.year" value="${f.year}" />
            <input type="number" name="fees.${i}.fee" value="${f.fee}" />
            <input type="date" name="fees.${i}.paidDate" value="${escapeHtml(f.paidDate)}" />
            <input type="text" name="fees.${i}.note" value="${escapeHtml(f.note)}" />
            <button type="button" class="btn-icon danger" data-remove-fee="${i}" title="Xóa dòng">🗑</button>
          </div>`).join('')}
      </div>
      <button type="button" class="btn-ghost sm" id="btnAddFeeRow">+ Thêm năm</button>`;
  }

  function collectFormInto(c) {
    const form = document.getElementById('companyForm');
    if (!form) return;
    const fd = new FormData(form);

    ['code', 'nameVN', 'nameEN', 'industry', 'addressRegistered', 'addressMailing', 'ward',
      'establishedDate', 'revenue', 'exportPercent', 'laborSize', 'website', 'note', 'groupId'].forEach(key => {
      if (fd.has(key)) c[key] = fd.get(key);
    });
    c.businessTypes = fd.getAll('businessTypes');
    c.capabilities = fd.getAll('capabilities');

    [0, 1].forEach(i => {
      const contact = c.contacts[i] || Storage.emptyContact(i === 0);
      ['title', 'name', 'position', 'degree', 'phone', 'email1', 'email2', 'dob', 'associationPosition'].forEach(f => {
        const key = `contacts.${i}.${f}`;
        if (fd.has(key)) contact[f] = fd.get(key);
      });
      c.contacts[i] = contact;
    });

    if (fd.has('membership.joinDate')) c.membership.joinDate = fd.get('membership.joinDate');
    c.membership.fees.forEach((f, i) => {
      if (fd.has(`fees.${i}.year`)) f.year = Number(fd.get(`fees.${i}.year`));
      if (fd.has(`fees.${i}.fee`)) f.fee = Number(fd.get(`fees.${i}.fee`));
      if (fd.has(`fees.${i}.paidDate`)) f.paidDate = fd.get(`fees.${i}.paidDate`);
      if (fd.has(`fees.${i}.note`)) f.note = fd.get(`fees.${i}.note`);
    });
  }

  function closeModal() {
    modalRoot().innerHTML = '';
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // ---------- Sample-data banner ----------
  function renderSampleBanner() {
    const banner = document.getElementById('sampleBanner');
    if (!banner) return;
    const isSample = Storage.getState().isSample;
    banner.style.display = isSample ? 'flex' : 'none';
    if (isSample) {
      document.getElementById('btnClearSample').onclick = () => {
        if (confirm('Xóa toàn bộ dữ liệu mẫu để bắt đầu nhập dữ liệu thật?')) {
          Storage.clearSampleData();
          renderSampleBanner();
          route();
        }
      };
    }
  }

  function init() {
    renderSampleBanner();
    route();
    document.body.addEventListener('click', e => {
      const gotoGroup = e.target.closest('[data-goto-group]');
      if (gotoGroup) {
        filters.groupId = gotoGroup.dataset.gotoGroup;
        location.hash = '#/companies';
      }
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', UI.init);
