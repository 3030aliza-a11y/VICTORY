/* Excel import — parses an uploaded .xlsx/.csv, auto-guesses which source column maps to
   which app field (handling the source sheet's repeated headers: "Họ & tên" appears for
   rep 1, rep 2, and the fee/secretary contact), lets the user review/fix the mapping, then
   builds Company objects from the mapped rows. */
const ImportXLS = (() => {
  const CURRENT_YEAR = new Date().getFullYear();
  const FEE_YEAR_RANGE = [];
  for (let y = CURRENT_YEAR - 7; y <= CURRENT_YEAR + 1; y++) FEE_YEAR_RANGE.push(y);

  // Flat catalog of non-repeating targets, grouped for the mapping dropdown's <optgroup>.
  const TARGET_CATALOG = [
    { key: 'code', label: 'Mã đơn vị', group: 'Doanh nghiệp' },
    { key: 'nameVN', label: 'Tên doanh nghiệp (VN)', group: 'Doanh nghiệp' },
    { key: 'nameEN', label: 'Company name (EN)', group: 'Doanh nghiệp' },
    { key: 'industry', label: 'Ngành nghề', group: 'Doanh nghiệp' },
    { key: 'addressRegistered', label: 'Địa chỉ trên giấy ĐKKD', group: 'Doanh nghiệp' },
    { key: 'addressMailing', label: 'Địa chỉ liên lạc & gửi thư', group: 'Doanh nghiệp' },
    { key: 'ward', label: 'Phường/Xã', group: 'Doanh nghiệp' },
    { key: 'establishedDate', label: 'Ngày thành lập', group: 'Doanh nghiệp' },
    { key: 'revenue', label: 'Doanh số (tỉ đồng)', group: 'Doanh nghiệp' },
    { key: 'exportPercent', label: 'Doanh số xuất khẩu (%)', group: 'Doanh nghiệp' },
    { key: 'laborSize', label: 'Quy mô lao động', group: 'Doanh nghiệp' },
    { key: 'website', label: 'Website', group: 'Doanh nghiệp' },
    { key: 'note', label: 'Ghi chú', group: 'Doanh nghiệp' },
    ...Storage.BUSINESS_TYPES.map(t => ({ key: `bt:${t.key}`, label: `Loại hình — ${t.label}`, group: 'Loại hình hoạt động' })),
    ...Storage.CAPABILITIES.map(c => ({ key: `cap:${c.key}`, label: c.label, group: 'Lĩnh vực / năng lực' })),
    { key: 'rep1:title', label: 'Đại diện 1 — Danh xưng', group: 'Đại diện 1' },
    { key: 'rep1:name', label: 'Đại diện 1 — Họ & tên', group: 'Đại diện 1' },
    { key: 'rep1:position', label: 'Đại diện 1 — Chức vụ DN', group: 'Đại diện 1' },
    { key: 'rep1:degree', label: 'Đại diện 1 — Học hàm/học vị', group: 'Đại diện 1' },
    { key: 'rep1:phone', label: 'Đại diện 1 — Điện thoại', group: 'Đại diện 1' },
    { key: 'rep1:email1', label: 'Đại diện 1 — Email chính', group: 'Đại diện 1' },
    { key: 'rep1:email2', label: 'Đại diện 1 — Email phụ', group: 'Đại diện 1' },
    { key: 'rep1:dob', label: 'Đại diện 1 — Ngày sinh', group: 'Đại diện 1' },
    { key: 'rep1:associationPosition', label: 'Đại diện 1 — Chức vụ hội', group: 'Đại diện 1' },
    { key: 'rep2:title', label: 'Đại diện 2 — Danh xưng', group: 'Đại diện 2' },
    { key: 'rep2:name', label: 'Đại diện 2 — Họ & tên', group: 'Đại diện 2' },
    { key: 'rep2:position', label: 'Đại diện 2 — Chức vụ DN', group: 'Đại diện 2' },
    { key: 'rep2:degree', label: 'Đại diện 2 — Học hàm/học vị', group: 'Đại diện 2' },
    { key: 'rep2:phone', label: 'Đại diện 2 — Điện thoại', group: 'Đại diện 2' },
    { key: 'rep2:email1', label: 'Đại diện 2 — Email chính', group: 'Đại diện 2' },
    { key: 'rep2:email2', label: 'Đại diện 2 — Email phụ', group: 'Đại diện 2' },
    { key: 'rep2:dob', label: 'Đại diện 2 — Ngày sinh', group: 'Đại diện 2' },
    { key: 'feecontact:contactName', label: 'Phụ trách hội phí — Họ & tên', group: 'Thư ký / Hội phí' },
    { key: 'feecontact:contactPhone', label: 'Phụ trách hội phí — Điện thoại', group: 'Thư ký / Hội phí' },
    { key: 'feecontact:contactEmail', label: 'Phụ trách hội phí — Email', group: 'Thư ký / Hội phí' },
    { key: 'membership:joinDate', label: 'Ngày vào hội', group: 'Thư ký / Hội phí' },
  ];
  // Fee-ledger targets are generated per year so a plain <select> can offer "Hội phí 2024 — Mức phí" etc.
  FEE_YEAR_RANGE.forEach(y => {
    TARGET_CATALOG.push({ key: `fee:${y}:fee`, label: `Hội phí ${y} — Mức phí`, group: 'Hội phí theo năm' });
    TARGET_CATALOG.push({ key: `fee:${y}:paidDate`, label: `Hội phí ${y} — Ngày đóng`, group: 'Hội phí theo năm' });
    TARGET_CATALOG.push({ key: `fee:${y}:note`, label: `Hội phí ${y} — Ghi chú`, group: 'Hội phí theo năm' });
  });

  function normalize(text) {
    return String(text == null ? '' : text)
      .toUpperCase().normalize('NFC')
      .replace(/\d{4}/g, '')
      .replace(/[^\p{L}\p{N}]/gu, '');
  }

  function extractYear(text) {
    const m = String(text == null ? '' : text).match(/\b(19\d{2}|20\d{2})\b/);
    return m ? Number(m[1]) : null;
  }

  // Ordered candidate targets for headers that repeat verbatim in the source sheet —
  // occurrence #1 of "HỌ & TÊN" maps to rep1, #2 to rep2, #3 to the fee contact, etc.
  const REPEATED_HEADER_TARGETS = {
    'DANHXƯNG': ['rep1:title', 'rep2:title'],
    'HỌTÊN': ['rep1:name', 'rep2:name', 'feecontact:contactName'],
    'CHỨCVỤDOANHNGHIỆP': ['rep1:position', 'rep2:position'],
    'HỌCHÀMHỌCVỊ': ['rep1:degree', 'rep2:degree'],
    'ĐIỆNTHOẠI': ['rep1:phone', 'rep2:phone', 'feecontact:contactPhone'],
    'EMAILCHÍNH': ['rep1:email1', 'rep2:email1'],
    'EMAILPHỤ': ['rep1:email2', 'rep2:email2'],
    'NGÀYTHÁNGNĂMSINH': ['rep1:dob', 'rep2:dob'],
  };

  const SINGLE_HEADER_TARGETS = {
    'MÃĐƠNVỊ': 'code',
    'TÊNDOANHNGHIỆP': 'nameVN',
    'COMPANYNAME': 'nameEN',
    'NGÀNHNGHỀ': 'industry',
    'ĐỊACHỈTRÊNGIẤYĐKKD': 'addressRegistered',
    'ĐỊACHỈLIÊNLẠCGỬITHƯ': 'addressMailing',
    'PHƯỜNGXÃ': 'ward',
    'NGÀYTHÀNHLẬP': 'establishedDate',
    'DOANHSỐTỈĐỒNG': 'revenue',
    'DOANHSỐXUẤTKHẨU': 'exportPercent',
    'QUYMÔLAOĐỘNG': 'laborSize',
    'WEBSITE': 'website',
    'CHỨCVỤHỘI': 'rep1:associationPosition',
    'NGÀYVÀOHỘI': 'membership:joinDate',
    'EMAIL': 'feecontact:contactEmail',
  };

  Storage.BUSINESS_TYPES.forEach(t => { SINGLE_HEADER_TARGETS[normalize(t.label)] = `bt:${t.key}`; });
  const RAW_CAPABILITY_TEXT = {
    dap: 'Dập', khuon_ep: 'Khuôn ép', duc_nhua: 'Đúc nhựa', khuon_duc_nhua: 'Khuôn đúc nhựa',
    duc_cao_su: 'Đúc cao su', khuon_duc_cao_su: 'Khuôn đúc cao su', gia_cong_co_khi: 'Gia công cơ khí',
    kim_loai_tam: 'Kim loại tấm', duc_trong_luc: 'Đúc/Đúc trọng lực', ren: 'Rèn', dong_hop: 'Đóng hộp',
    xu_ly_be_mat: 'Xử lý bề mặt/Xi mạ', xu_ly_nhiet: 'Xử lý nhiệt', phu_kien_dien: 'Phụ kiện điện/điện tử',
    do_ga_jig: 'Đồ gá (JIG)/Công cụ', lap_rap: 'Lắp ráp', vat_lieu_kim_loai: 'Vật liệu (kim loại)',
    vat_lieu_nhua_cao_su: 'Vật liệu (nhựa, cao su)', bao_bi_in: 'Bao bì, in', dinh_bulong_ocvit: 'Đinh/Bù lông/Ốc vít',
    han: 'Hàn', che_tao_may: 'Chế tạo máy', tu_dong_hoa: 'Tự động hóa',
  };
  Object.keys(RAW_CAPABILITY_TEXT).forEach(key => { SINGLE_HEADER_TARGETS[normalize(RAW_CAPABILITY_TEXT[key])] = `cap:${key}`; });

  function parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const wb = XLSX.read(reader.result, { type: 'array', cellDates: true });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd', defval: '' });
          const headerRowIdx = rows.findIndex(r => r.some(cell => String(cell).trim() !== ''));
          const headers = (rows[headerRowIdx] || []).map(h => String(h).trim());
          const dataRows = rows.slice(headerRowIdx + 1).filter(r => r.some(cell => String(cell).trim() !== ''));
          resolve({ headers, dataRows });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  function guessMapping(headers) {
    const repeatCounters = {};
    const feeSlots = []; // { fee: colIdx|null, paidDate: colIdx|null, note: colIdx|null, year: number|null }

    function feeSlotFor(kind, colIdx, year) {
      // A column with an explicit year always joins/starts that year's slot. Otherwise it
      // continues the most recently opened slot (columns appear in fee → paidDate → note
      // triplets left-to-right) unless that slot's own "kind" is already filled, in which
      // case a new triplet has begun.
      let slot = null;
      if (year != null) {
        slot = feeSlots.find(s => s.year === year);
      } else if (feeSlots.length && feeSlots[feeSlots.length - 1][kind] == null) {
        slot = feeSlots[feeSlots.length - 1];
      }
      if (!slot) { slot = { fee: null, paidDate: null, note: null, year: year || null }; feeSlots.push(slot); }
      slot[kind] = colIdx;
      if (year != null) slot.year = year;
      return slot;
    }

    const mapping = headers.map((raw, colIdx) => {
      const year = extractYear(raw);
      const norm = normalize(raw);
      if (norm === 'MỨCPHÍ') return { pending: 'fee', slotRef: feeSlotFor('fee', colIdx, year) };
      if (norm.startsWith('NGÀYĐÓNG')) return { pending: 'paidDate', slotRef: feeSlotFor('paidDate', colIdx, year) };
      if (norm === 'GHICHÚ') return { pending: 'note', slotRef: feeSlotFor('note', colIdx, year) };
      if (norm === 'STT' || norm === 'TUỔIDOANHNGHIỆP' || norm === 'NGÀYSINH' || norm === 'THÁNGSINH' || norm === 'NĂMSINH') return { target: null };

      if (REPEATED_HEADER_TARGETS[norm]) {
        const list = REPEATED_HEADER_TARGETS[norm];
        const idx = repeatCounters[norm] || 0;
        repeatCounters[norm] = idx + 1;
        return { target: list[idx] || null };
      }
      if (SINGLE_HEADER_TARGETS[norm]) return { target: SINGLE_HEADER_TARGETS[norm] };
      return { target: null };
    });

    // Resolve default years for fee slots that had no explicit year in their header text —
    // assume left-to-right = oldest-to-newest, most recent slot = current year.
    const undated = feeSlots.filter(s => s.year == null);
    undated.forEach((s, i) => { s.year = CURRENT_YEAR - (undated.length - 1 - i); });

    return mapping.map(entry => {
      if (entry.target !== undefined) return entry.target;
      const y = entry.slotRef.year;
      return `fee:${y}:${entry.pending}`;
    });
  }

  function setByTarget(company, target, value) {
    if (!target || value === '' || value == null) return;
    if (target.startsWith('bt:')) {
      const key = target.slice(3);
      if (String(value).trim() && !company.businessTypes.includes(key)) company.businessTypes.push(key);
      return;
    }
    if (target.startsWith('cap:')) {
      const key = target.slice(4);
      if (String(value).trim() && !company.capabilities.includes(key)) company.capabilities.push(key);
      return;
    }
    if (target.startsWith('rep1:')) { company.contacts[0][target.slice(5)] = value; return; }
    if (target.startsWith('rep2:')) { company.contacts[1][target.slice(5)] = value; return; }
    if (target.startsWith('feecontact:')) { company.membership[target.slice(11)] = value; return; }
    if (target.startsWith('membership:')) { company.membership[target.slice(11)] = value; return; }
    if (target.startsWith('fee:')) {
      const [, yearStr, sub] = target.split(':');
      const year = Number(yearStr);
      let entry = company.membership.fees.find(f => f.year === year);
      if (!entry) { entry = { year, fee: 0, paidDate: '', note: '' }; company.membership.fees.push(entry); }
      entry[sub] = sub === 'fee' ? (Number(String(value).replace(/[^\d.-]/g, '')) || 0) : value;
      return;
    }
    company[target] = value;
  }

  function buildCompaniesFromMapping(dataRows, mapping, groupId) {
    const companies = [];
    dataRows.forEach(row => {
      const company = Storage.emptyCompany(groupId);
      mapping.forEach((target, colIdx) => setByTarget(company, target, row[colIdx]));
      if (company.nameVN && company.nameVN.trim()) {
        company.membership.fees.sort((a, b) => a.year - b.year);
        companies.push(company);
      }
    });
    return companies;
  }

  return { TARGET_CATALOG, parseFile, guessMapping, buildCompaniesFromMapping, CURRENT_YEAR };
})();
