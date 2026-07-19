/* Customizable Excel export — user picks which columns to include, exports the currently filtered list. */
const ExportXLS = (() => {
  function fmtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }

  function labelsOf(keys, list) {
    return (keys || []).map(k => {
      const item = list.find(i => i.key === k);
      return item ? item.label : k;
    }).join(', ');
  }

  function feeHistorySummary(company) {
    const fees = (company.membership && company.membership.fees) || [];
    if (!fees.length) return '';
    return fees
      .slice().sort((a, b) => a.year - b.year)
      .map(f => `${f.year}: ${f.paidDate ? 'Đã đóng ' + (f.fee || 0).toLocaleString('vi-VN') + 'đ (' + fmtDate(f.paidDate) + ')' : 'Chưa đóng'}`)
      .join('; ');
  }

  // Field catalog — grouped for the picker UI, each with a getValue(company, groupName) extractor.
  const FIELD_GROUPS = [
    {
      title: 'Thông tin doanh nghiệp',
      fields: [
        { key: 'code', label: 'Mã đơn vị', get: c => c.code },
        { key: 'nameVN', label: 'Tên doanh nghiệp (VN)', get: c => c.nameVN },
        { key: 'nameEN', label: 'Company name (EN)', get: c => c.nameEN },
        { key: 'industry', label: 'Ngành nghề', get: c => c.industry },
        { key: 'businessTypes', label: 'Loại hình hoạt động', get: c => labelsOf(c.businessTypes, Storage.BUSINESS_TYPES) },
        { key: 'capabilities', label: 'Lĩnh vực / năng lực', get: c => labelsOf(c.capabilities, Storage.CAPABILITIES) },
        { key: 'addressRegistered', label: 'Địa chỉ trên giấy ĐKKD', get: c => c.addressRegistered },
        { key: 'addressMailing', label: 'Địa chỉ liên lạc & gửi thư', get: c => c.addressMailing },
        { key: 'ward', label: 'Phường/Xã', get: c => c.ward },
        { key: 'establishedDate', label: 'Ngày thành lập', get: c => fmtDate(c.establishedDate) },
        { key: 'revenue', label: 'Doanh số (tỉ đồng)', get: c => c.revenue },
        { key: 'exportPercent', label: 'Doanh số xuất khẩu (%)', get: c => c.exportPercent },
        { key: 'laborSize', label: 'Quy mô lao động', get: c => c.laborSize },
        { key: 'website', label: 'Website', get: c => c.website },
        { key: 'groupName', label: 'Nhóm dữ liệu', get: (c, groupName) => groupName },
        { key: 'note', label: 'Ghi chú', get: c => c.note },
      ],
    },
    {
      title: 'Đại diện 1',
      fields: [
        { key: 'rep1Title', label: 'Đại diện 1 — Danh xưng', get: c => (c.contacts[0] || {}).title },
        { key: 'rep1Name', label: 'Đại diện 1 — Họ & tên', get: c => (c.contacts[0] || {}).name },
        { key: 'rep1Position', label: 'Đại diện 1 — Chức vụ DN', get: c => (c.contacts[0] || {}).position },
        { key: 'rep1Degree', label: 'Đại diện 1 — Học hàm/học vị', get: c => (c.contacts[0] || {}).degree },
        { key: 'rep1Phone', label: 'Đại diện 1 — Điện thoại', get: c => (c.contacts[0] || {}).phone },
        { key: 'rep1Email1', label: 'Đại diện 1 — Email chính', get: c => (c.contacts[0] || {}).email1 },
        { key: 'rep1Email2', label: 'Đại diện 1 — Email phụ', get: c => (c.contacts[0] || {}).email2 },
        { key: 'rep1Dob', label: 'Đại diện 1 — Ngày sinh', get: c => fmtDate((c.contacts[0] || {}).dob) },
        { key: 'rep1Role', label: 'Đại diện 1 — Chức vụ hội', get: c => (c.contacts[0] || {}).associationPosition },
      ],
    },
    {
      title: 'Đại diện 2',
      fields: [
        { key: 'rep2Title', label: 'Đại diện 2 — Danh xưng', get: c => (c.contacts[1] || {}).title },
        { key: 'rep2Name', label: 'Đại diện 2 — Họ & tên', get: c => (c.contacts[1] || {}).name },
        { key: 'rep2Position', label: 'Đại diện 2 — Chức vụ DN', get: c => (c.contacts[1] || {}).position },
        { key: 'rep2Degree', label: 'Đại diện 2 — Học hàm/học vị', get: c => (c.contacts[1] || {}).degree },
        { key: 'rep2Phone', label: 'Đại diện 2 — Điện thoại', get: c => (c.contacts[1] || {}).phone },
        { key: 'rep2Email1', label: 'Đại diện 2 — Email chính', get: c => (c.contacts[1] || {}).email1 },
        { key: 'rep2Email2', label: 'Đại diện 2 — Email phụ', get: c => (c.contacts[1] || {}).email2 },
        { key: 'rep2Dob', label: 'Đại diện 2 — Ngày sinh', get: c => fmtDate((c.contacts[1] || {}).dob) },
      ],
    },
    {
      title: 'Hội phí',
      fields: [
        { key: 'feeContactName', label: 'Người phụ trách hội phí — Họ & tên', get: c => (c.membership || {}).contactName },
        { key: 'feeContactPhone', label: 'Người phụ trách hội phí — Điện thoại', get: c => (c.membership || {}).contactPhone },
        { key: 'feeContactEmail', label: 'Người phụ trách hội phí — Email', get: c => (c.membership || {}).contactEmail },
        { key: 'joinDate', label: 'Ngày vào hội', get: c => fmtDate((c.membership || {}).joinDate) },
        { key: 'feeHistory', label: 'Lịch sử hội phí (tóm tắt)', get: c => feeHistorySummary(c) },
      ],
    },
  ];

  const ALL_FIELDS = FIELD_GROUPS.flatMap(g => g.fields);
  const DEFAULT_KEYS = ['code', 'nameVN', 'industry', 'groupName', 'rep1Name', 'rep1Phone', 'rep1Email1', 'laborSize', 'feeHistory'];

  function buildRows(companies, groups, selectedKeys) {
    const fields = selectedKeys.map(k => ALL_FIELDS.find(f => f.key === k)).filter(Boolean);
    const header = fields.map(f => f.label);
    const rows = companies.map(c => {
      const g = groups.find(g => g.id === c.groupId);
      return fields.map(f => f.get(c, g ? g.name : ''));
    });
    return { header, rows };
  }

  function download(companies, groups, selectedKeys, filenameBase) {
    const { header, rows } = buildRows(companies, groups, selectedKeys);
    const filename = `${filenameBase}-${Storage.localISODate(new Date())}`;

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      ws['!cols'] = header.map(() => ({ wch: 22 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hội viên');
      XLSX.writeFile(wb, `${filename}.xlsx`);
      return 'xlsx';
    }

    // Fallback if the CDN library failed to load (e.g. offline): Excel-compatible CSV with BOM.
    const escapeCsv = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const csv = '﻿' + [header, ...rows].map(r => r.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return 'csv';
  }

  return { FIELD_GROUPS, ALL_FIELDS, DEFAULT_KEYS, download };
})();
